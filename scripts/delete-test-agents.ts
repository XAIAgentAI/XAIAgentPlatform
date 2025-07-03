import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('开始删除测试 Agent...');

    // 查找所有名称包含 'Test Agent' 的 agents
    const testAgents = await prisma.agent.findMany({
      where: {
        name: {
          contains: 'Test Agent',
          mode: 'insensitive' // 不区分大小写
        }
      }
    });

    console.log(`找到 ${testAgents.length} 个测试 Agent`);

    // 删除相关的历史记录
    for (const agent of testAgents) {
      // History table has been removed
      console.log(`已删除 Agent ${agent.name} 的历史记录`);
    }

    // 删除相关的评价
    for (const agent of testAgents) {
      await prisma.review.deleteMany({
        where: {
          agentId: agent.id
        }
      });
      console.log(`已删除 Agent ${agent.name} 的评价`);
    }

    // 删除相关的示例
    for (const agent of testAgents) {
      await prisma.example.deleteMany({
        where: {
          agentId: agent.id
        }
      });
      console.log(`已删除 Agent ${agent.name} 的示例`);
    }

    // 删除相关的价格记录
    for (const agent of testAgents) {
      await prisma.agentPrice.deleteMany({
        where: {
          agentId: agent.id
        }
      });
      console.log(`已删除 Agent ${agent.name} 的价格记录`);
    }

    // 最后删除 agents
    const deleteResult = await prisma.agent.deleteMany({
      where: {
        name: {
          contains: 'Test Agent',
          mode: 'insensitive'
        }
      }
    });

    console.log(`成功删除 ${deleteResult.count} 个测试 Agent`);
    console.log('清理完成！');

  } catch (error) {
    console.error('删除测试 Agent 时出错:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error); 