import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { getContractABI } from '@/config/contracts';
import { useToast } from '@/components/ui/use-toast';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAuth } from '@/hooks/useAuth';
import { createPublicClient, createWalletClient, custom, http, parseEther, parseGwei, type Hash } from 'viem';
import { useWalletClient } from 'wagmi';
import { currentChain } from '@/config/wagmi';
import * as React from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import { useTranslations } from 'next-intl';
import { getTransactionUrl } from '@/config/networks';
import { getExplorerUrl } from '@/config/networks';

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

// 检查是否是测试网环境
const isTestnet = process.env.NEXT_PUBLIC_IS_TEST_ENV === "true";

// 在文件开头添加工具函数
const ensureAddressFormat = (address: string | undefined): `0x${string}` => {
  if (!address) throw new Error('Address is required');

  // 如果地址不是以 0x 开头，添加 0x 前缀
  const formattedAddress = address.startsWith('0x') ? address : `0x${address}`;

  // 确保地址长度正确（42 = 0x + 40个字符）
  if (formattedAddress.length !== 42) {
    console.warn('Potentially invalid address length:', formattedAddress);
  }

  return formattedAddress as `0x${string}`;
};

export const useStakeContract = (tokenAddress: `0x${string}`, iaoContractAddress: `0x${string}`, symbol: string = 'XAA') => {
  // 验证合约地址
  if (!iaoContractAddress || iaoContractAddress === '0x' || iaoContractAddress.length !== 42) {
    console.error('Invalid IAO contract address:', iaoContractAddress);
    return {
      poolInfo: {
        totalDeposited: '',
        startTime: 0,
        endTime: 0,
        userDeposited: '',
        hasClaimed: false,
      },
      isLoading: false,
      isPoolInfoLoading: false,
      isUserStakeInfoLoading: false,
      stake: async () => null,
      claimRewards: async () => ({ success: false, error: 'Invalid contract address' }),
      fetchPoolInfo: async () => { },
      getUserStakeInfo: async () => ({
        userDeposited: '0',
        claimableXAA: '0',
        hasClaimed: false,
        claimedAmount: '0'
      }),
    };
  }

  const { address, isConnected } = useAppKitAccount();
  const { data: walletClient, isLoading: isWalletLoading } = useWalletClient();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isPoolInfoLoading, setIsPoolInfoLoading] = useState(false);
  const [isUserStakeInfoLoading, setIsUserStakeInfoLoading] = useState(false);
  const { ensureCorrectNetwork } = useNetwork();
  const t = useTranslations('iaoPool');
  const tMessages = useTranslations('messages');

  const totalDepositedFunctionName = symbol === 'XAA' ? 'totalDepositedDBC' : 'totalDepositedTokenIn';
  const getTotalRewardNumberFunctionName = () => {
    return symbol === 'XAA' ?
      isTestnet ? 'TOTAL_XAA_REWARD' : 'TOTAL_REWARD' :
      isTestnet ? 'totalReward' : 'totalReward';
  }

  const createToastMessage = useCallback((params: ToastMessage): ToastMessage => {
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
            }, tMessages('viewOnDBCScan'))
          )
        )
        : params.description,
    };
  }, [tMessages]);

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
      // 根据当前网络环境获取正确的 API URL
      const explorerApiUrl = `${getExplorerUrl()}/api/v2/transactions/${hash}`;
      const response = await fetch(explorerApiUrl);

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

      // 验证合约地址
      if (!iaoContractAddress || iaoContractAddress === '0x' || iaoContractAddress.length !== 42) {
        console.error('Invalid contract address in fetchPoolInfo');
        return;
      }

      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(),
      });

      // 获取当前代币的 ABI
      const contractABI = getContractABI(symbol);

      // 分开调用每个函数以便更好地处理错误
      let startTime, endTime, totalDeposited;

      try {
        startTime = await publicClient.readContract({
          address: iaoContractAddress,
          abi: contractABI,
          functionName: 'startTime',
        });
      } catch (error) {
        console.error('Failed to fetch startTime:', error);
        startTime = null;
      }

      try {
        endTime = await publicClient.readContract({
          address: iaoContractAddress,
          abi: contractABI,
          functionName: 'endTime',
        });
      } catch (error) {
        console.error('Failed to fetch endTime:', error);
        endTime = null;
      }

      try {
        totalDeposited = await publicClient.readContract({
          address: iaoContractAddress,
          abi: contractABI,
          functionName: totalDepositedFunctionName,
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
  }, [iaoContractAddress, symbol]);

  // Auto fetch pool info
  useEffect(() => {
    fetchPoolInfo();
  }, [fetchPoolInfo, address]);

  // Stake DBC
  const stake = async (amount: string, agentSymbol: string = 'XAA', agentTokenAddress: string = '') => {
    // 投资DBC
    if (agentSymbol === 'XAA') {

      if (!walletClient || !isConnected || !address) {
        toast(createToastMessage({
          title: t('error'),
          description: t('connectWalletFirst'),
        } as ToastMessage));
        return null;
      }

      // 确保网络正确
      try {
        const isCorrectNetwork = await ensureCorrectNetwork();
        if (!isCorrectNetwork) return null;
      } catch (error: any) {
        toast(createToastMessage({
          title: t('error'),
          description: error.message,
        } as ToastMessage));
        return null;
      }

      try {
        setIsLoading(true);
        console.log('Starting stake:', amount, 'DBC');

        // 确保地址格式正确
        const formattedAddress = ensureAddressFormat(address);
        console.log('Original address:', address);
        console.log('Formatted address:', formattedAddress);

        const viemWalletClient = createWalletClient({
          chain: currentChain,
          transport: custom(walletClient.transport),
        });

        const publicClient = createPublicClient({
          chain: currentChain,
          transport: custom(walletClient.transport),
        });

        const amountWei = parseEther(amount);

        // 估算gas
        const estimatedGas = await publicClient.estimateGas({
          account: formattedAddress,
          to: iaoContractAddress,
          value: amountWei
        });

        // 增加10% gas limit作为安全缓冲
        const gasWithBuffer = estimatedGas * BigInt(110) / BigInt(100);

        console.log('Sending transaction to contract:', {
          to: iaoContractAddress,
          value: amountWei,
          account: formattedAddress,
        });

        // 发送交易
        const hash = await viemWalletClient.sendTransaction({
          account: formattedAddress,
          to: iaoContractAddress,
          value: amountWei,
          gas: gasWithBuffer
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
        toast(createToastMessage({
          title: t('error'),
          description: error?.message || t('stakeFailed'),
        }));
        throw error;
      } finally {
        setIsLoading(false);
      }
    }

    // 投资XAA
    else {
      const handleStakeXAA = async () => {
        try {
          if (!walletClient || !isConnected || !address) {
            toast(createToastMessage({
              title: t('error'),
              description: t('connectWalletFirst'),
            } as ToastMessage));
            return;
          }


          console.log("agentTokenAddress", agentTokenAddress);



          // 创建publicClient
          const publicClient = createPublicClient({
            chain: currentChain,
            transport: custom(walletClient.transport),
          });

          console.log("publicClient", publicClient);

          // XAA代币合约地址
          const xaaAddress = '0xC21155334688E2c1Cf89D4aB09d38D30002717DD'
          // IAO合约地址
          const iaoAddress = '0xcc6c5b583dd03a900dbf850449d50cec8833273f'

          // 测试数据：投资1000 XAA
          const amount = BigInt(1000 * 10 ** 18) // 假设XAA有18位小数

          // 1. 先approve XAA给IAO合约
          const approveHash = await walletClient.writeContract({
            address: xaaAddress,
            abi: [
              {
                name: 'approve',
                type: 'function',
                inputs: [
                  { name: 'spender', type: 'address' },
                  { name: 'amount', type: 'uint256' }
                ],
                outputs: [{ type: 'bool' }],
                stateMutability: 'nonpayable'
              }
            ],
            functionName: 'approve',
            args: [iaoAddress, amount]
          })

          console.log("approveHash", approveHash);

          toast(createToastMessage({
            title: t('transactionSent'),
            description: t('waitForConfirmation'),
            txHash: approveHash,
          } as ToastMessage));

          // 等待approve交易确认
          await publicClient.waitForTransactionReceipt({
            hash: approveHash
          })

          // 2. 调用IAO合约的deposit方法
          const depositHash = await walletClient.writeContract({
            address: iaoAddress,
            abi: [
              {
                name: 'deposit',
                type: 'function',
                inputs: [{ name: 'amount', type: 'uint256' }],
                outputs: [],
                stateMutability: 'nonpayable'
              }
            ],
            functionName: 'deposit',
            args: [amount]
          })

          toast(createToastMessage({
            title: t('transactionSent'),
            description: t('waitForConfirmation'),
            txHash: depositHash,
          } as ToastMessage));

          // 等待deposit交易确认
          await publicClient.waitForTransactionReceipt({
            hash: depositHash
          })

          toast(createToastMessage({
            title: t('success'),
            description: t('stakeSuccessWithAmount', { amount: '1000' }),
            txHash: depositHash,
          } as ToastMessage));

          fetchPoolInfo();
        } catch (error: any) {
          console.error('投资失败:', error)
          toast(createToastMessage({
            title: t('error'),
            description: error?.message || t('stakeFailed'),
          } as ToastMessage));
        }
      }

      handleStakeXAA()
    }
  }

  // Claim rewards
  const claimRewards = async () => {
    if (!walletClient || !isConnected || !address) {
      toast(createToastMessage({
        title: t('error'),
        description: t('connectWalletFirst'),
      } as ToastMessage));
      return;
    }

    // 确保网络正确
    try {
      const isCorrectNetwork = await ensureCorrectNetwork();
      if (!isCorrectNetwork) return null;
    } catch (error: any) {
      toast(createToastMessage({
        title: t('error'),
        description: error.message,
      } as ToastMessage));
      return null;
    }

    try {
      setIsLoading(true);

      // 确保地址格式正确
      const formattedAddress = ensureAddressFormat(address);

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
        address: iaoContractAddress,
        abi: getContractABI(symbol),
        functionName: 'claimRewards',
        account: formattedAddress,
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
      }));
      return {
        success: false,
        error: error?.message || t('stakeFailed')
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Get user stake info
  const getUserStakeInfo = useCallback(async (): Promise<UserStakeInfo> => {
    if (!walletClient || !isConnected || !address) return {
      userDeposited: '0',
      claimableXAA: '0',
      hasClaimed: false,
      claimedAmount: '0'
    };

    try {
      setIsUserStakeInfoLoading(true);

      // 确保地址格式正确
      const formattedAddress = ensureAddressFormat(address);
      console.log('Getting stake info for address:', formattedAddress);

      const publicClient = createPublicClient({
        chain: currentChain,
        transport: custom(walletClient.transport),
      });

      // Get total staked amount
      const contractABI = getContractABI(symbol);
      const totalDeposited = await publicClient.readContract({
        address: iaoContractAddress,
        abi: contractABI,
        functionName: totalDepositedFunctionName,
      });

      // Get user staked amount
      const userDeposited = await publicClient.readContract({
        address: iaoContractAddress,
        abi: contractABI,
        functionName: 'userDeposits',
        args: [formattedAddress],
      });

      // Get if user has claimed
      const hasClaimed = await publicClient.readContract({
        address: iaoContractAddress,
        abi: contractABI,
        functionName: 'hasClaimed',
        args: [formattedAddress],
      });

      // Get total rewards
      const totalReward = await publicClient.readContract({
        address: iaoContractAddress,
        abi: contractABI,
        functionName: getTotalRewardNumberFunctionName()
      });

      let claimableXAA = '0';
      let claimedAmount = '0';

      if (totalDeposited !== BigInt(0)) {
        // Calculate user's XAA amount: (user investment / total investment) * total rewards
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
  }, [walletClient, isConnected, address, iaoContractAddress, symbol]);

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