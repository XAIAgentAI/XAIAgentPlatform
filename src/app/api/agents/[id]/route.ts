import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
import { getUserId } from '@/lib/auth';

// 获取 Agent 详情
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: String(params.id) },
      include: {
        creator: {
          select: {
            address: true,
          },
        },
        examples: true,
        _count: {
          select: {
            reviews: true,
            history: true,
          },
        },
      },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent不存在');
    }

    return createSuccessResponse({
      ...agent,
      capabilities: JSON.parse(agent.capabilities),
      creatorAddress: agent.creator.address,
      reviewCount: agent._count.reviews,
      historyCount: agent._count.history,
      totalSupply: agent.totalSupply ? Number(agent.totalSupply) : null,
      tokenAddress: process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? agent.tokenAddressTestnet : agent.tokenAddress,
      iaoContractAddress: process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? agent.iaoContractAddressTestnet : agent.iaoContractAddress,
      projectDescription: (agent as any).projectDescription,
      containerLink: (agent as any).containerLink,
    });
  } catch (error) {
    return handleError(error);
  }
}

// 更新 Agent
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new ApiError(401, '未授权');
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: { creatorId: true },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent不存在');
    }

    if (agent.creatorId !== userId) {
      throw new ApiError(403, '无权限修改');
    }

    const body = await request.json();
    const {
      name,
      description,
      longDescription,
      category,
      avatar,
      capabilities,
      examples,
      containerLink,
      updateStartTime,
      updateEndTime
    } = body;

    console.log('Updating agent with data:', { 
      name, 
      description, 
      category, 
      containerLink,
      updateStartTime,
      updateEndTime,
      body: JSON.stringify(body, null, 2)
    });

    // 验证必填字段
    if (!name || !description || !category || !capabilities) {
      throw new ApiError(400, '缺少必要参数');
    }

    // 获取完整的Agent信息，包括合约地址和创建者地址
    const fullAgent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            address: true
          }
        }
      }
    });

    if (!fullAgent) {
      throw new ApiError(404, 'Agent不存在');
    }

    // 如果提供了时间更新参数，并且存在IAO合约地址，则更新合约时间
    if (updateStartTime && updateEndTime && fullAgent.iaoContractAddress) {
      console.log(`[时间更新] 检查是否需要更新IAO合约时间...`);
      
      // 获取当前的开始和结束时间
      const currentStartTime = fullAgent.iaoStartTime ? Math.floor(new Date(fullAgent.iaoStartTime).getTime() / 1000) : null;
      const currentEndTime = fullAgent.iaoEndTime ? Math.floor(new Date(fullAgent.iaoEndTime).getTime() / 1000) : null;
      
      console.log(`[时间更新] 当前开始时间: ${currentStartTime}`);
      console.log(`[时间更新] 当前结束时间: ${currentEndTime}`);
      console.log(`[时间更新] 新开始时间: ${updateStartTime}`);
      console.log(`[时间更新] 新结束时间: ${updateEndTime}`);
      
      // 判断时间是否发生变化
      const timeChanged = (
        currentStartTime === null || 
        currentEndTime === null || 
        Math.abs(currentStartTime - updateStartTime) > 60 || // 允许1分钟的误差
        Math.abs(currentEndTime - updateEndTime) > 60
      );
      
      if (!timeChanged) {
        console.log(`[时间更新] 时间未发生显著变化，跳过合约更新`);
        
        // 仅更新数据库中的时间记录，不调用合约
        await prisma.agent.update({
          where: { id: params.id },
          data: {
            iaoStartTime: new Date(updateStartTime * 1000),
            iaoEndTime: new Date(updateEndTime * 1000),
          },
        });
      } else {
        console.log(`[时间更新] 时间发生显著变化，开始更新合约...`);
        console.log(`[时间更新] IAO合约地址: ${fullAgent.iaoContractAddress}`);
        console.log(`[时间更新] 创建者地址: ${fullAgent.creator.address}`);
      
        try {
          // 记录开始更新时间的历史
          await prisma.history.create({
            data: {
              action: 'update_time_start',
              result: 'processing',
              agentId: params.id,
            },
          });
          
          // 调用合约API设置时间
          const setTimeResponse = await fetch("http://3.0.25.131:8070/contracts/set-time-for", {
            method: "POST",
            headers: {
              "accept": "application/json",
              "content-type": "application/json",
              "authorization": "Basic YWRtaW46MTIz"
            },
            body: JSON.stringify({
              iao_address: fullAgent.iaoContractAddress,
              owner: fullAgent.creator.address,
              start_time: updateStartTime,
              end_time: updateEndTime
            })
          });

          const setTimeResult = await setTimeResponse.json();
          console.log(`[时间更新] 设置时间结果:`, setTimeResult);
          
          if (setTimeResult.code !== 200) {
            console.error(`[时间更新] 失败原因: ${setTimeResult.message || '未知错误'}`);
            // 记录时间设置失败历史
            await prisma.history.create({
              data: {
                action: 'update_time',
                result: 'failed',
                agentId: params.id,
                error: `设置IAO时间失败: ${setTimeResult.message || '未知错误'}`
              },
            });
          } else {
            console.log(`[时间更新] 合约时间更新成功`);
            
            // 记录时间设置成功历史
            await prisma.history.create({
              data: {
                action: 'update_time',
                result: 'success',
                agentId: params.id,
              },
            });
            
            // 更新Agent记录中的开始和结束时间
            await prisma.agent.update({
              where: { id: params.id },
              data: {
                iaoStartTime: new Date(updateStartTime * 1000),
                iaoEndTime: new Date(updateEndTime * 1000),
              },
            });
          }
        } catch (error) {
          console.error('更新IAO合约时间过程中发生错误:', error);
          
          // 记录时间设置错误历史
          await prisma.history.create({
            data: {
              action: 'update_time',
              result: 'failed',
              agentId: params.id,
              error: `设置IAO时间时发生错误: ${error instanceof Error ? error.message : '未知错误'}`
            },
          });
        }
      }
    }

    // 更新 Agent
    const updatedAgent = await prisma.agent.update({
      where: { id: params.id },
      data: {
        name,
        description,
        longDescription,
        category,
        avatar,
        capabilities: JSON.stringify(capabilities),
        containerLink,
        examples: examples
          ? {
              deleteMany: {},
              createMany: {
                data: examples.map((example: any) => ({
                  title: example.title,
                  description: example.description,
                  prompt: example.prompt,
                })),
              },
            }
          : undefined,
      } as any,
      include: {
        creator: {
          select: {
            address: true,
          },
        },
        examples: true,
      },
    });

    return createSuccessResponse({
      ...updatedAgent,
      capabilities: JSON.parse(updatedAgent.capabilities),
      creatorAddress: updatedAgent.creator.address,
    }, '更新成功');
  } catch (error) {
    return handleError(error);
  }
}

// 更新 Agent
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new ApiError(401, '未授权');
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: { creatorId: true },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent不存在');
    }

    if (agent.creatorId !== userId) {
      throw new ApiError(403, '无权限更新');
    }

    const data = await request.json();
    
    // 更新 Agent
    const updatedAgent = await prisma.agent.update({
      where: { id: params.id },
      data: {
        projectDescription: data.projectDescription,
      } as any,
    });

    return createSuccessResponse(updatedAgent, '更新成功');
  } catch (error) {
    return handleError(error);
  }
}

// 删除 Agent
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new ApiError(401, '未授权');
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: { creatorId: true },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent不存在');
    }

    if (agent.creatorId !== userId) {
      throw new ApiError(403, '无权限删除');
    }

    // 删除 Agent
    await prisma.agent.delete({
      where: { id: params.id },
    });

    return createSuccessResponse(null, '删除成功');
  } catch (error) {
    return handleError(error);
  }
} 