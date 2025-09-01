import { ethers } from 'ethers';
import { currentNetwork } from '@/config/networks';
import { getContractABI } from '@/config/contracts';
import { createPublicClient, http } from 'viem';
import { currentChain } from '@/config/wagmi';

/**
 * 获取合约的开始时间和结束时间
 * @param contractAddress 合约地址
 * @param symbol 代币符号，默认为'XAA'
 * @returns 返回开始时间和结束时间的对象
 */
export const getContractTimeInfo = async (contractAddress: string, symbol: string = 'XAA'): Promise<{ startTime: number; endTime: number }> => {
  try {
    // 验证合约地址
    if (!contractAddress || contractAddress === '0x' || contractAddress.length !== 42) {
      console.error('Invalid contract address:', contractAddress);
      return { startTime: 0, endTime: 0 };
    }

    // 创建公共客户端
    const publicClient = createPublicClient({
      chain: currentChain,
      transport: http(),
    });

    // 获取当前代币的 ABI
    const contractABI = getContractABI(symbol);

    // 并行调用合约方法获取开始时间和结束时间
    const [startTime, endTime] = await Promise.all([
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'startTime',
      }).catch(error => {
        console.error(`Failed to fetch startTime for contract ${contractAddress}:`, error);
        return BigInt(0);
      }),
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'endTime',
      }).catch(error => {
        console.error(`Failed to fetch endTime for contract ${contractAddress}:`, error);
        return BigInt(0);
      })
    ]);

    return {
      startTime: startTime ? Number(startTime) : 0,
      endTime: endTime ? Number(endTime) : 0
    };
  } catch (error) {
    console.error('Failed to fetch contract time info:', error);
    return { startTime: 0, endTime: 0 };
  }
};

/**
 * 批量获取多个合约的时间信息
 * @param contracts 合约信息数组，包含地址和符号
 * @returns 返回包含合约地址和时间信息的对象
 */
export const getBatchContractTimeInfo = async (
  contracts: Array<{ address: string; symbol: string }>
): Promise<Record<string, { startTime: number; endTime: number }>> => {
  const startTime = Date.now();
  console.log(`[性能] 开始批量获取合约时间信息，合约数量: ${contracts.length}`);

  try {
    // 过滤无效合约地址
    const validContracts = contracts.filter(
      contract => contract.address && contract.address !== '0x' && contract.address.length === 42
    );

    if (validContracts.length === 0) {
      console.log('[性能] 没有有效的合约地址');
      return {};
    }

    // 并行获取所有合约的时间信息
    const promises = validContracts.map(async contract => {
      const timeInfo = await getContractTimeInfo(contract.address, contract.symbol);
      return { address: contract.address, timeInfo };
    });

    const results = await Promise.all(promises);

    // 将结果转换为对象形式
    const contractTimeInfo: Record<string, { startTime: number; endTime: number }> = {};
    results.forEach(result => {
      contractTimeInfo[result.address] = result.timeInfo;
    });

    const endTime = Date.now();
    console.log(`[性能] 批量获取合约时间信息完成，耗时: ${endTime - startTime}ms`);

    return contractTimeInfo;
  } catch (error) {
    console.error('Failed to fetch batch contract time info:', error);
    const endTime = Date.now();
    console.log(`[性能] 批量获取合约时间信息失败，耗时: ${endTime - startTime}ms`);
    return {};

  }
}; 
