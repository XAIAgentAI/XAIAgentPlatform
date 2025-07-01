/**
 * IAO Pool 数据管理 Hook - 简化版本
 * 整合所有数据获取和状态管理逻辑
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAuth } from '@/hooks/useAuth';
import { useStakeContract } from '@/hooks/useStakeContract';
import { createPublicClient, http, formatEther } from 'viem';
import { currentChain } from '@/config/wagmi';
import { CONTRACTS } from '@/config/contracts';
import type { LocalAgent } from "@/types/agent";

type UserStakeInfo = {
  userDeposited: string;
  claimableXAA: string;
  hasClaimed: boolean;
  claimedAmount: string;
  originDeposit: string;
  depositIncrByNFT: string;
  incrByNFTTier: string;
  rewardForOrigin: string;
  rewardForNFT: string;
  actualDepositedWithNFT: string;
};

type TokenCreationTask = {
  id: string;
  status: string;
  createdAt: string;
};

export const useIaoPoolData = (agent: LocalAgent) => {
  const { address, isConnected } = useAppKitAccount();
  const { isAuthenticated } = useAuth();
  
  // 合约地址
  const iaoContractAddress = agent?.iaoContractAddress || '';
  const tokenAddress = agent?.tokenAddress || '';

  // 余额状态
  const [dbcAmount, setDbcAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState<string>("0");
  const [xaaBalance, setXaaBalance] = useState<string>("0");

  // IAO状态
  const [isIaoSuccessful, setIsIaoSuccessful] = useState(false);
  const [tokenCreationTask, setTokenCreationTask] = useState<TokenCreationTask | null>(null);
  const [userStakeInfo, setUserStakeInfo] = useState<UserStakeInfo>({
    userDeposited: "0",
    claimableXAA: "0",
    hasClaimed: false,
    claimedAmount: "0",
    originDeposit: "0",
    depositIncrByNFT: "0",
    incrByNFTTier: "0",
    rewardForOrigin: "0",
    rewardForNFT: "0",
    actualDepositedWithNFT: "0"
  });
  const [iaoProgress, setIaoProgress] = useState({
    totalDeposited: '0',
    investorCount: 0,
    targetAmount: '1500',
    progressPercentage: '0',
    remainingAmount: '1500',
    currentUsdValue: '0'
  });

  // 合约Hook
  const {
    poolInfo,
    isLoading: isStakeLoading,
    isPoolInfoLoading,
    isUserStakeInfoLoading,
    stake,
    claimRewards,
    getUserStakeInfo,
    checkIsSuccess,
    isContractOwner,
    getIaoProgress,
    fetchPoolInfo
  } = useStakeContract(tokenAddress as `0x${string}`, iaoContractAddress as `0x${string}`, agent.symbol || '');

  // 检查是否是创建者
  const isCreator = address && ((agent as any)?.creator?.address) && address.toLowerCase() === (agent as any).creator.address.toLowerCase();

  // 检查IAO是否结束
  const isIAOEnded = useMemo(() => {
    return !!(poolInfo?.endTime && Date.now() >= poolInfo.endTime * 1000);
  }, [poolInfo]);

  // 获取用户余额
  const fetchUserBalance = useCallback(async () => {
    if (!address || !isConnected) {
      setMaxAmount("0");
      setXaaBalance("0");
      return;
    }

    try {
      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(),
      });

      const dbcBalance = await publicClient.getBalance({
        address: address as `0x${string}`
      });
      setMaxAmount(formatEther(dbcBalance));

      const ERC20_ABI = [
        {
          "constant": true,
          "inputs": [{ "name": "_owner", "type": "address" }],
          "name": "balanceOf",
          "outputs": [{ "name": "balance", "type": "uint256" }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }
      ] as const;

      try {
        const xaaBalance = await publicClient.readContract({
          address: CONTRACTS.XAA_TOKEN as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        });
        setXaaBalance(formatEther(xaaBalance));
      } catch (error) {
        console.error('Failed to get XAA balance:', error);
        setXaaBalance("0");
      }
    } catch (error) {
      console.error('Failed to get balance:', error);
      setMaxAmount("0");
      setXaaBalance("0");
    }
  }, [address, isConnected]);

  // 获取token创建任务状态
  const fetchTokenCreationTask = useCallback(async () => {
    if (!isCreator || !isAuthenticated) return;

    try {
      const response = await fetch(`/api/agents/${agent.id}/tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Token creation task API response:', data);

        if (data.code === 200 && data.data && Array.isArray(data.data.tasks)) {
          const createTokenTask = data.data.tasks.find((task: any) => task.type === 'CREATE_TOKEN');
          if (createTokenTask) {
            setTokenCreationTask(createTokenTask);
          }
        } else {
          console.warn('Unexpected API response structure:', data);
        }
      } else {
        console.error('API request failed with status:', response.status);
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch token creation task:', error);
    }
  }, [agent.id, isCreator, isAuthenticated]);

  // 获取用户质押信息
  const fetchUserStakeInfo = useCallback(async () => {
    if (!isAuthenticated || !getUserStakeInfo) return;
    try {
      const info = await getUserStakeInfo();
      setUserStakeInfo(info);
    } catch (error) {
      console.error('Failed to fetch user stake info:', error);
    }
  }, [isAuthenticated, getUserStakeInfo]);

  // 获取IAO进度
  const fetchIaoProgress = useCallback(async () => {
    if (!getIaoProgress) return;
    try {
      const progress = await getIaoProgress();
      setIaoProgress(progress);
    } catch (error) {
      console.error('Failed to fetch IAO progress:', error);
    }
  }, [getIaoProgress]);

  // 检查IAO状态
  const checkIaoStatus = useCallback(async () => {
    if (!iaoContractAddress || !checkIsSuccess) return;
    try {
      const isSuccess = await checkIsSuccess();
      setIsIaoSuccessful(isSuccess);
    } catch (error) {
      console.error('Failed to check IAO status:', error);
    }
  }, [iaoContractAddress, checkIsSuccess]);

  // 初始化和定期更新
  useEffect(() => {
    fetchUserBalance();
    const timer = setInterval(fetchUserBalance, 30000);
    return () => clearInterval(timer);
  }, [fetchUserBalance]);

  useEffect(() => {
    fetchTokenCreationTask();
  }, [fetchTokenCreationTask]);

  useEffect(() => {
    fetchUserStakeInfo();
  }, [fetchUserStakeInfo]);

  useEffect(() => {
    fetchIaoProgress();
    const interval = setInterval(fetchIaoProgress, 30000);
    return () => clearInterval(interval);
  }, [fetchIaoProgress]);

  useEffect(() => {
    checkIaoStatus();
    const interval = setInterval(checkIaoStatus, 60000);
    return () => clearInterval(interval);
  }, [checkIaoStatus]);

  // 轮询token创建任务
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (tokenCreationTask && (tokenCreationTask.status === 'PENDING' || tokenCreationTask.status === 'PROCESSING')) {
      interval = setInterval(fetchTokenCreationTask, 5000);
    }
    if (tokenCreationTask && tokenCreationTask.status === 'COMPLETED' && !agent.tokenAddress) {
      setTimeout(() => window.location.reload(), 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [tokenCreationTask?.status, fetchTokenCreationTask, agent.tokenAddress]);

  return {
    // 状态
    dbcAmount,
    setDbcAmount,
    maxAmount,
    xaaBalance,
    isIaoSuccessful,
    tokenCreationTask,
    userStakeInfo,
    iaoProgress,
    poolInfo,
    isCreator,
    isIAOEnded,

    // 加载状态
    isStakeLoading,
    isPoolInfoLoading,
    isUserStakeInfoLoading,

    // 方法
    stake,
    claimRewards,
    isContractOwner,
    fetchUserStakeInfo,
    fetchTokenCreationTask,
    fetchIaoProgress,
    checkIaoStatus,
    fetchPoolInfo,

    // 便捷访问
    address,
    isConnected,
    isAuthenticated
  };
};
