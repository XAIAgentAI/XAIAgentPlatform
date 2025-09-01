import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // 首先创建一个测试用户
  const user = await prisma.user.upsert({
    where: { address: '0x123456789' },
    update: {},
    create: {
      id: uuidv4(),
      address: '0x123456789',
      nickname: 'Test User',
      avatar: 'https://avatars.githubusercontent.com/u/1234567?v=4',
    },
  });

  // 创建一些测试 Agent 数据
  const agents = [
    {
      id: uuidv4(),
      name: 'GPT-4 Agent',
      description: '基于 GPT-4 的智能助手',
      category: 'AI Agent',
      marketCap: '1000000',
      change24h: '5.2',
      volume24h: '50000',
      capabilities: JSON.stringify(['对话', '编程', '分析']),
      creatorId: user.id,
    },
    {
      id: uuidv4(),
      name: 'Claude Agent',
      description: '基于 Claude 的智能助手',
      category: 'AI Agent',
      marketCap: '800000',
      change24h: '-2.1',
      volume24h: '30000',
      capabilities: JSON.stringify(['对话', '写作', '研究']),
      creatorId: user.id,
    },
    {
      id: uuidv4(),
      name: 'DALL-E Agent',
      description: '基于 DALL-E 的图像生成助手',
      category: 'AI Agent',
      marketCap: '500000',
      change24h: '10.5',
      volume24h: '20000',
      capabilities: JSON.stringify(['图像生成', '图像编辑']),
      creatorId: user.id,
    },
  ];

  for (const agent of agents) {
    await prisma.agent.create({
      data: agent,
    });
  }

  await prisma.agent.update({
    where: { id: '1' },
    data: {
      projectDescription: JSON.stringify({
        en: "1. Total Supply: 5,000,000,000 tokens\n2. IAO Allocation: 10% of total supply\n3. IAO Duration: 7 days\n4. Trading Pair: TOKEN/ETH",
        zh: "1. 总供应量：5,000,000,000 代币\n2. IAO 分配：总供应量的 10%\n3. IAO 持续时间：7 天\n4. 交易对：TOKEN/ETH",
        ja: "1. 総供給量：5,000,000,000 トークン\n2. IAO 配分：総供給量の 10%\n3. IAO 期間：7 日間\n4. 取引ペア：TOKEN/ETH",
        ko: "1. 총 공급량: 5,000,000,000 토큰\n2. IAO 할당: 총 공급량의 10%\n3. IAO 기간: 7일\n4. 거래 쌍: TOKEN/ETH"
      }),
    } as any,
  });

  console.log('数据库种子数据已添加');
}

main()
  .catch((e) => {
    console.error('种子数据添加失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 