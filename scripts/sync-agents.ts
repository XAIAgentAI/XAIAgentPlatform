import { PrismaClient } from '@prisma/client';
import type { LocalAgent } from './localAgents';
import { localAgents } from './localAgents';

const prisma = new PrismaClient();

// 类型守卫函数
function isLocalAgent(value: unknown): value is LocalAgent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as any).id === 'string' &&
    'name' in value &&
    'avatar' in value &&
    'type' in value
  );
}

async function main() {
  try {
    // 创建默认用户
    const defaultUser = await prisma.user.upsert({
      where: { address: '0x0000000000000000000000000000000000000000' },
      update: {},
      create: {
        address: '0x0000000000000000000000000000000000000000',
        nickname: 'System',
      },
    });

    console.log(`开始同步 ${localAgents.length} 个本地 agents`);

    // 更新每个 agent
    for (const agent of localAgents) {
      await prisma.agent.upsert({
        where: { id: agent.id.toString() },
        update: {
          name: agent.name,
          description: agent.description || '',
          longDescription: agent.detailDescription || '',
          category: agent.type || 'default',
          avatar: agent.avatar || '',
          status: agent.status,
          capabilities: JSON.stringify([]),
          rating: 0,
          usageCount: 0,
          marketCap: agent.marketCap,
          change24h: agent.change24h,
          volume24h: agent.volume24h,
          creatorId: defaultUser.id,
          type: agent.type,
          tvl: agent.tvl || '',
          holdersCount: agent.holdersCount || 0,
          socialLinks: agent.socialLinks || '',
          symbol: agent.symbol || '',
          totalSupply: agent.totalSupply || 0,
          marketCapTokenNumber: agent.marketCapTokenNumber || 0,
          chatEntry: agent.chatEntry || '',
          useCases: agent.useCases ? JSON.stringify(agent.useCases) : '',
          useCasesJA: agent.useCasesJA ? JSON.stringify(agent.useCasesJA) : '',
          useCasesKO: agent.useCasesKO ? JSON.stringify(agent.useCasesKO) : '',
          useCasesZH: agent.useCasesZH ? JSON.stringify(agent.useCasesZH) : '',
          statusJA: agent.statusJA || '',
          statusKO: agent.statusKO || '',
          statusZH: agent.statusZH || '',
          descriptionJA: agent.descriptionJA || '',
          descriptionKO: agent.descriptionKO || '',
          descriptionZH: agent.descriptionZH || '',
          lifetime: agent.lifetime || '',
          tokenAddress: agent.tokenAddress || '',
          iaoContractAddress: agent.iaoContractAddress || '',
          tokenAddressTestnet: agent.tokenAddressTestnet || '',
          iaoContractAddressTestnet: agent.iaoContractAddressTestnet || '',
          projectDescription: agent.projectDescription || '',
          iaoTokenAmount: agent.iaoTokenAmount || 0,
        },
        create: {
          id: agent.id.toString(),
          name: agent.name,
          description: agent.description || '',
          longDescription: agent.detailDescription || '',
          category: agent.type || 'default',
          avatar: agent.avatar || '',
          status: agent.status,
          capabilities: JSON.stringify([]),
          rating: 0,
          usageCount: 0,
          marketCap: agent.marketCap,
          change24h: agent.change24h,
          volume24h: agent.volume24h,
          creatorId: defaultUser.id,
          type: agent.type,
          tvl: agent.tvl || '',
          holdersCount: agent.holdersCount || 0,
          socialLinks: agent.socialLinks || '',
          symbol: agent.symbol || '',
          totalSupply: agent.totalSupply || 0,
          marketCapTokenNumber: agent.marketCapTokenNumber || 0,
          chatEntry: agent.chatEntry || '',
          useCases: agent.useCases ? JSON.stringify(agent.useCases) : '',
          useCasesJA: agent.useCasesJA ? JSON.stringify(agent.useCasesJA) : '',
          useCasesKO: agent.useCasesKO ? JSON.stringify(agent.useCasesKO) : '',
          useCasesZH: agent.useCasesZH ? JSON.stringify(agent.useCasesZH) : '',
          statusJA: agent.statusJA || '',
          statusKO: agent.statusKO || '',
          statusZH: agent.statusZH || '',
          descriptionJA: agent.descriptionJA || '',
          descriptionKO: agent.descriptionKO || '',
          descriptionZH: agent.descriptionZH || '',
          lifetime: agent.lifetime || '',
          tokenAddress: agent.tokenAddress || '',
          iaoContractAddress: agent.iaoContractAddress || '',
          tokenAddressTestnet: agent.tokenAddressTestnet || '',
          iaoContractAddressTestnet: agent.iaoContractAddressTestnet || '',
          projectDescription: agent.projectDescription || '',
          iaoTokenAmount: agent.iaoTokenAmount || 0,
        },
      });
      console.log(`已更新 agent: ${agent.name}`);
    }

    console.log('同步完成！');
  } catch (error) {
    console.error('同步失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error); 