import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // 首先删除所有相关的外键数据
    console.log('正在删除相关数据...');
    
    // 删除 AgentPrice 数据
    await prisma.agentPrice.deleteMany();
    console.log('已清空 AgentPrice 表');
    
    // 删除 History 数据
    await prisma.history.deleteMany();
    console.log('已清空 History 表');
    
    // 删除 Review 数据
    await prisma.review.deleteMany();
    console.log('已清空 Review 表');
    
    // 删除 Example 数据
    await prisma.example.deleteMany();
    console.log('已清空 Example 表');
    
    // 最后删除 Agent 数据
    const result = await prisma.agent.deleteMany();
    console.log(`已清空 Agent 表，共删除 ${result.count} 条记录`);
    
    console.log('所有 Agent 相关数据已清空');
  } catch (error) {
    console.error('清空数据时出错:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 