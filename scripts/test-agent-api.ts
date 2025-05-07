import { ethers } from 'ethers';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = 'http://localhost:3000';
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

async function getNonce() {
  try {
    const response = await retry(() => 
      axios.get(`${API_BASE_URL}/api/auth/nonce`)
    );
    console.log('获取 nonce 成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('获取 nonce 失败:', error);
    throw error;
  }
}

async function generateSignature(message: string) {
  // 创建一个随机钱包
  const wallet = ethers.Wallet.createRandom();
  console.log('测试钱包地址:', wallet.address);
  console.log('测试钱包私钥:', wallet.privateKey);

  // 签名消息
  const signature = await wallet.signMessage(message);
  console.log('生成的签名:', signature);

  // 验证签名
  const recoveredAddress = ethers.verifyMessage(message, signature);
  console.log('恢复的地址:', recoveredAddress);
  console.log('地址匹配:', recoveredAddress.toLowerCase() === wallet.address.toLowerCase());

  return {
    address: wallet.address,
    signature,
    message
  };
}

async function getToken(authData: { address: string; signature: string; message: string }) {
  try {
    const response = await retry(() => 
      axios.post(`${API_BASE_URL}/api/auth/wallet-connect`, authData)
    );
    console.log('获取 token 成功:', response.data);
    return response.data.data.token;
  } catch (error) {
    console.error('获取 token 失败:', error);
    throw error;
  }
}

async function createAgent(token: string, name?: string, symbol?: string) {
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
          // tokenAddress: '0x123456789',
          // iaoContractAddress: '0x987654321',
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
          // status: 'Tradable',
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
            ko: "1. 총 공급량: 1000억\n2. 토큰의 20%는 IAO를 통해 판매\n3. 14일간의 IAO 기간\n4. DBCSwap에 거래쌍 설립"
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

async function main() {
  try {
    console.log('=== 开始测试 API ===');
    
    // 1. 获取 nonce
    console.log('\n1. 获取 nonce');
    const nonceData = await getNonce();
    
    // 2. 生成签名
    console.log('\n2. 生成签名');
    const authData = await generateSignature(nonceData.message);
    
    // 3. 获取 token
    console.log('\n3. 获取 token');
    const token = await getToken(authData);
    
    // 4. 测试重名场景
    console.log('\n4. 测试重名场景');
    const testName = `Test Agent ${uuidv4().slice(0, 8)}`;
    console.log(`使用固定名称: ${testName}`);
    
    console.log('\n4.1 第一次创建 agent（应该成功）');
    const firstResult = await createAgent(token, testName);
    console.log('第一次创建的 agent ID:', firstResult.data.data.agentId);
    
    console.log('\n4.2 第二次创建同名 agent（应该失败）');
    try {
      await createAgent(token, testName);
    } catch (error: any) {
      console.log('预期的错误响应:', error.response?.data);
    }

    console.log('\n=== 测试完成 ===');
  } catch (error) {
    console.error('\n测试过程中出错:', error);
    process.exit(1);
  }
}

main().catch(console.error); 