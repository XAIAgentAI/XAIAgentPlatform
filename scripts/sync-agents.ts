import { PrismaClient } from '@prisma/client';
import type { LocalAgent } from './localAgents';

const prisma = new PrismaClient();

// 类型守卫函数
function isLocalAgent(value: unknown): value is LocalAgent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as any).id === 'number' &&
    'name' in value &&
    'avatar' in value &&
    'type' in value
  );
}

async function main() {
  try {
    // 动态导入本地代理数据
    const { localAgents } = await import('./localAgents');
    
    console.log(`找到 ${localAgents.length} 个代理需要同步`);

    // 同步每个代理到数据库
    for (const agent of localAgents) {
      // 首先确保创建者存在
      const creatorAddress = agent.creatorAddress || '0x0000000000000000000000000000000000000000';
      let creator = await prisma.user.findUnique({
        where: { address: creatorAddress }
      });

      if (!creator) {
        creator = await prisma.user.create({
          data: {
            address: creatorAddress,
            nickname: `Creator of ${agent.name}`,
          }
        });
        console.log(`创建了新用户: ${creator.address}`);
      }

      const capabilities = agent.useCases ? JSON.stringify(agent.useCases) : '';
      
      await prisma.agent.upsert({
        where: { id: String(agent.id) },
        update: {
          name: agent.name,
          description: agent.description || '',
          longDescription: agent.detailDescription || '',
          category: agent.type,
          avatar: agent.avatar,
          status: agent.status,
          capabilities,
          rating: 0, // 默认值
          usageCount: 0, // 默认值
          marketCap: agent.marketCap,
          change24h: agent.change24h,
          volume24h: agent.volume24h,
          creatorId: creator.id,
          type: agent.type,
          tvl: agent.tvl,
          holdersCount: agent.holdersCount,
          socialLinks: agent.socialLinks || '',
          symbol: agent.symbol,
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
        },
        create: {
          id: String(agent.id),
          name: agent.name,
          description: agent.description || '',
          longDescription: agent.detailDescription || '',
          category: agent.type,
          avatar: agent.avatar,
          status: agent.status,
          capabilities,
          rating: 0, // 默认值
          usageCount: 0, // 默认值
          marketCap: agent.marketCap,
          change24h: agent.change24h,
          volume24h: agent.volume24h,
          creatorId: creator.id,
          type: agent.type,
          tvl: agent.tvl,
          holdersCount: agent.holdersCount,
          socialLinks: agent.socialLinks || '',
          symbol: agent.symbol,
          totalSupply: agent.totalSupply || 0,
          marketCapTokenNumber: agent.marketCapTokenNumber || 0,
          chatEntry: agent.chatEntry || '',
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
        },
      });
      console.log(`已同步代理 ${agent.name} (ID: ${agent.id})`);
    }

    console.log('同步完成');
  } catch (error) {
    console.error('同步代理时出错:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 