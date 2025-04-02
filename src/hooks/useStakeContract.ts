import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { CONTRACTS, getContractABI } from '@/config/contracts';
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
    return {
      poolInfo: {
        totalDeposited: '',
        startTime: 0,
        endTime: 0,
        userDeposited: '',
        hasClaimed: false,
        totalReward: ''
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
        claimedAmount: '0',
        originDeposit: '0',
        depositIncrByNFT: '0',
        incrByNFTTier: '0',
        rewardForOrigin: '0',
        rewardForNFT: '0'
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
  const claimRewardsFunctionName = symbol === 'XAA' ? 'claimRewards' : 'claimRewards';

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
    totalReward: ''
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

      // 获取 totalReward
      let totalReward;
      try {
        totalReward = await publicClient.readContract({
          address: iaoContractAddress,
          abi: contractABI,
          functionName: getTotalRewardNumberFunctionName(),
        });
      } catch (error) {
        console.error('Failed to fetch totalReward:', error);
        totalReward = null;
      }

      const newPoolInfo: any = {
        totalDeposited: totalDeposited ? ethers.formatEther(totalDeposited?.toString()) : '',
        startTime: startTime ? Number(startTime) : 0,
        endTime: endTime ? Number(endTime) : 0,
        userDeposited: '',
        hasClaimed: false,
        totalReward: totalReward ? ethers.formatEther(totalReward?.toString()) : ''
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
        totalReward: ''
      });
    } finally {
      setIsPoolInfoLoading(false);
    }
  }, [iaoContractAddress, symbol]);

  // Auto fetch pool info
  useEffect(() => {
    fetchPoolInfo();
  }, [fetchPoolInfo, address]);

  // 共用的交易确认和等待逻辑
  const waitForTransactionConfirmation = async (hash: Hash, publicClient: any) => {
    let receipt;
    try {
      receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 10_000,
        pollingInterval: 1_000,
      });
    } catch (error) {
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!confirmed && attempts < maxAttempts) {
        confirmed = await getTransactionStatusFromExplorer(hash);
        if (confirmed) {
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
    return receipt;
  };

  // 共用的前置检查
  const performPreChecks = async () => {
    if (!walletClient || !isConnected || !address) {
      toast(createToastMessage({
        title: t('error'),
        description: t('connectWalletFirst'),
      } as ToastMessage));
      return false;
    }

    try {
      const isCorrectNetwork = await ensureCorrectNetwork();
      if (!isCorrectNetwork) return false;
    } catch (error: any) {
      toast(createToastMessage({
        title: t('error'),
        description: error.message,
      } as ToastMessage));
      return false;
    }

    return true;
  };

  // 处理 DBC 质押
  const handleStakeDBC = async (amount: string, formattedAddress: `0x${string}`) => {
    if (!walletClient) throw new Error('Wallet client not found');
    
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

    // 发送交易
    const hash = await viemWalletClient.sendTransaction({
      account: formattedAddress,
      to: iaoContractAddress,
      value: amountWei,
      gas: gasWithBuffer
    });

    toast(createToastMessage({
      title: t('transactionSent'),
      description: t('waitForConfirmation'),
      txHash: hash,
    } as ToastMessage));

    const receipt = await waitForTransactionConfirmation(hash, publicClient);

    toast(createToastMessage({
      title: t('success'),
      description: t('stakeSuccessWithAmount', { amount }),
      txHash: hash,
    } as ToastMessage));

    return { hash, receipt };
  };

  // 处理 XAA 质押
  const handleStakeXAA = async (amount: string, formattedAddress: `0x${string}`) => {
    if (!walletClient) throw new Error('Wallet client not found');
    
    const publicClient = createPublicClient({
      chain: currentChain,
      transport: custom(walletClient.transport),
    });

    const amountWei = parseEther(amount);

    const xaaABI = [
      {
        name: 'allowance',
        type: 'function',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' }
        ],
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view'
      },
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
    ] as const;

    const XAA_TOKEN_Address = CONTRACTS.XAA_TOKEN;

    const currentAllowance = await publicClient.readContract({
      address: XAA_TOKEN_Address,
      abi: xaaABI,
      functionName: 'allowance',
      args: [formattedAddress, iaoContractAddress]
    });

    if (currentAllowance < amountWei) {
      const reasonableAmount = amountWei;
      const approveHash = await walletClient.writeContract({
        address: XAA_TOKEN_Address,
        abi: xaaABI,
        functionName: 'approve',
        args: [iaoContractAddress, reasonableAmount]
      });

      toast(createToastMessage({
        title: t('approveTransaction'),
        description: t('approveWaitingConfirm'),
        txHash: approveHash,
      } as ToastMessage));

      try {
        await waitForTransactionConfirmation(approveHash, publicClient);
        toast(createToastMessage({
          title: t('success'),
          description: t('approveSuccess'),
          txHash: approveHash,
        } as ToastMessage));
      } catch (error) {
        toast(createToastMessage({
          title: t('error'),
          description: t('approveFailed'),
          txHash: approveHash,
        } as ToastMessage));
        throw error;
      }
    }

    // 2. Deposit XAA
    const depositHash = await walletClient.writeContract({
      address: iaoContractAddress,
      abi: getContractABI(symbol),
      functionName: 'deposit',
      args: [amountWei]
    });

    toast(createToastMessage({
      title: t('transactionSent'),
      description: t('waitForConfirmation'),
      txHash: depositHash,
    } as ToastMessage));

    const receipt = await waitForTransactionConfirmation(depositHash, publicClient);

    toast(createToastMessage({
      title: t('success'),
      description: t('stakeSuccessWithAmount', { amount }),
      txHash: depositHash,
    } as ToastMessage));

    return { hash: depositHash, receipt };
  };

  // 主 stake 函数
  const stake = async (amount: string, agentSymbol: string = 'XAA', agentTokenAddress: string = '') => {
    try {
      setIsLoading(true);
      
      // 前置检查
      const preCheckPassed = await performPreChecks();
      if (!preCheckPassed) return null;

      // 确保地址格式正确
      const formattedAddress = ensureAddressFormat(address!);
      console.log('Starting stake:', amount, agentSymbol);

      let result;
      if (agentSymbol === 'XAA') {
        result = await handleStakeDBC(amount, formattedAddress);
      } else {
        result = await handleStakeXAA(amount, formattedAddress);
      }

      fetchPoolInfo();
      return result;

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
        functionName: claimRewardsFunctionName as any,
        account: formattedAddress,
      });

      const hash = await viemWalletClient.writeContract(request as any);

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
      claimedAmount: '0',
      originDeposit: '0',
      depositIncrByNFT: '0',
      incrByNFTTier: '0',
      rewardForOrigin: '0',
      rewardForNFT: '0'
    };

    try {
      setIsUserStakeInfoLoading(true);

      const formattedAddress = ensureAddressFormat(address);

      const publicClient = createPublicClient({
        chain: currentChain,
        transport: custom(walletClient.transport),
      });

      const contractABI = getContractABI(symbol);
      
      // 1. 获取用户实际质押量
      const userDeposited = await publicClient.readContract({
        address: iaoContractAddress,
        abi: contractABI,
        functionName: 'userDeposits',
        args: [formattedAddress],
      });

      // 2. 获取总质押量
      const totalDeposited = await publicClient.readContract({
        address: iaoContractAddress,
        abi: contractABI,
        functionName: totalDepositedFunctionName,
      });

      // 3. 获取用户的NFT增加信息
      const incrInfo = await publicClient.readContract({
        address: iaoContractAddress,
        abi: contractABI,
        functionName: 'getIncrInfo',
        args: [formattedAddress]
      });

      // 4. 获取用户是否已领取
      const hasClaimed = await publicClient.readContract({
        address: iaoContractAddress,
        abi: contractABI,
        functionName: 'hasClaimed',
        args: [formattedAddress],
      });

      // 5. 获取总奖励
      const totalReward = await publicClient.readContract({
        address: iaoContractAddress,
        abi: contractABI,
        functionName: getTotalRewardNumberFunctionName()
      });
      
      // 用户应该获取的总奖励。getReward
      const userReward = await publicClient.readContract({
        address: iaoContractAddress,
        abi: contractABI,
        functionName: 'getReward',
        args: [formattedAddress]
      });

      // 6. 计算可领取奖励
      let claimableXAA = '0';
      let claimedAmount = '0';

      // 使用 NFT 增加后的总量计算奖励
      const originDeposit = Number(ethers.formatEther(incrInfo[0]))   // 原始质押量
      const depositIncrByNFT = Number(ethers.formatEther(incrInfo[1]))// NFT增加量

      if (totalDeposited !== BigInt(0)) {
        if (hasClaimed) {
          claimedAmount = userReward.toString();
          claimableXAA = '0';
        } else {
          claimableXAA = userReward.toString();
          claimedAmount = '0';
        }
      }

      console.log('originDeposit', originDeposit);
      console.log('depositIncrByNFT', depositIncrByNFT);
      console.log('userReward', userReward);
      
      // 添加详细的调试日志
      const formattedUserReward = Number(ethers.formatEther(userReward));
      console.log('userReward formatted:', formattedUserReward);
      
      // 添加安全的计算逻辑
      let rewardForOrigin = '0';
      let rewardForNFT = '0';
      
      // 如果总质押量为0，则奖励也为0
      if (formattedUserReward > 0) {
        if (depositIncrByNFT > 0) {
          // 如果有NFT增加量，按比例分配奖励
          const ratio = originDeposit / depositIncrByNFT;
          rewardForOrigin = (ratio * formattedUserReward).toFixed(4);
          rewardForNFT = ((1 - ratio) * formattedUserReward).toFixed(4);
        } else if (originDeposit > 0) {
          // 如果只有原始质押，没有NFT增加量，所有奖励都归属于原始质押
          rewardForOrigin = formattedUserReward.toFixed(4);
          rewardForNFT = '0';
        }
        // 如果都是0，保持默认的0值
      }

      return {
        userDeposited: Number(ethers.formatEther(userDeposited)).toFixed(4),  // 实际质押量
        claimableXAA: Number(ethers.formatEther(BigInt(claimableXAA))).toFixed(4),  // 可领取奖励
        hasClaimed,                                        // 是否已领取
        claimedAmount: Number(ethers.formatEther(BigInt(claimedAmount))).toFixed(4),  // 已领取数量
        originDeposit: originDeposit.toFixed(4),    // 原始质押量
        depositIncrByNFT: depositIncrByNFT.toFixed(4), // NFT增加量
        rewardForOrigin,  // 原始质押的奖励
        rewardForNFT,    // NFT增加的奖励
        incrByNFTTier: Number(incrInfo[2]).toString()             // NFT等级
      };
    } catch (error) {
      return {
        userDeposited: '0',
        claimableXAA: '0',
        hasClaimed: false,
        claimedAmount: '0',
        originDeposit: '0',
        depositIncrByNFT: '0',
        incrByNFTTier: '0',
        rewardForOrigin: '0',
        rewardForNFT: '0'
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