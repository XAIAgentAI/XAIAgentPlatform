import { createPublicClient, http } from 'viem';
import { dbcMainnet } from '@/config/networks';
import { getContractABI } from '@/config/contracts';

// IAO成功检查结果接口
export interface IaoSuccessCheckResult {
  agentId: string;
  agentName: string;
  isSuccessful: boolean | null;
  error?: string;
  iaoEndTime?: number;
  iaoContractAddress?: string;
}

// 检查单个IAO是否成功的函数
export async function checkIaoSuccess(agent: any): Promise<IaoSuccessCheckResult> {
  // DietPlan 调试信息
  const isDietPlan = agent.name === 'DietPlan';
  
  if (isDietPlan) {
    // console.log('=== DietPlan IAO 检查开始 ===');
    // console.log('Agent ID:', agent.id);
    // console.log('Agent Name:', agent.name);
    // console.log('Agent Symbol:', agent.symbol);
    // console.log('原始 iaoStartTime:', agent.iaoStartTime);
    // console.log('原始 iaoEndTime:', agent.iaoEndTime);
    // console.log('原始 iaoContractAddress:', agent.iaoContractAddress);
    // console.log('原始 iaoContractAddressTestnet:', agent.iaoContractAddressTestnet);
    // console.log('环境变量 NEXT_PUBLIC_IS_TEST_ENV:', process.env.NEXT_PUBLIC_IS_TEST_ENV);
  }

  try {
    // 检查IAO是否已结束
    const now = Math.floor(Date.now() / 1000);
    const iaoEndTime = agent.iaoEndTime ? Number(agent.iaoEndTime) : null;
    const iaoStartTime = agent.iaoStartTime ? Number(agent.iaoStartTime) : null;
    
    if (isDietPlan) {
      // console.log('=== DietPlan 时间检查 ===');
      // console.log('当前时间戳:', now);
      // console.log('转换后 iaoStartTime:', iaoStartTime);
      // console.log('转换后 iaoEndTime:', iaoEndTime);
      // console.log('IAO是否已开始:', iaoStartTime ? (now >= iaoStartTime) : '未设置');
      // console.log('IAO是否已结束:', iaoEndTime ? (now >= iaoEndTime) : '未设置');
    }
    
    // 如果没有设置IAO时间，说明IAO还未开始
    if ( !iaoEndTime) {
      if (isDietPlan) {
        // console.log('=== DietPlan 错误: IAO时间未设置 ===');
        // console.log('iaoStartTime 存在:', !!iaoStartTime);
        // console.log('iaoEndTime 存在:', !!iaoEndTime);
      }
      return { 
        agentId: agent.id,
        agentName: agent.name,
        isSuccessful: null, 
        error: 'IAO时间未设置，无法检查成功状态',
        iaoEndTime: iaoEndTime || undefined,
      };
    }
    
    // 如果IAO还未结束，无法判断成功状态
    if (now < iaoEndTime) {
      if (isDietPlan) {
        // console.log('=== DietPlan 错误: IAO还未结束 ===');
        // console.log('剩余时间(秒):', iaoEndTime - now);
        // console.log('剩余时间(分钟):', Math.floor((iaoEndTime - now) / 60));
        // console.log('剩余时间(小时):', Math.floor((iaoEndTime - now) / 3600));
      }
      return { 
        agentId: agent.id,
        agentName: agent.name,
        isSuccessful: null, 
        error: 'IAO还未结束，无法检查成功状态',
        iaoEndTime: iaoEndTime,
      };
    }

    // IAO已结束，调用合约检查成功状态
    const iaoContractAddress = process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true'
      ? agent.iaoContractAddressTestnet
      : agent.iaoContractAddress;

    if (isDietPlan) {
      // console.log('=== DietPlan 合约地址检查 ===');
      // console.log('使用的合约地址:', iaoContractAddress);
      // console.log('是否为测试环境:', process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true');
    }

    if (!iaoContractAddress) {
      if (isDietPlan) {
        // console.log('=== DietPlan 错误: IAO合约地址不存在 ===');
        // console.log('主网合约地址:', agent.iaoContractAddress);
        // console.log('测试网合约地址:', agent.iaoContractAddressTestnet);
      }
      return { 
        agentId: agent.id,
        agentName: agent.name,
        isSuccessful: null, 
        error: 'IAO合约地址不存在',
        iaoEndTime: iaoEndTime,
      };
    }

    const publicClient = createPublicClient({
      chain: dbcMainnet,
      transport: http()
    });

    const contractABI = getContractABI(agent.symbol);
    
    if (isDietPlan) {
      // console.log('=== DietPlan 合约调用准备 ===');
      // console.log('使用的网络:', dbcMainnet.name);
      // console.log('合约ABI获取成功:', !!contractABI);
      // console.log('ABI长度:', contractABI?.length || 0);
    }
    
    // 调用合约的isSuccess方法
    let isSuccess: boolean | null = null;
    try {
      if (isDietPlan) {
        // console.log('=== DietPlan 开始调用 isSuccess ===');
        // console.log('合约地址:', iaoContractAddress);
        // console.log('函数名: isSuccess');
      }
      
      isSuccess = await publicClient.readContract({
        address: iaoContractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'isSuccess',
      });
      
      if (isDietPlan) {
        // console.log('=== DietPlan isSuccess 调用成功 ===');
        // console.log('isSuccess 结果:', isSuccess);
        // console.log('isSuccess 类型:', typeof isSuccess);
      } else {
        // console.log('isSuccess', isSuccess, agent.name);
      }
    } catch (isSuccessError) {
      if (isDietPlan) {
        // console.log('=== DietPlan isSuccess 调用失败 ===');
        // console.error('错误详情:', isSuccessError);
        // console.error('错误类型:', typeof isSuccessError);
        // console.error('错误消息:', (isSuccessError as any)?.message);
        // console.error('错误代码:', (isSuccessError as any)?.code);
        // console.error('错误名称:', (isSuccessError as any)?.name);
      } else {
        // console.error(`isSuccess调用失败 (${agent.name}):`);
      }
      // 如果isSuccess调用失败，返回失败状态
      isSuccess = null;
    }

    const isSuccessful = isSuccess === null  ? null : isSuccess;

    if (isDietPlan) {
      // console.log('=== DietPlan 最终结果 ===');
      // console.log('isSuccessful:', isSuccessful);
      // console.log('=== DietPlan IAO 检查结束 ===');
    }

    return { 
      agentId: agent.id,
      agentName: agent.name,
      isSuccessful, 
      iaoEndTime: iaoEndTime,
      iaoContractAddress,
    };
  } catch (error) {
    if (isDietPlan) {
      // console.log('=== DietPlan 整体错误 ===');
      // console.error('错误对象:', error);
      // console.error('错误类型:', typeof error);
      // console.error('错误消息:', error instanceof Error ? error.message : '非Error对象');
      // console.error('错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
    } else {
      // console.error(`检查IAO成功状态失败 (${agent.id}):`, error);
    }
    
    // 如果是合约调用错误，记录更详细的信息
    if (error && typeof error === 'object' && 'shortMessage' in error) {
      if (isDietPlan) {
        // console.error('=== DietPlan 合约调用错误详情 ===');
        // console.error('shortMessage:', (error as any).shortMessage);
        // console.error('完整错误对象:', JSON.stringify(error, null, 2));
      } else {
        // console.error(`IAO合约调用错误 (${agent.id}): ${(error as any).shortMessage}`);
      }
    }
    
    return { 
      agentId: agent.id,
      agentName: agent.name,
      isSuccessful: null, 
      error: error instanceof Error ? error.message : '未知错误',
      iaoContractAddress: agent.iaoContractAddress || agent.iaoContractAddressTestnet,
    };
  }
} 