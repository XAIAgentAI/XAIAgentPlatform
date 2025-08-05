// utils/apiHelpers.ts
import { ethers } from 'ethers';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = process.env.NEXT_PUBLIC_HOST_URL;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

// 等待函数
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 重试函数
async function retry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, delay = RETRY_DELAY): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    console.log(`请求失败，${retries}秒后重试...`);
    await wait(delay);
    return retry(fn, retries - 1, delay);
  }
}


export const agentAPI = {
  async create(token: string, name?: string, symbol?: string) {
    try {
      // 使用传入的名称或生成随机名称
      const agentName = name || `Test Agent ${uuidv4().slice(0, 8)}`;
      const agentSymbol = symbol || `TEST${uuidv4().slice(0, 4)}`.toUpperCase();
      
      const response = await retry(() => 
        axios.post(
          `${API_BASE_URL}/api/agents/new`,
          {
            name: agentName,
            description: 'This is a test agent',
            category: 'AI',
            capabilities: ['test1', 'test2'],
            tokenAmount: '1000000000000000000',
            startTimestamp: Math.floor(Date.now() / 1000) + 3600 * 7,
            durationHours: 24*7,
            rewardAmount: '2000000000000000000000000000',
            rewardToken: '0xabcdef123',
            symbol: agentSymbol,
            avatar: 'http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/LogoLift.png',
            type: 'AI Agent',
            marketCap: '$0',
            change24h: '0',
            tvl: '$0',
            holdersCount: 0,
            volume24h: '$0',
            statusJA: 'トランザクション可能',
            statusKO: '거래 가능',
            statusZH: '可交易',
            descriptionJA: 'これはテストエージェントです',
            descriptionKO: '이것은 테스트 에이전트입니다',
            descriptionZH: '这是一个测试智能体',
            detailDescription: 'This is a detailed description of the test agent',
            lifetime: '',
            totalSupply: 100000000000,
            marketCapTokenNumber: 100000000000,
            useCases: [
              'Help me create an AI Agent',
              'What functions do you have?',
              'What types of AI Agents can you create?',
              'Can you tell me how to use xx as an Agent?'
            ],
            useCasesJA: [
              'AIエージェントの作成を手伝ってください',
              'どんな機能がありますか？',
              'どのようなタイプのAIエージェントを作成できますか？',
              'xxをエージェントとして使用する方法を教えてください'
            ],
            useCasesKO: [
              'AI 에이전트 만들기를 도와주세요',
              '어떤 기능이 있나요?',
              '어떤 유형의 AI 에이전트를 만들 수 있나요?',
              'xx를 에이전트로 사용하는 방법을 알려주시겠어요?'
            ],
            useCasesZH: [
              '帮我创建一个 AI 智能体',
              '你有哪些功能？',
              '你可以创建哪些类型的 AI 智能体？',
              '你能告诉我如何使用 xx 作为智能体吗？'
            ],
            socialLinks: 'https://x.com/test, https://github.com/test, https://t.me/test',
            chatEntry: null,
            projectDescription: JSON.stringify({
              en: "1. Total Supply: 100 billion\n2. 20% of tokens will be sold through IAO\n3. 14-day IAO period\n4. Trading pairs will be established on DBCSwap",
              zh: "1. 总供应量：1000亿\n2. 20% 的代币将通过 IAO 销售\n3. 14天 IAO 期间\n4. 将在 DBCSwap 上建立交易对",
              ja: "1. 総供給量：1000億\n2. トークンの20%は IAO を通じて販売\n3. 14日間の IAO 期間\n4. DBCSwap に取引ペアを設立",
              ko: "1. 総供給量: 1000億\n2. トークンの20%はIAOを通じて販売\n3. 14日間のIAO期間\n4. DBCSwapに取引ペアを設立"
            }),
            iaoTokenAmount: 20000000000
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
      );
      console.log('创建 agent 成功:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('创建 agent 失败:', error.response?.data || error);
      throw error;
    }
  }
};

export async function testDuplicateAgentCreation(token: string) {
  const testName = `Test Agent ${uuidv4().slice(0, 8)}`;
  console.log(`使用固定名称: ${testName}`);
  
  console.log('\n第一次创建 agent（应该成功）');
  const firstResult = await agentAPI.create(token, testName);
  console.log('第一次创建的 agent ID:', firstResult.data.agentId);
  
  console.log('\n第二次创建同名 agent（应该失败）');
  try {
    await agentAPI.create(token, testName);
  } catch (error: any) {
    console.log('预期的错误响应:', error.response?.data);
    return error.response?.data;
  }
}