import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError } from '@/lib/error';
import { verifyAuth } from '@/lib/auth-middleware';
import { deployMiningContract, registerMiningContract } from '@/lib/server-wallet/mining';
import { 
  validateMiningDeploymentParams, 
  buildDeploymentParams,
  type MiningDeploymentRequest 
} from './config';

/**
 * 部署挖矿合约API
 * POST /api/agents/[id]/deploy-mining
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id;
    
    // 验证用户身份
    const decoded = await verifyAuth(request) as { address: string };

    // 获取Agent信息并验证权限
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        creator: {
          select: { address: true }
        }
      }
    });

    if (!agent) {
      return NextResponse.json(
        { code: 404, message: '找不到Agent' },
        { status: 404 }
      );
    }

    // 验证是否为Agent创建者
    if (agent.creator.address.toLowerCase() !== decoded.address.toLowerCase()) {
      return NextResponse.json(
        { code: 403, message: '只有Agent创建者可以执行此操作' },
        { status: 403 }
      );
    }

    // 解析请求体
    const requestBody = await request.json() as MiningDeploymentRequest;
    
    // 验证参数
    const validation = validateMiningDeploymentParams(requestBody);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          code: 400, 
          message: '参数验证失败',
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    // 检查是否已经部署过挖矿合约
    if ((agent as any).miningContractAddress) {
      return NextResponse.json(
        { 
          code: 400, 
          message: '挖矿合约已经部署',
          miningContractAddress: (agent as any).miningContractAddress
        },
        { status: 400 }
      );
    }

    // 检查是否存在正在进行中的挖矿合约部署任务
    const existingTask = await prisma.task.findFirst({
      where: {
        agentId,
        type: 'DEPLOY_MINING',
        status: {
          in: ['PENDING', 'PROCESSING']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingTask) {
      return NextResponse.json(
        { 
          code: 400, 
          message: '已存在进行中的挖矿合约部署任务，请等待完成',
          taskId: existingTask.id,
          taskStatus: existingTask.status,
          taskCreatedAt: existingTask.createdAt
        },
        { status: 400 }
      );
    }

    // 创建任务记录
    const task = await prisma.task.create({
      data: {
        type: 'DEPLOY_MINING',
        status: 'PENDING',
        agentId,
        createdBy: decoded.address,
      },
    });

    // 在后台执行挖矿合约部署任务
    processMiningDeploymentTask(task.id, agentId, requestBody).catch(error => {
      console.error(`[后台任务失败] 挖矿合约部署任务 ${task.id} 失败:`, error);
    });

    // 立即返回成功响应
    return createSuccessResponse({
      taskId: task.id,
    }, '已成功提交挖矿合约部署任务，请稍后查询结果');

  } catch (error) {
    console.error('提交挖矿合约部署任务过程中发生错误:', error);
    return handleError(error);
  }
}

/**
 * 后台处理挖矿合约部署任务
 */
async function processMiningDeploymentTask(
  taskId: string, 
  agentId: string, 
  requestParams: MiningDeploymentRequest
) {
  try {
    console.log(`[挖矿合约部署] 开始为Agent ${agentId} 部署挖矿合约...`);
    
    // 开始处理，更新任务状态
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });
    
    // 构建完整的部署参数
    const deploymentParams = buildDeploymentParams(requestParams);
    
    console.log(`[挖矿合约部署] 部署参数:`, JSON.stringify(deploymentParams, null, 2));

    // 调用部署函数
    const deployResult = await deployMiningContract({
      nft: deploymentParams.nft as `0x${string}`,
      owner: deploymentParams.owner as `0x${string}`,
      project_name: deploymentParams.project_name,
      reward_amount_per_year: deploymentParams.reward_amount_per_year,
      reward_token: deploymentParams.reward_token as `0x${string}`,
    });

    if (!deployResult.success || !deployResult.data?.proxy_address) {
      console.error(`[挖矿合约部署] 失败原因: ${deployResult.error}`);

      // 更新任务状态为失败
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          result: JSON.stringify({
            error: `挖矿合约部署失败: ${deployResult.error}`
          }),
          completedAt: new Date(),
        },
      });

      return;
    }

    const miningContractAddress = deployResult.data.proxy_address;
    console.log(`[完成] 挖矿合约部署完成`);
    console.log(`[完成] 挖矿合约地址: ${miningContractAddress}`);
    
    // 立即进行合约注册
    console.log(`[挖矿合约注册] 开始注册挖矿合约到主合约...`);
    
    const registrationResult = await registerMiningContract({
      projectName: deploymentParams.project_name,
      stakingType: 2, // 固定值
      contractAddress: miningContractAddress as `0x${string}`,
    });

    if (registrationResult.status !== 'confirmed') {
      console.error(`[挖矿合约注册] 注册失败: ${registrationResult.error}`);
      
      // 检查是否是"项目已注册"的错误
      const isAlreadyRegistered = registrationResult.error?.includes('Project already registered') || 
                                  registrationResult.error?.includes('already registered');
      
      // 即使注册失败，也保存部署的合约地址
      const updateData: any = {
        miningContractAddress: miningContractAddress,
        miningContractRegistered: isAlreadyRegistered, // 如果已注册则标记为true
      };
      
      await prisma.agent.update({
        where: { id: agentId },
        data: updateData,
      });
      
      if (isAlreadyRegistered) {
        console.log(`[更新] Agent挖矿合约地址已保存，项目已存在注册（视为成功）`);
        
        // 项目已注册，视为成功完成
        await prisma.task.update({
          where: { id: taskId },
          data: {
            status: 'COMPLETED',
            result: JSON.stringify({
              miningContractAddress: miningContractAddress,
              deploymentSuccess: true,
              registrationSuccess: true,
              registrationSkipped: true,
              registrationNote: '项目已在主合约中注册，跳过重复注册'
            }),
            completedAt: new Date(),
          },
        });
      } else {
        console.log(`[更新] Agent挖矿合约地址已保存，但注册失败`);
        
        // 真正的注册失败，标记为失败
        await prisma.task.update({
          where: { id: taskId },
          data: {
            status: 'FAILED',
            result: JSON.stringify({
              miningContractAddress: miningContractAddress,
              deploymentSuccess: true,
              registrationSuccess: false,
              registrationError: registrationResult.error,
              note: '合约部署成功但注册失败，请检查错误并重试'
            }),
            completedAt: new Date(),
          },
        });
      }

      return;
    }

    console.log(`[完成] 挖矿合约注册完成`);
    console.log(`[完成] 注册交易哈希: ${registrationResult.txHash}`);
    
    // 更新Agent记录 - 部署和注册都成功
    const successUpdateData: any = {
      miningContractAddress: miningContractAddress,
      miningContractRegistered: true,
      miningRegistrationTxHash: registrationResult.txHash,
    };
    
    await prisma.agent.update({
      where: { id: agentId },
      data: successUpdateData,
    });
    
    console.log(`[更新] Agent挖矿合约地址和注册状态已保存`);

    // 更新任务状态为完全成功
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        result: JSON.stringify({
          miningContractAddress: miningContractAddress,
          deploymentSuccess: true,
          registrationSuccess: true,
          registrationTxHash: registrationResult.txHash,
        }),
        completedAt: new Date(),
      },
    });

  } catch (error: any) {
    console.error(`[挖矿合约部署] 处理失败:`, error);
    
    // 更新任务状态为失败
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'FAILED',
        result: JSON.stringify({
          error: error.message || '未知错误'
        }),
        completedAt: new Date(),
      },
    });
  }
}