'use client';

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { Countdown } from "../ui-custom/countdown";
import { useStakeContract } from "@/hooks/useStakeContract";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAppKitAccount } from '@reown/appkit/react'
import { useTranslations } from 'next-intl';
import { LocalAgent } from "@/data/localAgents";
import { useChainId, useSwitchChain } from 'wagmi';
import { currentChain, dbcTestnet } from '@/config/wagmi';
import { useTestNetwork } from '@/hooks/useTestNetwork';
import { CONTRACTS } from "@/config/contracts";
import { createPublicClient, http, formatEther } from 'viem';

const showIAOReal = "true"

export const IaoPool = ({ agent }: { agent: LocalAgent }) => {
  const [dbcAmount, setDbcAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState<string>("0");
  const [userStakeInfo, setUserStakeInfo] = useState({
    userDeposited: "0",
    claimableXAA: "0",
    hasClaimed: false,
    claimedAmount: "0"
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
    getUserStakeInfo
  } = useStakeContract();
  const { toast } = useToast();
  const t = useTranslations('iaoPool');
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { ensureTestNetwork } = useTestNetwork();

  // 获取用户余额
  const fetchUserBalance = useCallback(async () => {
    if (!address || !isConnected) {
      setMaxAmount("0");
      return;
    }

    try {
      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(),
      });

      const balance = await publicClient.getBalance({
        address: address as `0x${string}`
      });

      setMaxAmount(formatEther(balance));
    } catch (error) {
      console.error('获取余额失败:', error);
      setMaxAmount("0");
    }
  }, [address, isConnected]);

  // 在组件加载和地址变化时获取余额
  useEffect(() => {
    fetchUserBalance();
  }, [fetchUserBalance, address]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // 只允许数字和一个小数点，且小数位不超过18位
    if (value === '' || (
      /^\d*\.?\d*$/.test(value) && 
      Number(value) >= 0 && 
      (!value.includes('.') || value.split('.')[1]?.length <= 18)
    )) {
      if (Number(value) > Number(maxAmount)) {
        setDbcAmount(maxAmount);
        toast({
          title: t('error'),
          description: t('insufficientBalance', { amount: maxAmount }),
        });
      } else {
        setDbcAmount(value);
      }
    }
  };

  const handleSetMaxAmount = () => {
    setDbcAmount(maxAmount);
  };

  const handleStake = async () => {
    if (!isAuthenticated) {
      toast({
        title: t('error'),
        description: t('connectWalletFirst'),
      });
      return;
    }

    // 检查并尝试切换网络
    const isCorrectNetwork = await ensureTestNetwork();
    if (!isCorrectNetwork) return;

    // 1. 验证输入值是否为有效数字
    if (!dbcAmount || isNaN(Number(dbcAmount)) || Number(dbcAmount) <= 0) {
      toast({
        title: t('error'),
        description: t('enterValidAmount'),
      });
      return;
    }

    // 2. 格式化数字，去除多余小数位
    const formattedAmount = Number(dbcAmount).toFixed(18); // DBC最多18位小数

    try {
      const result = await stake(formattedAmount);
      // 如果用户拒绝签名，stake 函数会抛出错误，不会执行到这里
      if (result && result.hash) {
        toast({
          variant: "default",
          title: t('success'),
          description: t('sendSuccess', { amount: formattedAmount }),
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

  const now = Date.now();
  const isDepositPeriod = true;
  const isIAOStarted = agent.symbol === 'XAA';

  // useEffect(() => {
  //   const fetchPoolData = async () => {
  //     try {
  //       await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟数据加载
  //     } catch (error) {
  //       console.error('Failed to fetch pool data:', error);
  //     }
  //   };

  //   fetchPoolData();
  // }, []);

  const fetchUserStakeInfo = async () => {
    if (!isAuthenticated) return;
    const info = await getUserStakeInfo();
    setUserStakeInfo(info);
  };

  // 获取用户质押信息
  useEffect(() => {

    fetchUserStakeInfo();
  }, [isAuthenticated, getUserStakeInfo,]);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">{t('title')}</h2>

      <div className="space-y-4">
        <div className="text-base flex flex-wrap items-center gap-2 bg-orange-50 p-3 rounded-lg">
          <span className="text-black whitespace-nowrap">{t('totalInPool', { symbol: agent.symbol })}:</span>
          <span className="font-semibold text-[#F47521] break-all">
            {agent.totalSupply}
          </span>
        </div>

        <div className="text-base flex flex-wrap items-center gap-2 bg-blue-50 p-3 rounded-lg">
          <span className="text-black whitespace-nowrap">{t('currentTotal', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:</span>

          {
            agent.symbol === 'XAA' ? (<span className="font-semibold text-[#F47521] break-all">
              {isPoolInfoLoading || !poolInfo?.totalDeposited == null ? "--" : Number(poolInfo.totalDeposited).toLocaleString()}
            </span>
            ) :
              <span className="font-semibold text-[#F47521] break-all">
                0
              </span>
          }

        </div>

        <div className="text-base flex flex-wrap items-center gap-2 bg-purple-50 p-3 rounded-lg">
          <span className="text-black whitespace-nowrap">{t('endCountdown')}:</span>
          {agent.symbol === 'XAA'  ? (
            isPoolInfoLoading || !poolInfo?.endTime ? (
              <span className="font-semibold text-[#F47521] break-all">--</span>
            ) : (
              <Countdown
                remainingTime={Math.max(0, poolInfo.endTime * 1000 - Date.now())}
                className="font-semibold text-[#F47521] break-all"
              />
            )
          ) : (
            <span className="font-semibold text-[#F47521] break-all">{t('toBeAnnounced')}</span>
          )}
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">

          {(!poolInfo?.endTime || Date.now() < poolInfo.endTime * 1000) && (
            <>
              <h3 className="text-lg font-semibold mb-4">{t('youSend')}</h3>

              <div className="flex items-center gap-4 mb-6">
                <div className="font-medium">{agent.symbol === 'XAA' ? 'DBC' : 'XAA'}</div>
                <div className="flex-1 relative">
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
                    max={maxAmount}
                    step="any"
                    className="pr-16"
                    placeholder="00.00"
                    disabled={!isDepositPeriod || isStakeLoading || !isAuthenticated || !showIAOReal}
                  />
                  <button
                    onClick={handleSetMaxAmount}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-primary hover:text-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isAuthenticated || !isDepositPeriod || isStakeLoading}
                  >
                    {t('maxButton')}
                  </button>
                </div>
              </div>

              {showIAOReal === "true" ? (
                <Button
                  className="w-full bg-[#F47521] hover:bg-[#F47521]/90 text-white"
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
                  className="w-full bg-[#F47521] hover:bg-[#F47521]/90 text-white"
                  onClick={handleStake}
                  disabled={true}
                >
                  {t('iaoNotStarted')}
                </Button>
              )}
            </>
          )}

          {
            agent.symbol === 'XAA'  &&(
              <div className="space-y-2 mt-4">
                <p className="text-sm text-muted-foreground">
                  {t('stakedAmount', { symbol: 'DBC' })}:
                <span className="text-[#F47521]">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.userDeposited).toLocaleString()}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {userStakeInfo.hasClaimed ? (
                  <>{t('claimedAmount')}: <span className="text-[#F47521]">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.claimedAmount).toFixed(0)}</span></>
                ) : (
                  <>{t('claimableAmount')}: <span className="text-[#F47521]">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.claimableXAA).toFixed(0)}</span></>
                )}
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground mt-2">
            {t('poolDynamicTip')}
          </p>

          {(poolInfo?.endTime && Date.now() >= poolInfo.endTime * 1000) && isAuthenticated ? (
            <Button
              className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white"
              onClick={async () => {
                try {
                  const result = await claimRewards();
                  if (result?.success) {
                    toast({
                      title: t('claimSuccess'),
                      description: (
                        <div className="space-y-2">
                          <p>{t('tokenSentToWallet')}</p>
                          <p className="text-sm text-green-600">{t('claimSuccessWithAmount', { amount: result.amount })}</p>
                          <p className="text-sm text-muted-foreground">{t('importTokenAddress')}</p>
                          <code className="block p-2 bg-black/10 rounded text-xs break-all">
                            {CONTRACTS.XAA_TOKEN}
                          </code>
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
              disabled={isStakeLoading || userStakeInfo.hasClaimed}
            >
              {userStakeInfo.hasClaimed ? t('claimed') : t('testClaim')}
            </Button>
          )

            : <></>}
        </div>
      </div>
    </Card>
  );
}; 