'use client';

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Countdown } from "../ui-custom/countdown";
import { useStakeContract } from "@/hooks/useStakeContract";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAppKitAccount } from '@reown/appkit/react'
import { useTranslations } from 'next-intl';
import { LocalAgent } from "@/data/localAgents";
import { useChainId, useSwitchChain } from 'wagmi';
import { dbcTestnet } from '@/config/wagmi';
import { useTestNetwork } from '@/hooks/useTestNetwork';
import { CONTRACTS } from "@/config/contracts";

export const IaoPool = ({ agent }: { agent: LocalAgent }) => {
  const [dbcAmount, setDbcAmount] = useState("");
  const [claimableXAA, setClaimableXAA] = useState("0");
  const { address, isConnected } = useAppKitAccount();
  const { isAuthenticated } = useAuth();
  const { poolInfo, isLoading: isStakeLoading, stake, claimRewards, getClaimableXAA } = useStakeContract();
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();
  const t = useTranslations('iaoPool');
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { ensureTestNetwork } = useTestNetwork();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 只允许输入正数和小数点
    if (value === '' || (/^\d*\.?\d*$/.test(value) && Number(value) >= 0)) {
      setDbcAmount(value);
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

    // 检查并尝试切换网络
    const isCorrectNetwork = await ensureTestNetwork();
    if (!isCorrectNetwork) return;

    if (!dbcAmount || Number(dbcAmount) <= 0) {
      toast({
        title: t('error'),
        description: t('enterValidAmount'),
      });
      return;
    }

    try {
      const result = await stake(dbcAmount);
      // 如果用户拒绝签名，stake 函数会抛出错误，不会执行到这里
      if (result && result.hash) {
        toast({
          variant: "default",
          title: t('success'),
          description: t('stakeSuccessful'),
        });
        setDbcAmount("");
      }
    } catch (error: any) {
      toast({
        title: t('error'),
        description: t('stakeFailed'),
      });
    }
  };

  const now = Date.now();
  // const isDepositPeriod = !isDataLoading && now >= poolInfo.startTime * 1000 && now <= poolInfo.endTime * 1000;
  const isDepositPeriod = true;
  const isIAOStarted = agent.symbol === 'XAA';

  useEffect(() => {
    const fetchPoolData = async () => {
      try {
        setIsDataLoading(true);
        // 这里可以添加获取池子数据的逻辑
        await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟数据加载
      } catch (error) {
        console.error('Failed to fetch pool data:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchPoolData();
  }, []);

  // 获取可领取的XAA数量
  useEffect(() => {
    const fetchClaimableXAA = async () => {
      if (!isAuthenticated) return;
      const amount = await getClaimableXAA();
      setClaimableXAA(Number(amount).toFixed(2));
    };

    fetchClaimableXAA();
  }, [isAuthenticated, getClaimableXAA, poolInfo]);

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
          <span className="font-semibold text-[#F47521] break-all">
            {isDataLoading || !poolInfo?.totalDeposited ? "--" : Number(poolInfo.totalDeposited).toLocaleString()}
          </span>
        </div>

        <div className="text-base flex flex-wrap items-center gap-2 bg-purple-50 p-3 rounded-lg">
          <span className="text-black whitespace-nowrap">{t('endCountdown')}:</span>
          {process.env.NEXT_PUBLIC_IS_TEST_ENV === "true" ? (
            isDataLoading || !poolInfo?.endTime ? (
              <span className="font-semibold text-[#F47521] break-all">--</span>
              // <span className="font-semibold text-[#F47521] break-all">{t('toBeAnnounced')}</span>
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
          <h3 className="text-lg font-semibold mb-4">{t('youSend')}</h3>

          <div className="flex items-center gap-4 mb-6">
            <div className="font-medium">{agent.symbol === 'XAA' ? 'DBC' : 'XAA'}</div>
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
              step="any"
              className="flex-1 placeholder:text-muted-foreground/50"
              placeholder="0.0"
              disabled={!isDepositPeriod || isStakeLoading || !isAuthenticated || isDataLoading || !process.env.NEXT_PUBLIC_IS_TEST_ENV}
            />
          </div>

          {process.env.NEXT_PUBLIC_IS_TEST_ENV === "true" ? (
            <>
              <Button
                className="w-full bg-[#F47521] hover:bg-[#F47521]/90 text-white"
                onClick={handleStake}
                disabled={!isAuthenticated || !isDepositPeriod || isStakeLoading || isDataLoading || !isIAOStarted}
              >
                {!isIAOStarted
                  ? t('iaoNotStarted') 
                  : isDataLoading
                  ? t('loadingData')
                  : !isAuthenticated
                    ? t('connectWalletFirst')
                    : isStakeLoading
                      ? t('processing')
                      : isDepositPeriod
                        ? t('send')
                        : t('stakeNotStarted')}
              </Button>



              {isAuthenticated && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t('stakedAmount', { symbol: 'DBC' })}: <span className="text-[#F47521]">{isDataLoading || !poolInfo?.userDeposited ? "--" : Number(poolInfo.userDeposited).toLocaleString()}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    可领取的XAA数量: <span className="text-[#F47521]">{isDataLoading || !claimableXAA || claimableXAA === "0" ? "--" : claimableXAA}</span>
                  </p>
                </div>
              )}

              <p className="text-sm text-muted-foreground mt-2">
                {t('poolDynamicTip')}
              </p>

              {(!poolInfo?.endTime || Date.now() >= poolInfo.endTime * 1000) && isAuthenticated && (
                <Button
                  className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white"
                  onClick={async () => {
                    try {
                      await claimRewards();
                      toast({
                        title: t('claimSuccess'),
                        description: (
                          <div className="space-y-2">
                            <p>{t('tokenSentToWallet')}</p>
                            <p className="text-sm text-muted-foreground">{t('importTokenAddress')}</p>
                            <code className="block p-2 bg-black/10 rounded text-xs break-all">
                              {CONTRACTS.XAA_TOKEN}
                            </code>
                          </div>
                        ),
                      });
                    } catch (error: any) {
                      toast({
                        title: t('error'),
                        description: error.message || t('stakeFailed'),
                      });
                    }
                  }}
                  disabled={isStakeLoading}
                >
                  {t('testClaim')}
                </Button>
              )}



            </>
          ) : (
            <Button
              className="w-full bg-[#F47521] hover:bg-[#F47521]/90 text-white"
              onClick={handleStake}
              disabled={true}
            >
              {t('iaoNotStarted')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}; 