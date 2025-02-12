import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { CONTRACTS, STAKE_CONTRACT_ABI } from '@/config/contracts';
import { useToast } from '@/components/ui/use-toast';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAuth } from '@/hooks/useAuth';
import { createPublicClient, createWalletClient, custom, http, parseEther, type Hash } from 'viem';
import { useWalletClient, useChainId, useSwitchChain } from 'wagmi';
import { dbcTestnet } from '@/config/wagmi';
import * as React from 'react';
import { useTestNetwork } from '@/hooks/useTestNetwork';
import { useTranslations } from 'next-intl';

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
              href: `https://test.dbcscan.io/tx/${params.txHash}`,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "text-sm font-semibold text-primary hover:text-primary/90 transition-colors"
            }, "View on DBCScan")
          )
        )
      : params.description,
  };
};

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
        chain: dbcTestnet,
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
        chain: dbcTestnet,
        transport: http(),
      });

      // 分开调用每个函数以便更好地处理错误
      let startTime, endTime, totalDeposited;

      try {
        startTime = await publicClient.readContract({
          address: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
          abi: STAKE_CONTRACT_ABI,
          functionName: 'startTime',
        });
      } catch (error) {
        console.error('Failed to fetch startTime:', error);
        startTime = null;
      }

      try {
        endTime = await publicClient.readContract({
          address: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
          abi: STAKE_CONTRACT_ABI,
          functionName: 'endTime',
        });
      } catch (error) {
        console.error('Failed to fetch endTime:', error);
        endTime = null;
      }

      try {
        totalDeposited = await publicClient.readContract({
          address: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
          abi: STAKE_CONTRACT_ABI,
          functionName: 'totalDepositedDBC',
        });
      } catch (error) {
        console.error('Failed to fetch totalDeposited:', error);
        totalDeposited = null;
      }

      const newPoolInfo: any = {
        totalDeposited: totalDeposited ? ethers.formatEther(totalDeposited?.toString()) : '',
        startTime: startTime ? Number(startTime) : 0,
        endTime: endTime ? Number(endTime) : 0,
        userDeposited: '',
        hasClaimed: false,
      };

      // 只有在钱包连接且认证的情况下才获取用户信息
      if (walletClient && isConnected && isAuthenticated && address) {
        try {
          const [userDeposited, hasClaimed] = await Promise.all([
            publicClient.readContract({
              address: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
              abi: STAKE_CONTRACT_ABI,
              functionName: 'userDeposits',
              args: [address as `0x${string}`],
            }),
            publicClient.readContract({
              address: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
              abi: STAKE_CONTRACT_ABI,
              functionName: 'hasClaimed',
              args: [address as `0x${string}`],
            }),
          ]);
          newPoolInfo.userDeposited = userDeposited ? ethers.formatEther(userDeposited.toString()) : '';
          newPoolInfo.hasClaimed = hasClaimed;
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          newPoolInfo.userDeposited = '';
          newPoolInfo.hasClaimed = false;
        }
      }

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
  }, [walletClient, address, isConnected, isAuthenticated]);

  // Auto fetch pool info
  useEffect(() => {
    // 只在 walletClient 加载完成后执行
    if (address) {
      console.log('Wallet loaded, fetching pool info');
      fetchPoolInfo();
    }
  }, [fetchPoolInfo, address]);

  // Stake DBC
  const stake = async (amount: string) => {
    if (!walletClient || !isConnected || !address) {
      toast(createToastMessage({
        title: "Error",
        description: "Please connect your wallet first",
      } as ToastMessage));
      return null;
    }

    const isCorrectNetwork = await ensureTestNetwork();
    if (!isCorrectNetwork) return null;

    try {
      setIsLoading(true);
      console.log('Starting stake:', amount, 'DBC');

      const viemWalletClient = createWalletClient({
        chain: dbcTestnet,
        transport: custom(walletClient.transport),
      });

      const publicClient = createPublicClient({
        chain: dbcTestnet,
        transport: custom(walletClient.transport),
      });

      // // Check balance
      // const balance = await publicClient.getBalance({ 
      //   address: address as `0x${string}` 
      // });
      const amountWei = parseEther(amount);
      
      // if (balance < amountWei) {
      //   throw new Error('Insufficient balance');
      // }

      console.log('Sending transaction to contract:', CONTRACTS.STAKE_CONTRACT);
      const hash = await viemWalletClient.sendTransaction({
        to: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
        value: amountWei,
        account: address as `0x${string}`,
      });

      // 发送交易后立即设置loading为false
      setIsLoading(false);

      toast(createToastMessage({
        title: "Transaction Sent",
        description: "Please wait for confirmation",
        txHash: hash,
      } as ToastMessage));

      console.log('Waiting for transaction confirmation:', hash);
      
      let receipt;
      try {
        // 首先尝试使用RPC节点等待确认
        receipt = await publicClient.waitForTransactionReceipt({ 
          hash,
          timeout: 10_000, // 先等10秒
          pollingInterval: 1_000,
        });
      } catch (error) {
        console.log('RPC confirmation failed, checking explorer...');
        
        // 如果RPC确认失败，使用区块链浏览器API检查
        let confirmed = false;
        let attempts = 0;
        const maxAttempts = 30;

        while (!confirmed && attempts < maxAttempts) {
          confirmed = await getTransactionStatusFromExplorer(hash);
          if (confirmed) {
            console.log('Transaction confirmed via explorer');
            // 交易确认后，再次尝试获取receipt
            receipt = await publicClient.getTransactionReceipt({ hash });
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 3000));
          attempts++;
        }

        if (!confirmed) {
          throw new Error('Transaction confirmation timeout');
        }
      }

      toast(createToastMessage({
        title: "Success",
        description: `Successfully staked ${amount} DBC`,
        txHash: hash,
      } as ToastMessage));

      await getUserStakeInfo();

      return { hash, receipt };

      // // 在后台继续监听交易
      // publicClient.waitForTransactionReceipt({ hash })
      //   .then(async () => {
      //     toast(createToastMessage({
      //       title: "Success",
      //       description: `Successfully staked ${amount} DBC`,
      //       txHash: hash,
      //     } as ToastMessage));
          
      //     // 刷新pool信息
      //     await fetchPoolInfo();
      //   })
      //   .catch(error => {
      //     console.error('Transaction failed:', error);
      //     toast(createToastMessage({
      //       title: "Warning",
      //       description: "Transaction may have failed. Please check your wallet for status.",
      //     } as ToastMessage));
      //   });

      // return { hash };
    } catch (error: any) {
      console.error('Stake failed:', error);
      if (error?.code === 4001) {
        throw error;
      }
      toast(createToastMessage({
        title: "Error",
        description: error?.message || "Failed to stake",
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

    // 添加网络检查
    const isCorrectNetwork = await ensureTestNetwork();
    if (!isCorrectNetwork) return;

    try {
      setIsLoading(true);
      
      const viemWalletClient = createWalletClient({
        chain: dbcTestnet,
        transport: custom(walletClient.transport),
      });

      const publicClient = createPublicClient({
        chain: dbcTestnet,
        transport: custom(walletClient.transport),
      });

      // 在领取之前获取用户可领取的数量
      const userStakeInfo = await getUserStakeInfo();
      const claimableAmount = userStakeInfo.claimableXAA;

      const { request } = await publicClient.simulateContract({
        address: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
        abi: STAKE_CONTRACT_ABI,
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
        chain: dbcTestnet,
        transport: custom(walletClient.transport),
      });

      // 获取总质押量
      const totalDeposited = await publicClient.readContract({
        address: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
        abi: STAKE_CONTRACT_ABI,
        functionName: 'totalDepositedDBC',
      });

      // 获取用户质押量
      const userDeposited = await publicClient.readContract({
        address: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
        abi: STAKE_CONTRACT_ABI,
        functionName: 'userDeposits',
        args: [address as `0x${string}`],
      });

      // 获取用户是否已领取
      const hasClaimed = await publicClient.readContract({
        address: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
        abi: STAKE_CONTRACT_ABI,
        functionName: 'hasClaimed',
        args: [address as `0x${string}`],
      });

      // 获取总奖励
      const totalReward = await publicClient.readContract({
        address: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
        abi: STAKE_CONTRACT_ABI,
        functionName: 'TOTAL_XAA_REWARD',
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