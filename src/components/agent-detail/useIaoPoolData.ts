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
const DEBUG = false; // 关闭生产环境调试
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

// 创建一个全局的 ERC20 ABI 常量避免重复创建
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

// 全局缓存公共客户端实例
let cachedPublicClient: ReturnType<typeof createPublicClient> | null = null;
const getPublicClient = () => {
  if (!cachedPublicClient) {
    cachedPublicClient = createPublicClient({
      chain: currentChain,
      transport: http(),
    });
  }
  return cachedPublicClient;
};

// 初始化状态对象
const initialState = {
  // 余额状态
  dbcAmount: "",
  maxDbcAmount: "0",
  xaaBalance: "0",
  maxXaaAmount: "0",
  
  // IAO状态
  isIaoSuccessful: false,
  tokenCreationTask: null as TokenCreationTask | null,
  distributionTask: null as any,
  iaoTask: null as any, // 统一的IAO任务（包括初次部署和重新部署）
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
};

// 使用 Map 缓存已初始化的代理，减少重复初始化
const initializedAgents = new Map<string, boolean>();

export const useIaoPoolData = (agent: LocalAgent) => {
  // 使用固定值作为 hookInstanceId，而不是每次都生成新的
  const hookInstanceId = useMemo(() => `hook-${agent.id.substring(0, 6)}`, [agent.id]);
  
  // 防止重复调用的标志
  const fetchInProgress = useRef({
    userBalance: false,
    tokenCreationTask: false,
    iaoTask: false,
    userStakeInfo: false,
    iaoProgress: false,
    iaoStatus: false
  });
  
  // 防止重复初始化的标志
  const isInitialized = useRef(false);
  
  // 避免频繁渲染，使用 ref 跟踪上一次的状态
  const prevAddress = useRef<string | undefined>(undefined);
  const prevConnected = useRef<boolean>(false);
  const prevAuthenticated = useRef<boolean>(false);
  
  const { address, isConnected } = useAppKitAccount();
  const { isAuthenticated } = useAuth();
  
  // 合约地址
  const iaoContractAddress = agent?.iaoContractAddress || '';
  const tokenAddress = agent?.tokenAddress || '';

  // 使用单一状态对象，减少状态更新次数
  const [state, setState] = useState(initialState);

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
    
    if (!address || !isConnected) {
      setState(prevState => ({
        ...prevState,
        maxDbcAmount: "0",
        maxXaaAmount: "0",
        xaaBalance: "0"
      }));
      fetchInProgress.current.userBalance = false;
      return;
    }

    try {
      const publicClient = getPublicClient();

      const dbcBalance = await publicClient.getBalance({
        address: address as `0x${string}`
      });
      const formattedDbcBalance = formatEther(dbcBalance);

      try {
        const xaaBalance = await publicClient.readContract({
          address: CONTRACTS.XAA_TOKEN as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        });
        
        const formattedXaaBalance = formatEther(xaaBalance);
        
        setState(prevState => ({
          ...prevState,
          maxDbcAmount: formattedDbcBalance,
          xaaBalance: formattedXaaBalance,
          maxXaaAmount: formattedXaaBalance
        }));
      } catch (error) {
        console.error('Failed to get XAA balance:', error);
        setState(prevState => ({
          ...prevState,
          maxDbcAmount: formattedDbcBalance,
          xaaBalance: "0",
          maxXaaAmount: "0"
        }));
      }
    } catch (error) {
      console.error('Failed to get balance:', error);
      setState(prevState => ({
        ...prevState,
        maxDbcAmount: "0",
        xaaBalance: "0",
        maxXaaAmount: "0"
      }));
    }
    
    fetchInProgress.current.userBalance = false;
  }, [address, isConnected]);


  // 获取token创建任务状态
  const fetchTokenCreationTask = useCallback(async () => {
    if (fetchInProgress.current.tokenCreationTask) return;
    fetchInProgress.current.tokenCreationTask = true;
    
    if (!isCreator || !isAuthenticated) {
      fetchInProgress.current.tokenCreationTask = false;
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agent.id}/tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const response_data = await response.json();

      if (response_data.code === 200 && response_data.data && Array.isArray(response_data.data.tasks)) {
        const createTokenTask = response_data.data.tasks.find((task: any) => task.type === 'CREATE_TOKEN');
        const distributeTask = response_data.data.tasks.find((task: any) => task.type === 'DISTRIBUTE_TOKENS');
        
        updateState(() => ({
          tokenCreationTask: createTokenTask || null,
          distributionTask: distributeTask || null
        }));
        
        if (createTokenTask && createTokenTask.status === 'COMPLETED' && !agent.tokenAddress) {
          setTimeout(() => window.location.reload(), 2000);
        }
      }
    } catch (error) {
      console.error('Failed to fetch token creation task:', error);
    }
    
    fetchInProgress.current.tokenCreationTask = false;
  }, [agent.id, agent.tokenAddress, isCreator, isAuthenticated, updateState]);

  // 获取IAO任务状态（独立方法）
  const fetchIaoTask = useCallback(async () => {
    if (fetchInProgress.current.iaoTask || !agent?.id) return;
    fetchInProgress.current.iaoTask = true;
    
    try {
      console.log('[获取IAO任务] 开始获取任务状态，agentId:', agent.id);
      const response = await fetch(`/api/agents/${agent.id}/tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        console.error('[获取IAO任务] 获取任务状态失败:', response.status);
        return;
      }

      const response_data = await response.json();

      if (response_data.code === 200 && response_data.data && Array.isArray(response_data.data.tasks)) {
        const iaoTask = response_data.data.tasks.find((task: any) => 
          task.type === 'DEPLOY_IAO' || task.type === 'REDEPLOY_IAO'
        );
        
        console.log('[获取IAO任务] 找到的IAO任务:', iaoTask ? { 
          id: iaoTask.id, 
          status: iaoTask.status, 
          type: iaoTask.type 
        } : null);
        
        updateState(() => ({ iaoTask: iaoTask || null }));

        if (iaoTask && iaoTask.status === 'COMPLETED') {
          setTimeout(() => window.location.reload(), 2000);
        }
      } else {
        console.warn('[获取IAO任务] 响应格式不正确:', response_data);
      }
    } catch (error) {
      console.error('[获取IAO任务] 获取任务状态失败:', error);
    }
    
    fetchInProgress.current.iaoTask = false;
  }, [agent?.id, updateState]);

  // 获取用户质押信息
  const fetchUserStakeInfo = useCallback(async () => {
    if (fetchInProgress.current.userStakeInfo || !isAuthenticated || !getUserStakeInfo) {
      return;
    }
    
    fetchInProgress.current.userStakeInfo = true;
    
    try {
      const info = await getUserStakeInfo();
      updateState(() => ({ userStakeInfo: info }));
    } catch (error) {
      console.error('Failed to fetch user stake info:', error);
    }
    
    fetchInProgress.current.userStakeInfo = false;
  }, [isAuthenticated, getUserStakeInfo, updateState]);

  // 获取IAO进度
  const fetchIaoProgress = useCallback(async () => {
    console.log("fetchIaoProgress中", getIaoProgress);
    
    if (fetchInProgress.current.iaoProgress || !getIaoProgress) return;
    fetchInProgress.current.iaoProgress = true;
    
    try {
      const progress = await getIaoProgress();
      console.log("fetchIaoProgress后数据", progress);
      
      updateState(() => ({ iaoProgress: progress }));
    } catch (error) {
      console.error('Failed to fetch IAO progress:', error);
    }
    
    fetchInProgress.current.iaoProgress = false;
  }, [getIaoProgress, updateState]);

  // 检查IAO有没有顺利投资完成
  const checkIaoStatus = useCallback(async () => {
    if (fetchInProgress.current.iaoStatus || !iaoContractAddress || !checkIsSuccess) return;
    fetchInProgress.current.iaoStatus = true;
    
    try {
      let isSuccess = true;
      if([1,2,3,4,5].includes(Number(agent.id))) {
        isSuccess = true;
      }
      else {
        isSuccess = await checkIsSuccess();
      }

      updateState(() => ({ isIaoSuccessful: isSuccess }));
    } catch (error) {
      console.error('Failed to check IAO status:', error);
    }
    
    fetchInProgress.current.iaoStatus = false;
  }, [iaoContractAddress, checkIsSuccess, agent.id, updateState]);

  // 使用 ref 存储防抖定时器
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 处理用户身份变化，带防抖
  const handleIdentityChange = useCallback(() => {
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 创建新的延迟执行
    debounceTimerRef.current = setTimeout(() => {
      // 只在真正发生变化时触发
      if (prevAddress.current !== address || 
          prevConnected.current !== isConnected || 
          prevAuthenticated.current !== isAuthenticated) {
        
        // 更新引用值
        prevAddress.current = address;
        prevConnected.current = isConnected;
        prevAuthenticated.current = isAuthenticated;
        
        // 获取用户相关数据，包括余额更新
        if (address && isConnected && isAuthenticated) {
          fetchUserBalance(); // 添加余额更新
          fetchUserStakeInfo();
        } else {
          // 重置用户状态，包括余额
          updateState(() => ({ 
            userStakeInfo: initialState.userStakeInfo,
            maxDbcAmount: "0",
            xaaBalance: "0", 
            maxXaaAmount: "0"
          }));
        }
      }
    }, 100);
  }, [address, isConnected, isAuthenticated, fetchUserBalance, fetchUserStakeInfo, updateState]);

  // 初始化数据 - 只在组件首次挂载时执行一次
  useEffect(() => {
    // if (isInitialized.current) return;
    // isInitialized.current = true;
    
    // // 检查此代理是否已经初始化
    // if (initializedAgents.has(agent.id)) return;
    // initializedAgents.set(agent.id, true);

    // // 初始化用户引用值
    // prevAddress.current = address;
    // prevConnected.current = isConnected;
    // prevAuthenticated.current = isAuthenticated;

    // 获取任务状态
    fetchIaoTask();
    
    // 只有在合约地址存在时才加载合约相关数据
    if (iaoContractAddress) {
      fetchUserBalance();
      fetchTokenCreationTask();

      fetchUserStakeInfo();
      fetchIaoProgress();
      checkIaoStatus();
    }
    
    // 标记为已初始化，启用定时器
    isInitialized.current = true;
    
    // // 清理函数
    // return () => {
    //   // 当组件卸载时，从缓存中删除此代理
    //   initializedAgents.delete(agent.id);
      
    //   // 清除防抖定时器
    //   if (debounceTimerRef.current) {
    //     clearTimeout(debounceTimerRef.current);
    //   }
    // };
  }, [
    // agent.id,
    // address, 
    // isConnected, 
    // isAuthenticated,
    // iaoContractAddress,
    // fetchUserBalance, 
    // fetchTokenCreationTask, 
    // fetchUserStakeInfo, 
    // fetchIaoProgress, 
    // checkIaoStatus
  ]);

  // 设置定时刷新 - 统一管理所有定时器
  useEffect(() => {
    if (!isInitialized.current) return;
    
    const timers: NodeJS.Timeout[] = [];
    
    // 任务状态监控 - 对于创建者始终启用，不依赖合约地址
    if (isCreator && isAuthenticated) {
      timers.push(setInterval(fetchTokenCreationTask, 30000));
      timers.push(setInterval(fetchIaoTask, 30000));
    }
    
    // IAO相关定时器 - 仅在有合约地址时启用
    if (iaoContractAddress) {
      // 用户余额 - 30秒更新一次
      timers.push(setInterval(fetchUserBalance, 30000));
      
      // IAO进度 - 30秒更新一次
      timers.push(setInterval(fetchIaoProgress, 30000));
      
      // IAO状态 - 60秒更新一次
      timers.push(setInterval(checkIaoStatus, 60000));
    }
    
    // 清理所有定时器
    return () => {
      timers.forEach(timer => clearInterval(timer));
    };
  }, [
    iaoContractAddress, 
    address,
    isConnected,
    isAuthenticated,
    isCreator,
    fetchUserBalance, 
    fetchIaoProgress, 
    checkIaoStatus,
    fetchTokenCreationTask,
    fetchIaoTask
  ]);

  
  // 监听用户身份变化，使用防抖处理避免连锁反应
  useEffect(() => {
    handleIdentityChange();
  }, [address, isConnected, isAuthenticated, handleIdentityChange]);

  // 监听合约地址变化，触发数据更新 - 使用 useRef 追踪上一次值以避免不必要的更新
  const prevContractAddress = useRef(iaoContractAddress);
  
  useEffect(() => {
    // 只在合约地址真正变化且有效时更新
    if (iaoContractAddress && prevContractAddress.current !== iaoContractAddress) {
      prevContractAddress.current = iaoContractAddress;
      
      // 刷新合约相关数据
      fetchPoolInfo();
      fetchIaoProgress();
      checkIaoStatus();
      
      // 如果用户已连接，也刷新用户相关数据
      if (address && isConnected && isAuthenticated) {
        fetchUserStakeInfo();
      }
    }
  }, [
    iaoContractAddress, 
    address, 
    isConnected, 
    isAuthenticated,
    fetchPoolInfo, 
    fetchIaoProgress, 
    checkIaoStatus, 
    fetchUserStakeInfo
  ]);

  // 设置dbcAmount的方法 - 保持API兼容性
  const setDbcAmount = useCallback((value: string) => {
    updateState(() => ({ dbcAmount: value }));
  }, [updateState]);

  // 避免不必要的 hook 重新执行，使用 useMemo 包装返回值
  return useMemo(() => ({
    // 状态
    dbcAmount: state.dbcAmount,
    setDbcAmount,
    maxDbcAmount: state.maxDbcAmount,
    maxXaaAmount: state.maxXaaAmount,
    xaaBalance: state.xaaBalance,
    isIaoSuccessful: state.isIaoSuccessful,
    tokenCreationTask: state.tokenCreationTask,
    distributionTask: state.distributionTask,
    iaoTask: state.iaoTask,
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
    fetchIaoTask,
    fetchIaoProgress,
    checkIaoStatus,
    fetchPoolInfo,

    // 便捷访问
    address,
    isConnected,
    isAuthenticated
  }), [
    state,
    setDbcAmount,
    poolInfo,
    isCreator,
    isIAOEnded,
    isStakeLoading,
    isPoolInfoLoading,
    isUserStakeInfoLoading,
    stake,
    claimRewards,
    isContractOwner,
    fetchUserStakeInfo,
    fetchTokenCreationTask,
    fetchIaoTask,
    fetchIaoProgress,
    checkIaoStatus,
    fetchPoolInfo,
    address,
    isConnected,
    isAuthenticated
  ]);
};
