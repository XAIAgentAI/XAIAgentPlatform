import { prisma } from '../src/lib/prisma';
import { localAgents } from '../src/data/localAgents';

async function syncAgents() {
  try {
    console.log('开始同步 Agents 数据...');

    // 创建一个系统用户作为创建者
    const systemUser = await prisma.user.upsert({
      where: { address: '0x000000000000000000000000000000000000dEaD' },
      update: {
        nickname: 'System',
      },
      create: {
        id: 'system',
        address: '0x000000000000000000000000000000000000dEaD',
        nickname: 'System',
      },
    });

    console.log('系统用户已创建/更新:', systemUser.id);

    // 同步每个 agent
    for (const localAgent of localAgents) {
      // 准备 capabilities 数据
      const capabilities = [
        localAgent.description,
        ...(localAgent.useCases || []),
      ];

      // 准备多语言描述
      const longDescription = JSON.stringify({
        en: localAgent.detailDescription || localAgent.description,
        ja: localAgent.descriptionJA,
        ko: localAgent.descriptionKO,
        zh: localAgent.descriptionZH,
      });

      // 准备多语言状态
      const status = JSON.stringify({
        en: localAgent.status,
        ja: localAgent.statusJA,
        ko: localAgent.statusKO,
        zh: localAgent.statusZH,
      });

      // 准备多语言用例
      const useCases = JSON.stringify({
        en: localAgent.useCases,
        ja: localAgent.useCasesJA,
        ko: localAgent.useCasesKO,
        zh: localAgent.useCasesZH,
      });

      // 更新或创建 agent
      const agent = await prisma.agent.upsert({
        where: { id: String(localAgent.id) },
        update: {
          name: localAgent.name,
          description: localAgent.description || '',
          longDescription,
          category: localAgent.type,
          avatar: localAgent.avatar,
          status,
          capabilities: JSON.stringify(capabilities),
          rating: 5, // 默认评分
          usageCount: 0,
          creatorId: systemUser.id,
        },
        create: {
          id: String(localAgent.id),
          name: localAgent.name,
          description: localAgent.description || '',
          longDescription,
          category: localAgent.type,
          avatar: localAgent.avatar,
          status,
          capabilities: JSON.stringify(capabilities),
          rating: 5, // 默认评分
          usageCount: 0,
          creatorId: systemUser.id,
        },
      });

      console.log(`Agent 已同步: ${agent.name} (ID: ${agent.id})`);

      // 为 XAA (ID: 1) 创建初始价格记录
      if (localAgent.id === 1) {
        await prisma.agentPrice.create({
          data: {
            agentId: agent.id,
            price: 0, // 初始价格
            timestamp: new Date(),
          },
        });
        console.log('XAA 初始价格记录已创建');
      }
    }

    console.log('所有 Agents 数据同步完成！');
  } catch (error) {
    console.error('同步失败:', error);
    throw error;
  }
}

// 执行同步
syncAgents()
  .then(() => {
    console.log('同步脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('同步脚本执行失败:', error);
    process.exit(1);
  }); 