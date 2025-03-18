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

const showIAOReal = "true"

export const IaoPool = ({ agent }: { agent: LocalAgent }) => {
  // 检查必要的合约地址是否存在
  const iaoContractAddress = agent?.iaoContractAddress || '';
  const tokenAddress = agent?.tokenAddress || '';

  const [dbcAmount, setDbcAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState<string>("0");
  const [xaaBalance, setXaaBalance] = useState<string>("0");
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
  } = useStakeContract(tokenAddress as `0x${string}`, iaoContractAddress as `0x${string}`, agent.symbol);
  const { toast } = useToast();
  const t = useTranslations('iaoPool');
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { ensureCorrectNetwork } = useNetwork();

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

      // 获取DBC余额
      const dbcBalance = await publicClient.getBalance({
        address: address as `0x${string}`
      });
      setMaxAmount(formatEther(dbcBalance));

      // 获取XAA余额
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
        console.error('获取XAA余额失败:', error);
        setXaaBalance("0");
      }
    } catch (error) {
      console.error('获取余额失败:', error);
      setMaxAmount("0");
      setXaaBalance("0");
    }
  }, [address, isConnected]);

  // 在组件加载和地址变化时获取余额
  useEffect(() => {
    fetchUserBalance();
    // 设置定时器，每30秒更新一次余额
    const timer = setInterval(() => {
      fetchUserBalance();
    }, 30000);

    return () => clearInterval(timer);
  }, [fetchUserBalance, address, isConnected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 当前最大可用金额
    const currentMaxAmount = agent.symbol === 'XAA' ? maxAmount : xaaBalance;

    // 只允许数字和一个小数点，且小数位不超过18位
    if (value === '' || (
      /^\d*\.?\d*$/.test(value) &&
      Number(value) >= 0 &&
      (!value.includes('.') || value.split('.')[1]?.length <= 18)
    )) {
      if (Number(value) > Number(currentMaxAmount)) {
        setDbcAmount(currentMaxAmount);
        toast({
          title: t('error'),
          description: t('insufficientBalance', { amount: currentMaxAmount }),
        });
      } else {
        setDbcAmount(value);
      }
    }
  };

  const handleSetMaxAmount = () => {
    // 如果symbol是XAA，使用DBC的最大值；否则使用XAA的最大值
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

    // 检查并尝试切换网络
    const isCorrectNetwork = await ensureCorrectNetwork();
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
      const result = await stake(formattedAmount, agent.symbol, agent.tokenAddress);
      // 如果用户拒绝签名，stake 函数会抛出错误，不会执行到这里
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

  const now = Date.now();
  const isDepositPeriod = true;
  const isIAOStarted = poolInfo?.endTime && Date.now() < poolInfo.endTime * 1000 && poolInfo?.startTime && Date.now() > poolInfo.startTime * 1000;

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
    console.log("fetchUserStakeInfo", info);



    setUserStakeInfo(info);
  };

  // 获取用户质押信息
  useEffect(() => {

    fetchUserStakeInfo();
  }, [isAuthenticated, getUserStakeInfo,]);

  const isIAOEnded = useMemo(() => {
    return poolInfo?.endTime && Date.now() >= poolInfo.endTime * 1000;
  }, [poolInfo]);

  return (
    <Card className="p-6">

      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => window.open('https://dbcswap.io/#/swap', '_blank')}
          aria-label={t('goToDbcswap', { symbol: agent.symbol })}
        >
          {t('goToDbcswap', { symbol: agent.symbol })}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-1"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </Button>
      </div>



      {isIAOEnded ? (
        // 募资结束后，显示的池子数据
        <>
          <h2 className="text-xl font-bold mb-6">IAO已结束，完成的数据:</h2>

          <div className="space-y-4">
            <div className="text-base flex flex-wrap items-center gap-2 bg-orange-50 p-3 rounded-lg">
              <span className="text-black whitespace-nowrap">
                {t('iaoReleasedAmount', { symbol: agent.symbol })}:
              </span>
              <span className="font-semibold text-[#F47521] break-all">
                {Number(agent.iaoTokenAmount)?.toLocaleString()}
              </span>
            </div>

            <div className="text-base flex flex-wrap items-center gap-2 bg-blue-50 p-3 rounded-lg">
              <span className="text-black whitespace-nowrap">
                {t('iaoParticipatedAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
              </span>
              <span className="font-semibold text-[#F47521] break-all">
                {Number(poolInfo?.totalDeposited)?.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">{t('lpPoolData')}</h3>
            <div className="space-y-4">
              <div className="text-base flex flex-wrap items-center gap-2 bg-purple-50 p-3 rounded-lg">
                <span className="text-black whitespace-nowrap">
                  {t('lpPoolTokenAmount', { symbol: agent.symbol })}:
                </span>
                <span className="font-semibold text-[#F47521] break-all">
                  {(agent as any).targetTokenAmountLp?.toLocaleString() || 0}
                </span>
              </div>

              <div className="text-base flex flex-wrap items-center gap-2 bg-green-50 p-3 rounded-lg">
                <span className="text-black whitespace-nowrap">
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
              // ({/* 募资结束后，Claim按钮 */ }
              (isIAOEnded && isConnected) ? (
                <>
                  <Button
                    className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white"
                    onClick={async () => {
                      try {
                        const result: any = await claimRewards();
                        if (result?.success) {
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
                    {userStakeInfo.hasClaimed ? t('claimed') : t('claim')}
                  </Button>

                  {/* 募资结束后，投资数量统计个人信息 */}
                  {!!userStakeInfo.userDeposited && (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm text-muted-foreground">
                        {t('stakedAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
                        <span className="text-[#F47521] ml-1">
                          {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.userDeposited).toLocaleString()}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userStakeInfo.hasClaimed ? (
                          <>
                            {t('claimedAmount', { symbol: agent.symbol })}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.claimedAmount).toLocaleString()}</span>
                          </>
                        ) : (
                          <>
                            {t('claimableAmount', { symbol: agent.symbol })}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.claimableXAA).toLocaleString()}</span>
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </>
              ) : <></>}


        </>
      )
        :
        // 募资结束前，显示的池子数据

        <>
          {/* 募资进行中，显示的池子数据 */}
          <h2 className="text-2xl font-bold mb-6">{t('title')}</h2>

          <div className="space-y-4">
            <div className="text-base flex flex-wrap items-center gap-2 bg-orange-50 p-3 rounded-lg">
              <span className="text-black whitespace-nowrap">{t('totalInPool', { symbol: agent.symbol })}:</span>
              <span className="font-semibold text-[#F47521] break-all">
                {agent.totalSupply?.toLocaleString()} {agent.symbol}
              </span>
            </div>

            <div className="text-base flex flex-wrap items-center gap-2 bg-blue-50 p-3 rounded-lg">
              <span className="text-black whitespace-nowrap">{t('currentTotal', { symbol: agent.tokenAddress === 'XAA' ? 'DBC' : 'XAA' })}:</span>

              {
                poolInfo.startTime ? (<span className="font-semibold text-[#F47521] break-all">
                  {isPoolInfoLoading || !poolInfo?.totalDeposited == null ? "--" : Number(poolInfo.totalDeposited).toLocaleString()}
                </span>
                ) :
                  <span className="font-semibold text-[#F47521] break-all">
                    0
                  </span>
              }

            </div>

            <div className="text-base flex flex-wrap items-center gap-2 bg-purple-50 p-3 rounded-lg">
              <span className="text-black whitespace-nowrap">
                {poolInfo?.startTime && Date.now() < poolInfo.startTime * 1000
                  ? t('startCountdown')
                  : t('endCountdown')
                }:
              </span>
              {poolInfo?.startTime ? (
                isPoolInfoLoading ? (
                  <span className="font-semibold text-[#F47521] break-all">--</span>
                ) : Date.now() < poolInfo.startTime * 1000 ? (
                  // 显示距离开始的倒计时
                  <Countdown
                    remainingTime={Math.max(0, poolInfo.startTime * 1000 - Date.now())}
                    className="font-semibold text-[#F47521] break-all"
                  />
                ) : poolInfo?.endTime ? (
                  // 显示距离结束的倒计时
                  <Countdown
                    remainingTime={Math.max(0, poolInfo.endTime * 1000 - Date.now())}
                    className="font-semibold text-[#F47521] break-all"
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
              <div className="mt-0 pt-6 bg-muted rounded-lg">

                {(
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
                          max={agent.symbol === 'XAA' ? maxAmount : xaaBalance}
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
              </div>
            )
          }

          {/* 募资结束后，投资数量统计个人信息 */}
          {!!userStakeInfo.userDeposited && (
            <div className="space-y-2 mt-4">
              <p className="text-sm text-muted-foreground">
                {t('stakedAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
                <span className="text-[#F47521] ml-1">
                  {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.userDeposited).toLocaleString()}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {userStakeInfo.hasClaimed ? (
                  <>
                    {t('claimedAmount', { symbol: agent.symbol })}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.claimedAmount).toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    {t('claimableAmount', { symbol: agent.symbol })}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.claimableXAA).toLocaleString()}</span>
                  </>
                )}
              </p>
            </div>
          )}



          <p className="text-sm text-muted-foreground mt-2">
            {t('poolDynamicTip', { symbol: agent.symbol, investSymbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}
          </p>


        </>

      }
    </Card>
  );
}; 