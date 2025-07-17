/**
 * IAO Pool 数据管理 Hook - 简化版本
 * 整合所有数据获取和状态管理逻辑
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAuth } from '@/hooks/useAuth';
import { useStakeContract } from '@/hooks/useStakeContract';
import { createPublicClient, http, formatEther } from 'viem';
import { currentChain } from '@/config/wagmi';
import { CONTRACTS } from '@/config/contracts';
import type { LocalAgent } from "@/types/agent";

// 调试工具函数
const DEBUG = true;
const logPerformance = (name: string, startTime: number) => {
  if (!DEBUG) return;
  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`🔍 性能监控 [${name}]: ${duration.toFixed(2)}ms`);
};

const logDebug = (message: string, data?: any) => {
  if (!DEBUG) return;
  if (data) {
    console.log(`📊 调试信息 [${message}]:`, data);
  } else {
    console.log(`📊 调试信息 [${message}]`);
  }
};

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
  const hookInstanceId = useRef(`hook-${Math.random().toString(36).substring(2, 9)}`).current;
  logDebug(`useIaoPoolData 初始化 [${hookInstanceId}]`, { agentId: agent.id });
  const startHookTime = performance.now();
  
  // 防止重复调用的标志
  const isInitialMount = useRef(true);
  const fetchInProgress = useRef({
    userBalance: false,
    tokenCreationTask: false,
    userStakeInfo: false,
    iaoProgress: false,
    iaoStatus: false
  });
  
  const { address, isConnected } = useAppKitAccount();
  const { isAuthenticated } = useAuth();
  
  // 合约地址
  const iaoContractAddress = agent?.iaoContractAddress || '';
  const tokenAddress = agent?.tokenAddress || '';

  // 使用单一状态对象，减少状态更新次数
  const [state, setState] = useState({
    // 余额状态
    dbcAmount: "",
    maxDbcAmount: "0",
    xaaBalance: "0",
    maxXaaAmount: "0",
    
    // IAO状态
    isIaoSuccessful: false,
    tokenCreationTask: null as TokenCreationTask | null,
    distributionTask: null as any,
    userStakeInfo: {
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
    } as UserStakeInfo,
    iaoProgress: {
      totalDeposited: '0',
      investorCount: 0,
      targetAmount: '1500',
      targetXaaAmount: '0',
      progressPercentage: '0',
      remainingAmount: '1500',
      remainingXaaAmount: '0',
      currentUsdValue: '0'
    }
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

  logDebug(`useStakeContract 初始化完成 [${hookInstanceId}]`, { 
    tokenAddress, 
    iaoContractAddress, 
    isStakeLoading, 
    isPoolInfoLoading 
  });

  // 检查是否是创建者
  const isCreator = address && ((agent as any)?.creator?.address) && address.toLowerCase() === (agent as any).creator.address.toLowerCase();

  // 检查IAO是否结束
  const isIAOEnded = useMemo(() => {
    const startTime = performance.now();
    const result = !!(poolInfo?.endTime && Date.now() >= poolInfo.endTime * 1000);
    logPerformance(`isIAOEnded 计算 [${hookInstanceId}]`, startTime);
    return result;
  }, [poolInfo, hookInstanceId]);

  // 安全地更新状态，使用函数式更新以避免依赖过期状态
  const updateState = useCallback((updater: (prevState: typeof state) => Partial<typeof state>) => {
    setState(prevState => ({
      ...prevState,
      ...updater(prevState)
    }));
  }, []);

  // 获取用户余额
  const fetchUserBalance = useCallback(async () => {
    if (fetchInProgress.current.userBalance) return;
    fetchInProgress.current.userBalance = true;
    
    const startTime = performance.now();
    logDebug(`fetchUserBalance 开始执行 [${hookInstanceId}]`);
    
    if (!address || !isConnected) {
      updateState(() => ({
        maxDbcAmount: "0",
        maxXaaAmount: "0",
        xaaBalance: "0"
      }));
      logDebug(`fetchUserBalance 提前退出: 用户未连接 [${hookInstanceId}]`);
      fetchInProgress.current.userBalance = false;
      return;
    }

    try {
      const clientStartTime = performance.now();
      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(),
      });
      logPerformance(`创建 publicClient [${hookInstanceId}]`, clientStartTime);

      const balanceStartTime = performance.now();
      const dbcBalance = await publicClient.getBalance({
        address: address as `0x${string}`
      });
      logPerformance(`获取 DBC 余额 [${hookInstanceId}]`, balanceStartTime);
      const formattedDbcBalance = formatEther(dbcBalance);

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
        const xaaStartTime = performance.now();
        const xaaBalance = await publicClient.readContract({
          address: CONTRACTS.XAA_TOKEN as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        });
        logPerformance(`获取 XAA 余额 [${hookInstanceId}]`, xaaStartTime);
        
        const formattedXaaBalance = formatEther(xaaBalance);
        
        // 批量更新状态
        updateState(() => ({
          maxDbcAmount: formattedDbcBalance,
          xaaBalance: formattedXaaBalance,
          maxXaaAmount: formattedXaaBalance
        }));
      } catch (error) {
        console.error('Failed to get XAA balance:', error);
        updateState(() => ({
          maxDbcAmount: formattedDbcBalance,
          xaaBalance: "0",
          maxXaaAmount: "0"
        }));
      }
    } catch (error) {
      console.error('Failed to get balance:', error);
      updateState(() => ({
        maxDbcAmount: "0",
        xaaBalance: "0",
        maxXaaAmount: "0"
      }));
    }
    
    logPerformance(`fetchUserBalance 总耗时 [${hookInstanceId}]`, startTime);
    fetchInProgress.current.userBalance = false;
  }, [address, isConnected, updateState, hookInstanceId]);

  // 获取token创建任务状态
  const fetchTokenCreationTask = useCallback(async () => {
    if (fetchInProgress.current.tokenCreationTask) return;
    fetchInProgress.current.tokenCreationTask = true;
    
    const startTime = performance.now();
    logDebug(`fetchTokenCreationTask 开始执行 [${hookInstanceId}]`);
    
    if (!isCreator || !isAuthenticated) {
      logDebug(`fetchTokenCreationTask 提前退出: 非创建者或未认证 [${hookInstanceId}]`);
      fetchInProgress.current.tokenCreationTask = false;
      return;
    }

    try {
      const fetchStartTime = performance.now();
      const response = await fetch(`/api/agents/${agent.id}/tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      logPerformance(`任务API请求 [${hookInstanceId}]`, fetchStartTime);

      const jsonStartTime = performance.now();
      const response_data = await response.json();
      logPerformance(`解析API响应 [${hookInstanceId}]`, jsonStartTime);

      if (response_data.code === 200) {
        logDebug(`Token creation task API response [${hookInstanceId}]:`, response_data);

        if (response_data.code === 200 && response_data.data && Array.isArray(response_data.data.tasks)) {
          const createTokenTask = response_data.data.tasks.find((task: any) => task.type === 'CREATE_TOKEN');
          const distributeTask = response_data.data.tasks.find((task: any) => task.type === 'DISTRIBUTE_TOKENS');
          
          // 批量更新状态
          updateState(() => ({
            tokenCreationTask: createTokenTask || null,
            distributionTask: distributeTask || null
          }));
          
          if (createTokenTask) {
            logDebug(`🔄 Token creation task status updated [${hookInstanceId}]:`, createTokenTask.status);
          } else {
            logDebug(`📝 No CREATE_TOKEN task found [${hookInstanceId}]`);
          }

          if (distributeTask) {
            logDebug(`🔄 Distribution task status updated [${hookInstanceId}]:`, distributeTask.status);
          } else {
            logDebug(`📝 No DISTRIBUTE_TOKENS task found [${hookInstanceId}]`);
          }
        } else {
          console.warn('Unexpected API response structure:', response_data);
        }
      } else {
        console.error('API request failed with status:', response.status);
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch token creation task:', error);
    }
    
    logPerformance(`fetchTokenCreationTask 总耗时 [${hookInstanceId}]`, startTime);
    fetchInProgress.current.tokenCreationTask = false;
  }, [agent.id, isCreator, isAuthenticated, updateState, hookInstanceId]);

  // 获取用户质押信息
  const fetchUserStakeInfo = useCallback(async () => {
    if (fetchInProgress.current.userStakeInfo) return;
    fetchInProgress.current.userStakeInfo = true;
    
    const startTime = performance.now();
    logDebug(`fetchUserStakeInfo 开始执行 [${hookInstanceId}]`);
    
    if (!isAuthenticated || !getUserStakeInfo) {
      logDebug(`fetchUserStakeInfo 提前退出: 未认证或无法获取质押信息 [${hookInstanceId}]`);
      fetchInProgress.current.userStakeInfo = false;
      return;
    }
    
    try {
      const info = await getUserStakeInfo();
      logDebug(`获取到的质押信息 [${hookInstanceId}]`, info);
      updateState(() => ({ userStakeInfo: info }));
    } catch (error) {
      console.error('Failed to fetch user stake info:', error);
    }
    
    logPerformance(`fetchUserStakeInfo 总耗时 [${hookInstanceId}]`, startTime);
    fetchInProgress.current.userStakeInfo = false;
  }, [isAuthenticated, getUserStakeInfo, updateState, hookInstanceId]);

  // 获取IAO进度
  const fetchIaoProgress = useCallback(async () => {
    if (fetchInProgress.current.iaoProgress) return;
    fetchInProgress.current.iaoProgress = true;
    
    const startTime = performance.now();
    logDebug(`fetchIaoProgress 开始执行 [${hookInstanceId}]`);
    
    if (!getIaoProgress) {
      logDebug(`fetchIaoProgress 提前退出: 无法获取IAO进度 [${hookInstanceId}]`);
      fetchInProgress.current.iaoProgress = false;
      return;
    }
    
    try {
      const progress = await getIaoProgress();
      logDebug(`获取到的IAO进度 [${hookInstanceId}]`, progress);
      updateState(() => ({ iaoProgress: progress }));
    } catch (error) {
      console.error('Failed to fetch IAO progress:', error);
    }
    
    logPerformance(`fetchIaoProgress 总耗时 [${hookInstanceId}]`, startTime);
    fetchInProgress.current.iaoProgress = false;
  }, [getIaoProgress, updateState, hookInstanceId]);

  // 检查IAO状态
  const checkIaoStatus = useCallback(async () => {
    if (fetchInProgress.current.iaoStatus) return;
    fetchInProgress.current.iaoStatus = true;
    
    const startTime = performance.now();
    logDebug(`checkIaoStatus 开始执行 [${hookInstanceId}]`);
    
    if (!iaoContractAddress || !checkIsSuccess) {
      logDebug(`checkIaoStatus 提前退出: 无合约地址或无法检查成功状态 [${hookInstanceId}]`);
      fetchInProgress.current.iaoStatus = false;
      return;
    }
    
    try {
      const isSuccess = await checkIsSuccess();
      logDebug(`IAO成功状态 [${hookInstanceId}]`, isSuccess);
      updateState(() => ({ isIaoSuccessful: isSuccess }));
    } catch (error) {
      console.error('Failed to check IAO status:', error);
    }
    
    logPerformance(`checkIaoStatus 总耗时 [${hookInstanceId}]`, startTime);
    fetchInProgress.current.iaoStatus = false;
  }, [iaoContractAddress, checkIsSuccess, updateState, hookInstanceId]);

  // 初始化数据 - 只在组件首次挂载时执行一次
  useEffect(() => {
    if (!isInitialMount.current) return;
    
    logDebug(`初始化数据加载 [${hookInstanceId}]`);
    const startTime = performance.now();
    
    // 并行加载所有数据
    fetchUserBalance();
    fetchTokenCreationTask();
    fetchUserStakeInfo();
    fetchIaoProgress();
    checkIaoStatus();
    
    isInitialMount.current = false;
    logPerformance(`初始化数据加载完成 [${hookInstanceId}]`, startTime);
    
    // 清理函数
    return () => {
      logDebug(`清理 Hook 资源 [${hookInstanceId}]`);
    };
  }, [fetchUserBalance, fetchTokenCreationTask, fetchUserStakeInfo, fetchIaoProgress, checkIaoStatus, hookInstanceId]);

  // 设置定时刷新 - 使用单一 useEffect 管理所有定时器
  useEffect(() => {
    logDebug(`设置定时刷新 [${hookInstanceId}]`);
    const startTime = performance.now();
    
    // 用户余额 - 30秒更新一次
    const balanceTimer = setInterval(() => {
      logDebug(`定时更新用户余额 [${hookInstanceId}]`);
      fetchUserBalance();
    }, 30000);
    
    // IAO进度 - 30秒更新一次
    const progressTimer = setInterval(() => {
      logDebug(`定时更新IAO进度 [${hookInstanceId}]`);
      fetchIaoProgress();
    }, 30000);
    
    // IAO状态 - 60秒更新一次
    const statusTimer = setInterval(() => {
      logDebug(`定时检查IAO状态 [${hookInstanceId}]`);
      checkIaoStatus();
    }, 60000);
    
    logPerformance(`设置定时刷新完成 [${hookInstanceId}]`, startTime);
    
    // 清理所有定时器
    return () => {
      logDebug(`清除所有定时器 [${hookInstanceId}]`);
      clearInterval(balanceTimer);
      clearInterval(progressTimer);
      clearInterval(statusTimer);
    };
  }, [fetchUserBalance, fetchIaoProgress, checkIaoStatus, hookInstanceId]);

  // 轮询token创建任务 - 单独处理，因为有特殊逻辑
  useEffect(() => {
    const { tokenCreationTask } = state;
    logDebug(`处理token创建任务状态变化 [${hookInstanceId}]`, { status: tokenCreationTask?.status });
    const startTime = performance.now();
    
    let interval: NodeJS.Timeout | null = null;
    
    // 只有在任务进行中才需要轮询
    if (tokenCreationTask && (tokenCreationTask.status === 'PENDING' || tokenCreationTask.status === 'PROCESSING')) {
      logDebug(`开始轮询token创建任务 [${hookInstanceId}]`);
      interval = setInterval(() => {
        logDebug(`轮询token创建任务 [${hookInstanceId}]`);
        fetchTokenCreationTask();
      }, 5000);
    }
    
    // 任务完成但地址未更新，需要刷新页面
    if (tokenCreationTask && tokenCreationTask.status === 'COMPLETED' && !agent.tokenAddress) {
      logDebug(`token创建完成，准备刷新页面 [${hookInstanceId}]`);
      setTimeout(() => window.location.reload(), 2000);
    }
    
    logPerformance(`处理token创建任务状态变化完成 [${hookInstanceId}]`, startTime);
    
    return () => {
      if (interval) {
        logDebug(`清除token创建任务轮询 [${hookInstanceId}]`);
        clearInterval(interval);
      }
    };
  }, [state.tokenCreationTask, fetchTokenCreationTask, agent.tokenAddress, hookInstanceId]);

  // 监听用户身份变化，触发执行fetchUserStakeInfo
  useEffect(() => {
    logDebug(`用户身份变化检测 [${hookInstanceId}]`, { address, isConnected, isAuthenticated });
    const startTime = performance.now();
    
    // 当地址、连接状态或认证状态发生变化时，重新获取用户质押信息
    if (address && isConnected) {
      logDebug(`用户身份变化，重新获取质押信息 [${hookInstanceId}]`);
      fetchUserStakeInfo();
      fetchUserBalance(); // 同时更新用户余额
    } else {
      // 如果用户未连接或无地址，重置用户质押信息
      updateState(() => ({ 
        userStakeInfo: {
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
        }
      }));
    }
    
    logPerformance(`用户身份变化处理完成 [${hookInstanceId}]`, startTime);
  }, [address, isConnected, isAuthenticated, fetchUserStakeInfo, fetchUserBalance, updateState, ]);

  // 监听合约地址变化，触发数据更新
  useEffect(() => {
    logDebug(`合约地址变化检测 [${hookInstanceId}]`, { iaoContractAddress, tokenAddress });
    const startTime = performance.now();
    
    // 当合约地址变化且不为空时，重新获取相关数据
    if (iaoContractAddress) {
      logDebug(`合约地址变化，重新获取数据 [${hookInstanceId}]`);
      // 刷新所有相关数据
      fetchPoolInfo();
      fetchIaoProgress();
      checkIaoStatus();
      
      // 如果用户已连接，也刷新用户相关数据
      if (address && isConnected) {
        fetchUserStakeInfo();
      }
    }
    
    logPerformance(`合约地址变化处理完成 [${hookInstanceId}]`, startTime);
  }, [iaoContractAddress, tokenAddress, address, isConnected, fetchPoolInfo, fetchIaoProgress, checkIaoStatus, fetchUserStakeInfo, ]);

  // 设置dbcAmount的方法 - 保持API兼容性
  const setDbcAmount = useCallback((value: string) => {
    updateState(() => ({ dbcAmount: value }));
  }, [updateState]);

  logPerformance(`useIaoPoolData Hook 总初始化时间 [${hookInstanceId}]`, startHookTime);

  return {
    // 状态
    dbcAmount: state.dbcAmount,
    setDbcAmount,
    maxDbcAmount: state.maxDbcAmount,
    maxXaaAmount: state.maxXaaAmount,
    xaaBalance: state.xaaBalance,
    isIaoSuccessful: state.isIaoSuccessful,
    tokenCreationTask: state.tokenCreationTask,
    distributionTask: state.distributionTask,
    userStakeInfo: state.userStakeInfo,
    iaoProgress: state.iaoProgress,
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
