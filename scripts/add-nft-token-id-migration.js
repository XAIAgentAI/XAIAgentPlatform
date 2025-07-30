/**
 * 手动添加 nftTokenId 字段到 Agent 表的迁移脚本
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addNftTokenIdColumn() {
  try {
    console.log('🔄 开始添加 nftTokenId 字段到 Agent 表...');
    
    // 检查字段是否已存在
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Agent' AND column_name = 'nftTokenId'
    `;
    
    if (result.length > 0) {
      console.log('✅ nftTokenId 字段已存在，跳过迁移');
      return;
    }
    
    // 添加字段
    await prisma.$executeRaw`ALTER TABLE "Agent" ADD COLUMN "nftTokenId" TEXT`;
    
    console.log('✅ 成功添加 nftTokenId 字段到 Agent 表');
    
    // 验证字段是否添加成功
    const verifyResult = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Agent' AND column_name = 'nftTokenId'
    `;
    
    console.log('🔍 验证结果:', verifyResult);
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行迁移
addNftTokenIdColumn()
  .then(() => {
    console.log('🎉 迁移完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 迁移失败:', error);
    process.exit(1);
  }); 