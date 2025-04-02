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
};

export const IaoPool = ({ agent }: { agent: LocalAgent }) => {
  // Check if required contract addresses exist
  const iaoContractAddress = agent?.iaoContractAddress || '';
  const tokenAddress = agent?.tokenAddress || '';

  const [dbcAmount, setDbcAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState<string>("0");
  const [xaaBalance, setXaaBalance] = useState<string>("0");
  const [userStakeInfo, setUserStakeInfo] = useState<UserStakeInfo>({
    userDeposited: "0",
    claimableXAA: "0",
    hasClaimed: false,
    claimedAmount: "0",
    originDeposit: "0",
    depositIncrByNFT: "0",
    incrByNFTTier: "0",
    rewardForOrigin: "0",
    rewardForNFT: "0"
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
      const result = await stake(formattedAmount, agent.symbol, agent.tokenAddress);
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

  const now = Date.now();
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
        // Pool data after IAO ends
        <>
          <h2 className="text-xl font-bold mb-6">IAO has ended, completed data:</h2>

          <div className="space-y-4">
            <div className="text-base flex flex-wrap items-center gap-2 bg-orange-50 p-3 rounded-lg">
              <span className="text-black whitespace-nowrap">
                {t('iaoReleasedAmount', { symbol: agent.symbol })}:
              </span>
              <span className="font-semibold text-[#F47521] break-all">
                {Number(poolInfo.totalReward)?.toLocaleString()}
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
              // ({/* Claim button after IAO ends */ }
              (isIAOEnded && isConnected) ? (
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
                    <div className="space-y-2 mt-4">
                      {/* 用户投资统计 */}
                      <p className="text-sm text-muted-foreground">
                        {t('stakedAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
                        <span className="text-[#F47521] ml-1">
                          {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.userDeposited).toLocaleString()}
                        </span>
                      </p>


                      {/* 可领取/已领取奖励 */}
                      {userStakeInfo.hasClaimed ? (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {t('claimedAmount', { symbol: agent.symbol })}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.claimedAmount).toLocaleString()}</span>
                          </p>
                          <div className="pl-4">
                            <p className="text-sm text-muted-foreground">
                              {t('baseClaimableAmount')}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : (Number(userStakeInfo.claimedAmount) - Number(userStakeInfo.incrByNFTTier)).toLocaleString()}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t('nftBoostClaimableAmount')}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.incrByNFTTier).toLocaleString()}</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {t('claimableAmount', { symbol: agent.symbol })}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.claimableXAA).toLocaleString()}</span>
                          </p>
                          <div className="pl-4">
                            <p className="text-sm text-muted-foreground">
                              {t('baseClaimableAmount')}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : (Number(userStakeInfo.claimableXAA) - Number(userStakeInfo.incrByNFTTier)).toLocaleString()}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t('nftBoostClaimableAmount')}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.incrByNFTTier).toLocaleString()}</span>
                            </p>
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
          <h2 className="text-2xl font-bold mb-6">{t('title')}</h2>

          <div className="space-y-4">
            <div className="text-base flex flex-wrap items-center gap-2 bg-orange-50 p-3 rounded-lg">
              <span className="text-black whitespace-nowrap">{t('totalInPool', { symbol: agent.symbol })}:</span>
              <span className="font-semibold text-[#F47521] break-all">
                {isPoolInfoLoading ? "--" : Number(poolInfo.totalReward).toLocaleString()} {agent.symbol}
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
                  // Show countdown to start
                  <Countdown
                    remainingTime={Math.max(0, poolInfo.startTime * 1000 - Date.now())}
                    className="font-semibold text-[#F47521] break-all"
                  />
                ) : poolInfo?.endTime ? (
                  // Show countdown to end
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
              {/* 用户投资统计 */}
              <p className="text-sm text-muted-foreground">
                {t('stakedAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
                <span className="text-[#F47521] ml-1">
                  {isUserStakeInfoLoading ? "--" : Number(userStakeInfo.userDeposited).toLocaleString()}
                </span>
              </p>

              {/* 可领取/已领取奖励 */}
              {userStakeInfo.hasClaimed ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t('claimedAmount', { symbol: agent.symbol })}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.claimedAmount).toLocaleString()}</span>
                  </p>
                  <div className="pl-4">
                    <p className="text-sm text-muted-foreground">
                      {t('baseClaimableAmount')}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : (Number(userStakeInfo.rewardForOrigin)).toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('nftBoostClaimableAmount')}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.rewardForNFT).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t('claimableAmount', { symbol: agent.symbol })}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.claimableXAA).toLocaleString()}</span>
                  </p>
                  <div className="pl-4">
                    <p className="text-sm text-muted-foreground">
                      {t('baseClaimableAmount')}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : (Number(userStakeInfo.rewardForOrigin)).toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('nftBoostClaimableAmount')}: <span className="text-[#F47521] ml-1">{isUserStakeInfoLoading ? "--" : Number(userStakeInfo.rewardForNFT).toLocaleString()}</span>
                    </p>
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
    </Card>
  );
}; 