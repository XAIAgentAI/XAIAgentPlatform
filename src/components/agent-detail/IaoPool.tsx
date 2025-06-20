'use client';

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Countdown } from "../ui-custom/countdown";
import { useStakeContract } from "@/hooks/useStakeContract";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAppKitAccount } from '@reown/appkit/react'
import { useTranslations } from 'next-intl';
import { LocalAgent } from "@/types/agent";
import { useChainId, useSwitchChain } from 'wagmi';
import { currentChain, dbcTestnet } from '@/config/wagmi';
import { CONTRACTS } from "@/config/contracts";
import { createPublicClient, http, formatEther } from 'viem';
import { useNetwork } from "@/hooks/useNetwork";
import { NFT_CONFIGS } from "../agent-list/constants/nft-config";
import { PaymentContractModal } from './PaymentContractModal';
import { UpdateIaoTimeModal } from './UpdateIaoTimeModal';

const showIAOReal = "true"

type UserStakeInfo = {
  userDeposited: string;          // 用户实际质押量
  claimableXAA: string;          // 可领取的奖励数量
  hasClaimed: boolean;           // 是否已领取
  claimedAmount: string;         // 已领取数量
  originDeposit: string;         // 原始质押量
  depositIncrByNFT: string;      // NFT带来的增加量
  incrByNFTTier: string;        // NFT等级
  rewardForOrigin: string;      // 原始质押的奖励
  rewardForNFT: string;         // NFT增加的奖励
  actualDepositedWithNFT: string; // NFT加成后的实际支付数量
};

export const IaoPool = ({ agent }: { agent: LocalAgent }) => {
  // Check if required contract addresses exist
  const iaoContractAddress = agent?.iaoContractAddress || '';
  const tokenAddress = agent?.tokenAddress || '';

  const [dbcAmount, setDbcAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState<string>("0");
  const [xaaBalance, setXaaBalance] = useState<string>("0");

  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [isIaoSuccessful, setIsIaoSuccessful] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUpdateTimeModalOpen, setIsUpdateTimeModalOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenCreationTask, setTokenCreationTask] = useState<{
    id: string;
    status: string;
    createdAt: string;
  } | null>(null);
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
  const { address, isConnected } = useAppKitAccount();
  const { isAuthenticated } = useAuth();
  const {
    poolInfo,
    isLoading: isStakeLoading,
    isPoolInfoLoading,
    isUserStakeInfoLoading,
    stake,
    claimRewards,
    getUserStakeInfo,
    checkIsSuccess,
    getContractOwner,
    isContractOwner,
    updateIaoTimes
  } = useStakeContract(tokenAddress as `0x${string}`, iaoContractAddress as `0x${string}`, agent.symbol || '');
  const { toast } = useToast();
  const t = useTranslations('iaoPool');
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { ensureCorrectNetwork } = useNetwork();

  // Get user balance
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

      // Get DBC balance
      const dbcBalance = await publicClient.getBalance({
        address: address as `0x${string}`
      });
      setMaxAmount(formatEther(dbcBalance));

      // Get XAA balance
      const ERC20_ABI = [
        {
          "constant": true,
          "inputs": [
            {
              "name": "_owner",
              "type": "address"
            }
          ],
          "name": "balanceOf",
          "outputs": [
            {
              "name": "balance",
              "type": "uint256"
            }
          ],
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

  // Load balance on component mount and address change
  useEffect(() => {
    fetchUserBalance();
    // Set timer to update balance every 30 seconds
    const timer = setInterval(() => {
      fetchUserBalance();
    }, 30000);

    return () => clearInterval(timer);
  }, [fetchUserBalance, address, isConnected]);

  // 直接通过地址比较判断是否是创建者
  const isCreator = address && ((agent as any)?.creator?.address) && address.toLowerCase() === (agent as any).creator.address.toLowerCase();

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
        if (data.code === 200) {
          // 查找最新的CREATE_TOKEN任务
          const createTokenTask = data.data.tasks.find((task: any) => task.type === 'CREATE_TOKEN');
          if (createTokenTask) {
            setTokenCreationTask(createTokenTask);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch token creation task:', error);
    }
  }, [agent.id, isCreator, isAuthenticated]);

  // 检查IAO是否成功结束
  useEffect(() => {
    const checkIaoStatus = async () => {
      if (!iaoContractAddress) return;

      try {
        const isSuccess = await checkIsSuccess();
        console.log('isSuccess', isSuccess);
        setIsIaoSuccessful(isSuccess);
      } catch (error) {
        console.error('Failed to check IAO status:', error);
      }
    };

    checkIaoStatus();
    // 定期检查IAO状态
    const interval = setInterval(checkIaoStatus, 60000); // 每分钟检查一次

    return () => clearInterval(interval);
  }, [iaoContractAddress]);

  // 获取token创建任务状态
  useEffect(() => {
    fetchTokenCreationTask();
  }, [fetchTokenCreationTask]);

  // 轮询检查任务状态
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    // 如果有正在进行的任务，开始轮询
    if (tokenCreationTask && (tokenCreationTask.status === 'PENDING' || tokenCreationTask.status === 'PROCESSING')) {
      interval = setInterval(() => {
        fetchTokenCreationTask();
      }, 5000); // 每5秒检查一次
    }

    // 如果任务完成且成功，刷新页面以显示新的token信息
    if (tokenCreationTask && tokenCreationTask.status === 'COMPLETED' && !agent.tokenAddress) {
      setTimeout(() => {
        window.location.reload();
      }, 2000); // 2秒后刷新页面
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [tokenCreationTask?.status, fetchTokenCreationTask, agent.tokenAddress]);

  // 检查用户是否是合约所有者
  useEffect(() => {
    const checkOwnership = async () => {
      if (!address || !isConnected || !iaoContractAddress || !isContractOwner) {
        setIsOwner(false);
        return;
      }

      try {
        const ownerStatus = await isContractOwner();
        setIsOwner(ownerStatus);
      } catch (error) {
        console.error('Failed to check contract ownership:', error);
        setIsOwner(false);
      }
    };

    checkOwnership();
  }, [address, isConnected, iaoContractAddress, isContractOwner]);

  // 创建Token的函数
  const handleCreateToken = async () => {
    if (!isCreator || !isIaoSuccessful) {
      toast({
        title: t('error'),
        description: t('onlyCreatorAfterSuccess'),
      });
      return;
    }

    // 检查网络
    const isCorrectNetwork = await ensureCorrectNetwork();
    if (!isCorrectNetwork) return;

    try {
      setIsCreatingToken(true);

      // 调用API创建Token并自动设置到IAO合约
      const response = await fetch('/api/agents/create-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          agentId: agent.id,
        }),
      });

      const data = await response.json();

      if (data.code === 200) {
        toast({
          title: t('success'),
          description: t('tokenCreationSubmitted'),
        });

        // 立即获取任务状态
        fetchTokenCreationTask();
      } else {
        throw new Error(data.message || t('operationFailed'));
      }
    } catch (error: any) {
      console.error('Create token failed:', error);
      toast({
        title: t('error'),
        description: error.message || t('operationFailed'),
      });
    } finally {
      setIsCreatingToken(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Current maximum available amount
    const currentMaxAmount = agent.symbol === 'XAA' ? maxAmount : xaaBalance;

    // Only allow numbers and one decimal point, with max 18 decimal places
    if (value === '' || (
      /^\d*\.?\d*$/.test(value) &&
      Number(value) >= 0 &&
      (!value.includes('.') || value.split('.')[1]?.length <= 18)
    )) {
      if (Number(value) > Number(currentMaxAmount)) {
        setDbcAmount(currentMaxAmount);
        toast({
          title: t('error'),
          description: t('insufficientBalance', {
            amount: currentMaxAmount,
            symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA'
          }),
        });
      } else {
        setDbcAmount(value);
      }
    }
  };

  const handleSetMaxAmount = () => {
    // If symbol is XAA, use DBC max amount; otherwise use XAA max amount
    if (agent.symbol === 'XAA') {
      setDbcAmount(maxAmount);
    } else {
      setDbcAmount(xaaBalance);
    }
  };

  const handleStake = async () => {
    if (!isAuthenticated) {
      toast({
        title: t('error'),
        description: t('connectWalletFirst'),
      });
      return;
    }

    // Check and try to switch network
    const isCorrectNetwork = await ensureCorrectNetwork();
    if (!isCorrectNetwork) return;

    // 1. Validate input value
    if (!dbcAmount || isNaN(Number(dbcAmount)) || Number(dbcAmount) <= 0) {
      toast({
        title: t('error'),
        description: t('enterValidAmount'),
      });
      return;
    }

    // 2. Format number, remove extra decimal places
    const formattedAmount = Number(dbcAmount).toFixed(18); // DBC max 18 decimal places

    try {
      const result = await stake(formattedAmount, agent.symbol || '', agent.tokenAddress || '');
      // If user rejects signature, stake function will throw error and won't execute here
      if (result && result.hash) {
        toast({
          variant: "default",
          title: t('success'),
          description: t('sendSuccess', { amount: Number(formattedAmount).toFixed(2), symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' }),
        });
        fetchUserStakeInfo()
        setDbcAmount("");
      }
    } catch (error: any) {
      toast({
        title: t('error'),
        description: t('stakeFailed') + ' ' + error.message,
      });
    }
  };

  const isDepositPeriod = true;
  const isIAOStarted = poolInfo?.endTime && Date.now() < poolInfo.endTime * 1000 && poolInfo?.startTime && Date.now() > poolInfo.startTime * 1000;

  const fetchUserStakeInfo = async () => {
    if (!isAuthenticated) return;
    const info = await getUserStakeInfo();
    setUserStakeInfo(info);
  };

  // Get user stake info
  useEffect(() => {
    fetchUserStakeInfo();
  }, [isAuthenticated, getUserStakeInfo,]);

  const isIAOEnded = useMemo(() => {
    return poolInfo?.endTime && Date.now() >= poolInfo.endTime * 1000;
  }, [poolInfo]);

  return (
    <Card className="p-4 sm:p-6">

      <div className="flex justify-end items-center mb-4">
        <Button
          variant="outline"
          className="relative flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#F47521] via-[#F47521]/90 to-[#F47521] text-white rounded-lg overflow-hidden transform hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(244,117,33,0.5)] transition-all duration-300 group animate-subtle-bounce text-sm sm:text-base"
          onClick={() => window.open('https://dbcswap.io/#/swap', '_blank')}
          aria-label={t('goToDbcswap', { symbol: agent.symbol })}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 animate-wave" />
          <span className="relative z-10 font-medium">
            {t('goToDbcswap', { symbol: agent.symbol })}
          </span>
          <div className="relative z-10 flex items-center animate-arrow-move">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1 sm:w-4 sm:h-4"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <div className="absolute left-0 w-5 h-5 bg-white/30 rounded-full blur-sm -z-10 animate-ping" />
          </div>
        </Button>
      </div>

      <style jsx global>{`
        @keyframes wave {
          0%, 100% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
        }
        
        @keyframes subtle-bounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-4px) scale(1.02);
          }
        }
        
        @keyframes arrow-move {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(5px);
          }
        }
        
        .animate-wave {
          animation: wave 2s ease-in-out infinite;
        }
        
        .animate-subtle-bounce {
          animation: subtle-bounce 1.5s ease-in-out infinite;
        }
        
        .animate-arrow-move {
          animation: arrow-move 1.2s ease-in-out infinite;
        }
        
        .animate-ping {
          animation: ping 1.2s ease-in-out infinite;
        }
      `}</style>



      {isIAOEnded ? (
        // Pool data after IAO ends
        <>
          <h2 className="text-lg sm:text-xl font-bold">{t('iaoCompletedData')}</h2>
          {/* 创建token和创建支付合约 */}
          <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-4 mb-2">
            {/* 创建者专属按钮和状态显示 */}
            {isCreator && isIaoSuccessful && (
              <>
                {/* Token状态显示 */}
                {tokenCreationTask && !agent.tokenAddress && (
                  <div className={`w-full sm:w-fit border rounded-lg px-3 py-2 text-sm sm:text-base ${
                    tokenCreationTask.status === 'FAILED'
                      ? 'bg-red-50 border-red-200'
                      : tokenCreationTask.status === 'COMPLETED'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {tokenCreationTask.status === 'PENDING' || tokenCreationTask.status === 'PROCESSING' ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-blue-700 font-medium">{t('tokenCreating')}</span>
                        </>
                      ) : tokenCreationTask.status === 'COMPLETED' ? (
                        <>
                          <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          <span className="text-green-700 font-medium">{t('tokenCreated')}</span>
                        </>
                      ) : tokenCreationTask.status === 'FAILED' || tokenCreationTask.status === 'PARTIAL_SUCCESS' ? (
                        <>
                          <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                          <span className="text-red-700 font-medium">{t('tokenCreationFailed')}</span>
                          <button
                            onClick={fetchTokenCreationTask}
                            className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                            title={t('refreshStatus')}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* 创建Token按钮 - 根据任务状态显示不同的按钮 */}
                {!agent.tokenAddress && (!tokenCreationTask || (tokenCreationTask.status !== 'PENDING' && tokenCreationTask.status !== 'PROCESSING')) && (
                  <Button
                    className={`w-full sm:w-fit text-white text-sm sm:text-base h-10 ${
                      tokenCreationTask && (tokenCreationTask.status === 'FAILED' || tokenCreationTask.status === 'PARTIAL_SUCCESS')
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                    onClick={handleCreateToken}
                    disabled={isCreatingToken}
                  >
                    {isCreatingToken ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm sm:text-base">{t('creatingToken')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {tokenCreationTask && (tokenCreationTask.status === 'FAILED' || tokenCreationTask.status === 'PARTIAL_SUCCESS') && (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                          </svg>
                        )}
                        <span className="text-sm sm:text-base">
                          {tokenCreationTask && (tokenCreationTask.status === 'FAILED' || tokenCreationTask.status === 'PARTIAL_SUCCESS')
                            ? t('retryCreateToken')
                            : t('createToken')
                          }
                        </span>
                      </div>
                    )}
                  </Button>
                )}
              </>
            )}
            {console.log("agent", isIaoSuccessful, agent.paymentContractAddress)}
            {
              isCreator && isIaoSuccessful && !agent.paymentContractAddress && (
                // isCreator && isIaoSuccessful && !agent.paymentContractAddress && (
                <>
                  <Button
                    className="bg-[#F47521] hover:bg-[#F47521]/90 text-white w-full sm:w-fit text-sm sm:text-base h-10 flex items-center justify-center gap-2"
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    <span>{t('updatePaymentContract')}</span>
                  </Button>
                </>
              )
            }
          </div>



          <div className="space-y-3 sm:space-y-4">
            <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-orange-50 p-3 rounded-lg">
              <span className="text-black font-medium">
                {t('iaoReleasedAmount', { symbol: agent.symbol })}:
              </span>
              <span className="font-semibold text-[#F47521] break-all">
                {Number(poolInfo.totalReward)?.toLocaleString()}
              </span>
            </div>

            <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-blue-50 p-3 rounded-lg">
              <span className="text-black font-medium">
                {t('iaoParticipatedAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
              </span>
              <span className="font-semibold text-[#F47521] break-all">
                {isPoolInfoLoading ? "--" : Number(poolInfo?.totalDeposited)?.toLocaleString()}
              </span>
            </div>
          </div>



          <div className="mt-6 sm:mt-8">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t('lpPoolData')}</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-purple-50 p-3 rounded-lg">
                <span className="text-black font-medium">
                  {t('lpPoolTokenAmount', { symbol: agent.symbol })}:
                </span>
                <span className="font-semibold text-[#F47521] break-all">
                  {(agent as any).targetTokenAmountLp?.toLocaleString() || 0}
                </span>
              </div>

              <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-green-50 p-3 rounded-lg">
                <span className="text-black font-medium">
                  {t('lpPoolBaseAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
                </span>
                <span className="font-semibold text-[#F47521] break-all">
                  {(agent as any).baseTokenAmountLp?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>

          {
            userStakeInfo.hasClaimed && poolInfo?.endTime && Date.now() >= poolInfo.endTime * 1000 + 7 * 24 * 60 * 60 * 1000 ? (<>
            </>) :
              // ({/* Claim button after IAO ends */ }
              (isConnected) ? (
                <>
                  <Button
                    className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white"
                    onClick={async () => {
                      try {
                        const result: any = await claimRewards();
                        if (result?.success) {
                          // Refresh user stake info after successful claim
                          await fetchUserStakeInfo();
                          toast({
                            title: t('claimSuccess'),
                            description: (
                              <div className="space-y-2">
                                <p>{t('tokenSentToWallet')}</p>
                                <p className="text-sm text-green-600">{t('claimSuccessWithAmount', { amount: result.amount })}</p>
                                <p className="text-sm text-muted-foreground">{t('importTokenAddress')}</p>
                                <div className="relative">
                                  <code className="block p-2 bg-black/10 rounded text-xs break-all pr-24">
                                    {agent.tokenAddress}
                                  </code>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                    onClick={() => {
                                      if (agent.tokenAddress) {
                                        navigator.clipboard.writeText(agent.tokenAddress);
                                        toast({
                                          description: t('copied'),
                                          duration: 2000,
                                        });
                                      }
                                    }}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="mr-1"
                                    >
                                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                    </svg>
                                    {t('copy')}
                                  </Button>
                                </div>
                              </div>
                            ),
                          });
                        }
                      } catch (error: any) {
                        toast({
                          title: t('error'),
                          description: error.message || t('stakeFailed'),
                        });
                      }
                    }}
                    disabled={isStakeLoading || userStakeInfo.hasClaimed || Number(userStakeInfo.userDeposited) <= 0}
                  >
                    {isStakeLoading ? t('claiming') : userStakeInfo.hasClaimed ? t('claimed') : t('claim')}
                  </Button>

                  {/* 募资结束后，投资数量统计个人信息 */}
                  {!!userStakeInfo.userDeposited && (
                    <div className="space-y-3 mt-4">
                      {/* 用户投资统计 */}
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t('stakedAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
                          <span className="text-[#F47521] ml-1">
                            {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.userDeposited).toLocaleString()}
                          </span>
                        </p>
                        {/* <p className="text-sm text-muted-foreground mt-1">
                          {t('nftBoostAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
                          <span className="text-[#F47521] ml-1">
                            {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.depositIncrByNFT).toLocaleString()}
                          </span>
                        </p> */}
                      </div>
                      {/* 可领取/已领取奖励 */}
                      {userStakeInfo.hasClaimed ? (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {t('claimedAmount', { symbol: agent.symbol })}:
                            <span className="text-[#F47521] ml-1">
                              {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.claimedAmount).toLocaleString()}
                            </span>
                          </p>
                          <div className="pl-4 space-y-1">
                            <p className="text-sm text-muted-foreground">
                              {t('baseClaimableAmount')}:
                              <span className="text-[#F47521] ml-1">
                                {isUserStakeInfoLoading ? "--" : (Number(userStakeInfo.rewardForOrigin)).toLocaleString()}
                              </span>
                            </p>
                            {
                              agent.symbol !== 'XAA' && (
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-muted-foreground">
                                    {t('nftBoostClaimableAmount')}:
                                    <span className="text-[#F47521] ml-1">
                                      {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.rewardForNFT).toLocaleString()}
                                    </span>
                                    {!isUserStakeInfoLoading && userStakeInfo.incrByNFTTier !== "0" && (
                                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium ml-2">
                                        {NFT_CONFIGS.find(config => config.id === Number(userStakeInfo.incrByNFTTier))?.name || 'Node'}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              )
                            }
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {t('claimableAmount', { symbol: agent.symbol })}:
                            <span className="text-[#F47521] ml-1">
                              {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.claimableXAA).toLocaleString()}
                            </span>
                          </p>
                          <div className="pl-4 space-y-1">
                            <p className="text-sm text-muted-foreground">
                              {t('baseClaimableAmount')}:
                              <span className="text-[#F47521] ml-1">
                                {isUserStakeInfoLoading ? "--" : (Number(userStakeInfo.rewardForOrigin)).toLocaleString()}
                              </span>
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">
                                {t('nftBoostClaimableAmount')}:
                                <span className="text-[#F47521] ml-1">
                                  {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.rewardForNFT).toLocaleString()}
                                </span>
                                {!isUserStakeInfoLoading && userStakeInfo.incrByNFTTier !== "0" && (
                                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium ml-2">
                                    {NFT_CONFIGS.find(config => config.id === Number(userStakeInfo.incrByNFTTier))?.name || 'Node'}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : <></>}


        </>
      )
        :
        // Pool data before IAO ends
        <>
          {/* 募资进行中，显示的池子数据 */}
          <h2 className="text-xl sm:text-2xl font-bold mb-0 ">{t('title')}</h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-2  sm:mb-4 justify-end items-start sm:items-center ">
            {isOwner && !isIAOEnded && (
              <Button
                className="bg-[#F47521] hover:bg-[#F47521]/90 text-white w-full sm:w-fit text-sm sm:text-base flex items-center justify-center gap-2"
                onClick={() => setIsUpdateTimeModalOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="sm:w-4 sm:h-4"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
                <span>{t('updateIaoTime')}</span>
              </Button>
            )}
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-orange-50 p-3 rounded-lg">
              <span className="text-black font-medium">{t('totalInPool', { symbol: agent.symbol })}:</span>
              <span className="font-semibold text-[#F47521] break-all">
                {isPoolInfoLoading ? "--" : Number(poolInfo.totalReward).toLocaleString()} {agent.symbol}
              </span>
            </div>

            <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-blue-50 p-3 rounded-lg">
              <span className="text-black font-medium">{t('currentTotal', { symbol: agent.tokenAddress === 'XAA' ? 'DBC' : 'XAA' })}:</span>

              {
                poolInfo.startTime ? (<span className="font-semibold text-[#F47521] break-all">
                  {isPoolInfoLoading ? "--" : Number(poolInfo.totalDeposited).toLocaleString()}
                </span>
                ) :
                  <span className="font-semibold text-[#F47521] break-all">
                    0
                  </span>
              }

            </div>

            <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-purple-50 p-3 rounded-lg">
              <span className="text-black font-medium">
                {poolInfo?.startTime && Date.now() < poolInfo.startTime * 1000
                  ? t('startCountdown')
                  : t('endCountdown')
                }:
              </span>
              {poolInfo?.startTime ? (
                isPoolInfoLoading ? (
                  <span className="font-semibold text-[#F47521] break-all">--</span>
                ) : Date.now() < poolInfo.startTime * 1000 ? (
                  // Show countdown to start
                  <Countdown
                    remainingTime={Math.max(0, poolInfo.startTime * 1000 - Date.now())}
                    className="font-semibold text-[#F47521] break-all text-sm sm:text-base"
                  />
                ) : poolInfo?.endTime ? (
                  // Show countdown to end
                  <Countdown
                    remainingTime={Math.max(0, poolInfo.endTime * 1000 - Date.now())}
                    className="font-semibold text-[#F47521] break-all text-sm sm:text-base"
                  />
                ) : (
                  <span className="font-semibold text-[#F47521] break-all">{t('toBeAnnounced')}</span>
                )
              ) : (
                <span className="font-semibold text-[#F47521] break-all">{t('toBeAnnounced')}</span>
              )}
            </div>

          </div>





          {/* 募资结束前，投资按钮 */}
          {
            (!poolInfo?.endTime || Date.now() < poolInfo.endTime * 1000) && (
              <div className="mt-0 pt-4 sm:pt-6 bg-muted rounded-lg">

                {(
                  <>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t('youSend')}</h3>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="font-medium text-sm sm:text-base min-w-fit">{agent.symbol === 'XAA' ? 'DBC' : 'XAA'}</div>
                      <div className="flex-1 w-full relative">
                        <Input
                          type="number"
                          value={dbcAmount}
                          onChange={handleInputChange}
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e') {
                              e.preventDefault();
                            }
                          }}
                          min="0"
                          max={agent.symbol === 'XAA' ? maxAmount : xaaBalance}
                          step="any"
                          className="pr-12 sm:pr-16 text-sm sm:text-base"
                          placeholder="00.00"
                          disabled={!isDepositPeriod || isStakeLoading || !isAuthenticated || !showIAOReal}
                        />
                        <button
                          onClick={handleSetMaxAmount}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 sm:px-2 py-1 text-xs font-semibold text-primary hover:text-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!isAuthenticated || !isDepositPeriod || isStakeLoading}
                        >
                          {t('maxButton')}
                        </button>
                      </div>
                    </div>


                    {showIAOReal === "true" ? (
                      <Button
                        className="w-full bg-[#F47521] hover:bg-[#F47521]/90 text-white text-sm sm:text-base py-2 sm:py-3"
                        onClick={handleStake}
                        disabled={!isAuthenticated || !isDepositPeriod || isStakeLoading || !isIAOStarted}
                      >
                        {!isIAOStarted
                          ? t('iaoNotStarted')
                          : !isAuthenticated
                            ? t('connectWalletFirst')
                            : isStakeLoading
                              ? t('processing')
                              : isDepositPeriod
                                ? t('send')
                                : t('stakeNotStarted')}
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-[#F47521] hover:bg-[#F47521]/90 text-white text-sm sm:text-base py-2 sm:py-3"
                        onClick={handleStake}
                        disabled={true}
                      >
                        {t('iaoNotStarted')}
                      </Button>
                    )}
                  </>
                )}
              </div>
            )
          }

          {/* 募资结束后，投资数量统计个人信息 */}
          {!!userStakeInfo.userDeposited && (
            <div className="space-y-3 mt-4">
              {/* 用户投资统计 */}
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('stakedAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
                  <span className="text-[#F47521] ml-1">
                    {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.userDeposited).toLocaleString()}
                  </span>
                </p>
                {/* <p className="text-sm text-muted-foreground mt-1">
                  {t('nftBoostAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
                  <span className="text-[#F47521] ml-1">
                    {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.depositIncrByNFT).toLocaleString()}
                  </span>
                </p> */}
              </div>

              {/* 可领取/已领取奖励 */}
              {userStakeInfo.hasClaimed ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t('claimedAmount', { symbol: agent.symbol })}:
                    <span className="text-[#F47521] ml-1">
                      {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.claimedAmount).toLocaleString()}
                    </span>
                  </p>
                  <div className="pl-4 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {t('baseClaimableAmount')}:
                      <span className="text-[#F47521] ml-1">
                        {isUserStakeInfoLoading ? "--" : (Number(userStakeInfo.rewardForOrigin)).toLocaleString()}
                      </span>
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {t('nftBoostClaimableAmount')}:
                        <span className="text-[#F47521] ml-1">
                          {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.rewardForNFT).toLocaleString()}
                        </span>
                        {!isUserStakeInfoLoading && userStakeInfo.incrByNFTTier !== "0" && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium ml-2">
                            {NFT_CONFIGS.find(config => config.id === Number(userStakeInfo.incrByNFTTier))?.name || 'Node'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t('claimableAmount', { symbol: agent.symbol })}:
                    <span className="text-[#F47521] ml-1">
                      {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.claimableXAA).toLocaleString()}
                    </span>
                  </p>
                  <div className="pl-4 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {t('baseClaimableAmount')}:
                      <span className="text-[#F47521] ml-1">
                        {isUserStakeInfoLoading ? "--" : (Number(userStakeInfo.rewardForOrigin)).toLocaleString()}
                      </span>
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {t('nftBoostClaimableAmount')}:
                        <span className="text-[#F47521] ml-1">
                          {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.rewardForNFT).toLocaleString()}
                        </span>
                        {!isUserStakeInfoLoading && userStakeInfo.incrByNFTTier !== "0" && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium ml-2">
                            {NFT_CONFIGS.find(config => config.id === Number(userStakeInfo.incrByNFTTier))?.name || 'Node'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}



          <p className="text-sm text-muted-foreground mt-2">
            {t('poolDynamicTip', { symbol: agent.symbol, investSymbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}
          </p>


        </>

      }

      {/* 支付合约部署模态框 */}
      <PaymentContractModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        agentId={agent.id}
        tokenAddress={tokenAddress}
        ownerAddress={address || ''}
        onSuccess={() => {
          // 刷新页面或更新状态
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }}
      />

      {/* 修改IAO时间模态框 */}
      {updateIaoTimes && (
        <UpdateIaoTimeModal
          isOpen={isUpdateTimeModalOpen}
          onOpenChange={setIsUpdateTimeModalOpen}
          currentStartTime={poolInfo?.startTime || 0}
          currentEndTime={poolInfo?.endTime || 0}
          onUpdateTimes={(startTime: number, endTime: number) => updateIaoTimes(startTime, endTime, agent.id)}
          isLoading={isStakeLoading}
        />
      )}
    </Card>
  );
};