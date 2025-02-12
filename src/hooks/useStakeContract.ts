import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { CONTRACTS, CURRENT_CONTRACT_ABI } from '@/config/contracts';
import { useToast } from '@/components/ui/use-toast';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAuth } from '@/hooks/useAuth';
import { createPublicClient, createWalletClient, custom, http, parseEther, type Hash } from 'viem';
import { useWalletClient } from 'wagmi';
import { currentChain } from '@/config/wagmi';
import * as React from 'react';
import { useTestNetwork } from '@/hooks/useTestNetwork';
import { useTranslations } from 'next-intl';
import { ensureCorrectNetwork, getTransactionUrl } from '@/config/networks';

type ToastMessage = {
  title: string;
  description: string | React.ReactNode;
  txHash?: Hash;
};

type UserStakeInfo = {
  userDeposited: string;
  claimableXAA: string;
  hasClaimed: boolean;
  claimedAmount: string;
};

const createToastMessage = (params: ToastMessage): ToastMessage => {
  const t = useTranslations('messages');
  return {
    title: params.title,
    description: params.txHash
      ? React.createElement('div', {
        className: "flex flex-col space-y-3 font-medium"
      },
        React.createElement('p', {
          className: "text-sm text-muted-foreground"
        }, params.description),
        React.createElement('div', {
          className: "flex items-center space-x-2"
        },
          React.createElement('div', {
            className: "w-2 h-2 bg-green-500 rounded-full animate-pulse"
          }),
          React.createElement('a', {
            href: getTransactionUrl(params.txHash),
            target: "_blank",
            rel: "noopener noreferrer",
            className: "text-sm font-semibold text-primary hover:text-primary/90 transition-colors"
          }, t('viewOnDBCScan'))
        )
      )
      : params.description,
  };
};

// 检查是否是测试网环境
const isTestnet = process.env.NEXT_PUBLIC_IS_TEST_ENV === "true";

export const useStakeContract = () => {
  const { address, isConnected } = useAppKitAccount();
  const { data: walletClient, isLoading: isWalletLoading } = useWalletClient();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isPoolInfoLoading, setIsPoolInfoLoading] = useState(false);
  const [isUserStakeInfoLoading, setIsUserStakeInfoLoading] = useState(false);
  const { ensureTestNetwork } = useTestNetwork();
  const t = useTranslations('iaoPool');

  // 添加备用的交易确认检查函数
  const checkTransactionConfirmation = async (hash: Hash): Promise<boolean> => {
    try {
      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(),
      });

      // 尝试获取交易
      const tx = await publicClient.getTransaction({ hash });
      if (!tx) return false;

      // 获取当前区块
      const currentBlock = await publicClient.getBlockNumber();

      // 如果交易的区块号存在，且已经有至少1个确认，就认为交易已确认
      if (tx.blockNumber && currentBlock - tx.blockNumber >= 1) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to check transaction confirmation:', error);
      return false;
    }
  };

  // 从区块链浏览器API获取交易状态
  const getTransactionStatusFromExplorer = async (hash: Hash): Promise<boolean> => {
    try {
      // 使用 dbcscan API
      const response = await fetch(`https://testnet.dbcscan.io/api/v2/transactions/${hash}`);
      if (!response.ok) return false;

      const data = await response.json();
      // 如果交易已经被确认（有区块号），返回true
      return data.result === 'success';
    } catch (error) {
      console.error('Failed to get transaction status from explorer:', error);
      return false;
    }
  };

  const [poolInfo, setPoolInfo] = useState({
    totalDeposited: '',
    startTime: 0,
    endTime: 0,
    userDeposited: '',
    hasClaimed: false,
  });

  // Fetch pool info
  const fetchPoolInfo = useCallback(async () => {
    try {
      setIsPoolInfoLoading(true);

      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(),
      });

      // 分开调用每个函数以便更好地处理错误
      let startTime, endTime, totalDeposited;

      try {
        startTime = await publicClient.readContract({
          address: CONTRACTS.IAO_CONTRACT,
          abi: CURRENT_CONTRACT_ABI,
          functionName: 'startTime',
        });
      } catch (error) {
        console.error('Failed to fetch startTime:', error);
        startTime = null;
      }

      try {
        endTime = await publicClient.readContract({
          address: CONTRACTS.IAO_CONTRACT,
          abi: CURRENT_CONTRACT_ABI,
          functionName: 'endTime',
        });
      } catch (error) {
        console.error('Failed to fetch endTime:', error);
        endTime = null;
      }


      try {
        totalDeposited = await publicClient.readContract({
          address: CONTRACTS.IAO_CONTRACT,
          abi: CURRENT_CONTRACT_ABI,
          functionName: 'totalDepositedDBC',
        });
      } catch (error) {
        console.error('Failed to fetch totalDeposited:', error);
        totalDeposited = null;
      }

      console.log("totalDeposited", totalDeposited);

      const newPoolInfo: any = {
        totalDeposited: totalDeposited ? ethers.formatEther(totalDeposited?.toString()) : '',
        startTime: startTime ? Number(startTime) : 0,
        endTime: endTime ? Number(endTime) : 0,
        userDeposited: '',
        hasClaimed: false,
      };

      console.log("newPoolInfo", newPoolInfo);

      // // 只有在钱包连接且认证的情况下才获取用户信息
      // if (walletClient && isConnected && isAuthenticated && address) {
      //   try {
      //     const [userDeposited, hasClaimed] = await Promise.all([
      //       publicClient.readContract({
      //         address: CONTRACTS.IAO_CONTRACT,
      //         abi: CURRENT_CONTRACT_ABI,
      //         functionName: 'userDeposits',
      //         args: [address as `0x${string}`],
      //       }),
      //       publicClient.readContract({
      //         address: CONTRACTS.IAO_CONTRACT,
      //         abi: CURRENT_CONTRACT_ABI,
      //         functionName: 'hasClaimed',
      //         args: [address as `0x${string}`],
      //       }),
      //     ]);
      //     newPoolInfo.userDeposited = userDeposited ? ethers.formatEther(userDeposited.toString()) : '';
      //     newPoolInfo.hasClaimed = hasClaimed;
      //   } catch (error) {
      //     console.error('Failed to fetch user info:', error);
      //     newPoolInfo.userDeposited = '';
      //     newPoolInfo.hasClaimed = false;
      //   }
      // }

      setPoolInfo(newPoolInfo);
    } catch (error) {
      console.error('Failed to fetch pool info:', error);
      setPoolInfo({
        totalDeposited: '',
        startTime: 0,
        endTime: 0,
        userDeposited: '',
        hasClaimed: false,
      });
    } finally {
      setIsPoolInfoLoading(false);
    }
  }, [walletClient, isConnected, isAuthenticated, address]);

  // Auto fetch pool info
  useEffect(() => {
    fetchPoolInfo();
  }, [fetchPoolInfo, address]);

  // Stake DBC
  const stake = async (amount: string) => {
    if (!walletClient || !isConnected || !address) {
      toast(createToastMessage({
        title: t('error'),
        description: t('connectWalletFirst'),
      } as ToastMessage));
      return null;
    }

    const isCorrectNetwork = await ensureTestNetwork();
    if (!isCorrectNetwork) return null;

    try {
      setIsLoading(true);
      console.log('Starting stake:', amount, 'DBC');

      const viemWalletClient = createWalletClient({
        chain: currentChain,
        transport: custom(walletClient.transport),
      });

      const publicClient = createPublicClient({
        chain: currentChain,
        transport: custom(walletClient.transport),
      });

      const amountWei = parseEther(amount);

      console.log('Sending transaction to contract:', CONTRACTS.IAO_CONTRACT);
      const hash = await viemWalletClient.sendTransaction({
        to: CONTRACTS.IAO_CONTRACT,
        value: amountWei,
        account: address as `0x${string}`,
      });

      setIsLoading(false);

      toast(createToastMessage({
        title: t('transactionSent'),
        description: t('waitForConfirmation'),
        txHash: hash,
      } as ToastMessage));

      console.log('Waiting for transaction confirmation:', hash);

      let receipt;
      try {
        receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: 10_000,
          pollingInterval: 1_000,
        });
      } catch (error) {
        console.log('RPC confirmation failed, checking explorer...');

        let confirmed = false;
        let attempts = 0;
        const maxAttempts = 30;

        while (!confirmed && attempts < maxAttempts) {
          confirmed = await getTransactionStatusFromExplorer(hash);
          if (confirmed) {
            console.log('Transaction confirmed via explorer');
            receipt = await publicClient.getTransactionReceipt({ hash });
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 3000));
          attempts++;
        }

        if (!confirmed) {
          throw new Error(t('transactionConfirmationTimeout'));
        }
      }

      toast(createToastMessage({
        title: t('success'),
        description: t('stakeSuccessWithAmount', { amount }),
        txHash: hash,
      } as ToastMessage));

      fetchPoolInfo();

      return { hash, receipt };

    } catch (error: any) {
      console.error('Stake failed:', error);
      if (error?.code === 4001) {
        throw error;
      }
      toast(createToastMessage({
        title: t('error'),
        description: error?.message || t('stakeFailed'),
      } as ToastMessage));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Claim rewards
  const claimRewards = async () => {
    if (!walletClient || !isConnected || !address) {
      toast(createToastMessage({
        title: t('error'),
        description: t('connectWalletFirst'),
      } as ToastMessage));
      return;
    }

    const isCorrectNetwork = await ensureTestNetwork();
    if (!isCorrectNetwork) return;

    try {
      setIsLoading(true);

      const viemWalletClient = createWalletClient({
        chain: currentChain,
        transport: custom(walletClient.transport),
      });

      const publicClient = createPublicClient({
        chain: currentChain,
        transport: custom(walletClient.transport),
      });

      const userStakeInfo = await getUserStakeInfo();
      const claimableAmount = userStakeInfo.claimableXAA;

      const { request } = await publicClient.simulateContract({
        address: CONTRACTS.IAO_CONTRACT,
        abi: CURRENT_CONTRACT_ABI,
        functionName: 'claimRewards',
        account: address as `0x${string}`,
      });

      const hash = await viemWalletClient.writeContract(request);

      toast(createToastMessage({
        title: t('success'),
        description: t('processing'),
        txHash: hash,
      } as ToastMessage));

      await publicClient.waitForTransactionReceipt({ hash });

      toast(createToastMessage({
        title: t('success'),
        description: t('claimSuccessWithAmount', { amount: claimableAmount }),
        txHash: hash,
      } as ToastMessage));

      return {
        success: true,
        amount: claimableAmount,
        hash
      };
    } catch (error: any) {
      console.error('Claim rewards failed:', error);
      toast(createToastMessage({
        title: t('error'),
        description: error?.message || t('stakeFailed'),
      } as ToastMessage));
      return {
        success: false,
        error: error?.message || t('stakeFailed')
      };
    } finally {
      setIsLoading(false);
    }
  };

  // 计算用户可领取的XAA数量
  const getUserStakeInfo = useCallback(async (): Promise<UserStakeInfo> => {
    if (!walletClient || !isConnected || !address) return {
      userDeposited: '0',
      claimableXAA: '0',
      hasClaimed: false,
      claimedAmount: '0'
    };

    try {
      setIsUserStakeInfoLoading(true);
      const publicClient = createPublicClient({
        chain: currentChain,
        transport: custom(walletClient.transport),
      });

      // 获取总质押量
      const totalDeposited = await publicClient.readContract({
        address: CONTRACTS.IAO_CONTRACT,
        abi: CURRENT_CONTRACT_ABI,
        functionName: 'totalDepositedDBC',
      });

      // 获取用户质押量
      const userDeposited = await publicClient.readContract({
        address: CONTRACTS.IAO_CONTRACT,
        abi: CURRENT_CONTRACT_ABI,
        functionName: 'userDeposits',
        args: [address as `0x${string}`],
      });

      // 获取用户是否已领取
      const hasClaimed = await publicClient.readContract({
        address: CONTRACTS.IAO_CONTRACT,
        abi: CURRENT_CONTRACT_ABI,
        functionName: 'hasClaimed',
        args: [address as `0x${string}`],
      });

      // 获取总奖励
      const totalReward = await publicClient.readContract({
        address: CONTRACTS.IAO_CONTRACT,
        abi: CURRENT_CONTRACT_ABI,
        functionName: isTestnet ? 'TOTAL_XAA_REWARD' : 'TOTAL_REWARD',
      });

      let claimableXAA = '0';
      let claimedAmount = '0';

      if (totalDeposited !== BigInt(0)) {
        // 计算用户应得的XAA数量：（用户投资数额/总投资量) * 总奖励
        const calculatedAmount = (userDeposited * totalReward) / totalDeposited;
        const formattedAmount = ethers.formatEther(calculatedAmount);

        if (hasClaimed) {
          claimedAmount = formattedAmount;
          claimableXAA = '0';
        } else {
          claimableXAA = formattedAmount;
          claimedAmount = '0';
        }
      }

      return {
        userDeposited: ethers.formatEther(userDeposited),
        claimableXAA,
        hasClaimed,
        claimedAmount
      };
    } catch (error) {
      console.error('Failed to get user stake info:', error);
      return {
        userDeposited: '0',
        claimableXAA: '0',
        hasClaimed: false,
        claimedAmount: '0'
      };
    } finally {
      setIsUserStakeInfoLoading(false);
    }
  }, [walletClient, isConnected, address]);

  return {
    poolInfo,
    isLoading,
    isPoolInfoLoading,
    isUserStakeInfoLoading,
    stake,
    claimRewards,
    fetchPoolInfo,
    getUserStakeInfo,
  };
}; 