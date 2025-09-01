/**
 * Owner管理功能测试脚本
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOwnerManagement() {
  try {
    console.log('🚀 开始测试Owner管理功能...');

    // 1. 查找一个测试Agent
    const testAgent = await prisma.agent.findFirst({
      where: {
        tokenAddress: {
          not: null
        }
      },
      include: {
        creator: true
      }
    });

    if (!testAgent) {
      console.log('❌ 没有找到有代币地址的Agent，请先创建一个测试Agent');
      return;
    }

    console.log(`✅ 找到测试Agent: ${testAgent.name} (${testAgent.id})`);
    console.log(`   代币地址: ${testAgent.tokenAddress}`);
    console.log(`   创建者: ${testAgent.creator.address}`);

    // 2. 检查当前状态
    console.log('\n📊 当前Owner管理状态:');
    console.log(`   流动性添加: ${testAgent.liquidityAdded ? '✅ 已完成' : '❌ 未完成'}`);
    console.log(`   代币销毁: ${testAgent.tokensBurned ? '✅ 已完成' : '❌ 未完成'}`);
    console.log(`   代币Owner转移: ${testAgent.ownerTransferred ? '✅ 已完成' : '❌ 未完成'}`);
    console.log(`   挖矿Owner转移: ${testAgent.miningOwnerTransferred ? '✅ 已完成' : '❌ 未完成'}`);

    // 3. 测试API端点（模拟）
    console.log('\n🔧 测试API端点:');
    
    const baseUrl = 'http://localhost:3000';
    const agentId = testAgent.id;

    console.log(`   流动性添加: POST ${baseUrl}/api/agents/${agentId}/add-liquidity`);
    console.log(`   代币销毁: POST ${baseUrl}/api/agents/${agentId}/burn-tokens`);
    console.log(`   Owner转移: POST ${baseUrl}/api/agents/${agentId}/transfer-ownership`);

    // 4. 检查任务表
    const tasks = await prisma.task.findMany({
      where: {
        agentId: testAgent.id,
        type: {
          in: ['ADD_LIQUIDITY', 'BURN_TOKENS', 'TRANSFER_TOKEN_OWNERSHIP', 'TRANSFER_MINING_OWNERSHIP']
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`\n📋 相关任务记录 (${tasks.length}条):`);
    tasks.forEach(task => {
      console.log(`   ${task.type}: ${task.status} (${task.createdAt.toISOString()})`);
    });

    // 5. 生成测试数据
    console.log('\n🧪 生成测试数据:');
    
    const testData = {
      liquidityRequest: {
        liquidityAmount: (Number(testAgent.totalSupply || 0) * 0.1).toString(),
        xaaAmount: "1000"
      },
      burnRequest: {
        burnAmount: "50"
      },
      ownershipRequest: {
        transferType: "both"
      }
    };

    console.log('   流动性添加请求体:');
    console.log('   ', JSON.stringify(testData.liquidityRequest, null, 2));
    
    console.log('   代币销毁请求体:');
    console.log('   ', JSON.stringify(testData.burnRequest, null, 2));
    
    console.log('   Owner转移请求体:');
    console.log('   ', JSON.stringify(testData.ownershipRequest, null, 2));

    console.log('\n✅ Owner管理功能测试完成！');
    console.log('\n📝 下一步:');
    console.log('   1. 启动开发服务器: bun dev');
    console.log('   2. 访问测试页面: http://localhost:3000/test-owner-management');
    console.log('   3. 使用Postman或curl测试API端点');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testOwnerManagement();
}

export { testOwnerManagement };
