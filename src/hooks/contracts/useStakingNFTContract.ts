import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useWalletClient } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import { createPublicClient, createWalletClient, custom, http, type Hash, parseEther,   } from 'viem';
import { currentChain } from '@/config/wagmi';
import { useNetwork } from '@/hooks/useNetwork';
import { getTransactionUrl } from '@/config/networks';
import * as React from 'react';
import stakingNFTABI from "@/config/abis/staking-nft.json"
import NFTABI from "@/config/abis/nft.json"
import { useTranslations } from 'next-intl';

type ToastMessage = {
  title: string;
  description: string | React.ReactNode;
  txHash?: Hash;
};

const nftContractAddress: `0x${string}` = process.env.NEXT_PUBLIC_NFT_ADDRESS as `0x${string}`;
const stakeContractAddress: `0x${string}` = process.env.NEXT_PUBLIC_STAKE_ADDRESS as `0x${string}`;
    
const publicClient = createPublicClient({
  chain: currentChain,
  transport: http()
});



interface StakeInfo {
  id: number;
  count: number;
  stakeStartTime: Date;
  stakeEndTime: Date;
  receivedReward: number;
}

export const useStakingNFTContract = () => {
  const t = useTranslations('nft');
  const { address, isConnected } = useAppKitAccount();
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();
  const { ensureCorrectNetwork } = useNetwork();
  const [isLoading, setIsLoading] = useState(false);
  const [totalStakedValue, setTotalStakedValue] = useState(0);

  // 计算 NFT 价格
  const getNFTPriceById = (id: number) => {
    switch (id) {
      case 1:
        return 99;
      case 2:
        return 199;
      case 3:
        return 299;
      default:
        return 0;
    }
  };

  // 计算总质押价值
  const calculateTotalStakedValue = (stakes: StakeInfo[]) => {
    return stakes.reduce((total, stake) => {
      const price = getNFTPriceById(stake.id);
      return total + (price * stake.count);
    }, 0);
  };

  // 创建 toast 消息
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
            }, t('viewOnExplorer'))
          )
        )
        : params.description,
    };
  }, [t]);

  // 前置检查
  const performPreChecks = async () => {
    if (!walletClient || !isConnected || !address) {
      toast(createToastMessage({
        title: t('error'),
        description: t('connectWallet'),
      }));
      return false;
    }

    try {
      const isCorrectNetwork = await ensureCorrectNetwork();
      if (!isCorrectNetwork) return false;
    } catch {
      toast(createToastMessage({
        title: t('error'),
        description: t('networkError'),
      }));
      return false;
    }

    return true;
  };

  // 质押 NFT
  const stakeNFTs = useCallback(async (tokenIds: {tokenId: number, amount: number}[]) => {
    try {
      const preCheckPassed = await performPreChecks();
      if (!preCheckPassed) return false;

      const viemWalletClient = createWalletClient({
        chain: currentChain,
        transport: custom(walletClient!.transport),
      });

      // 检查是否已授权
      const isApproved = await publicClient.readContract({
        address: nftContractAddress,
        abi: NFTABI,
        functionName: 'isApprovedForAll',
        args: [address as `0x${string}`, stakeContractAddress],
      });

      console.log('isApproved', isApproved);

      // 如果未授权,则先进行授权
      if (!isApproved) {
        const approveHash = await viemWalletClient.writeContract({
          address: nftContractAddress,
          abi: NFTABI,
          functionName: 'setApprovalForAll',
          args: [stakeContractAddress, true],
          account: address as `0x${string}`,
        });

        toast(createToastMessage({
          title: t('stakingInProgress'),
          description: t('stakingInProgress'),
          txHash: approveHash,
        }));

        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      // 遍历所有tokenId进行质押
      for (const {tokenId, amount} of tokenIds) {
        // 调用合约的 stake 方法
        const hash = await viemWalletClient.writeContract({
          address: stakeContractAddress,
          abi: stakingNFTABI,
          functionName: 'stake',
          args: [tokenId, amount],
          account: address as `0x${string}`,
        });

        toast(createToastMessage({
          title: t('stakingInProgress'),
          description: t('stakingInProgress'),
          txHash: hash,
        }));

        await publicClient.waitForTransactionReceipt({ hash });

        toast(createToastMessage({
          title: t('success'),
          description: t('stakingSuccess'),
          txHash: hash,
        }));
      }

      return true;
    } catch {
      console.error('Stake NFTs error');
      toast(createToastMessage({
        title: t('error'),
        description: t('stakingFailed'),
      }));
      return false;
    }
  }, [walletClient, address, stakeContractAddress, toast, t]);

  // 解除质押 NFT
  const unstakeNFTs = useCallback(async (tokenIds: number[]) => {
    try {
      const preCheckPassed = await performPreChecks();
      if (!preCheckPassed) return false;

      const publicClient = createPublicClient({
        chain: currentChain,
        transport: custom(walletClient!.transport),
      });

      const viemWalletClient = createWalletClient({
        chain: currentChain,
        transport: custom(walletClient!.transport),
      });

      // 调用合约的 unstake 方法
      const hash = await viemWalletClient.writeContract({
        address: stakeContractAddress,
        abi: stakingNFTABI,
        functionName: 'unstake',
        args: [tokenIds],
        account: address as `0x${string}`,
      });

      toast(createToastMessage({
        title: t('unstakingInProgress'),
        description: t('unstakingInProgress'),
        txHash: hash,
      }));

      await publicClient.waitForTransactionReceipt({ hash });

      toast(createToastMessage({
        title: t('success'),
        description: t('unstakingSuccess'),
        txHash: hash,
      }));

      return true;
    } catch {
      console.error('Unstake NFTs error');
      toast(createToastMessage({
        title: t('error'),
        description: t('unstakingFailed'),
      }));
      return false;
    }
  }, [walletClient, address, stakeContractAddress, toast, t]);

  // 领取奖励
  const claimRewards = useCallback(async () => {
    try {
      const preCheckPassed = await performPreChecks();
      if (!preCheckPassed) return false;

      const publicClient = createPublicClient({
        chain: currentChain,
        transport: custom(walletClient!.transport),
      });

      const viemWalletClient = createWalletClient({
        chain: currentChain,
        transport: custom(walletClient!.transport),
      });

      // 调用合约的 claimRewards 方法
      const hash = await viemWalletClient.writeContract({
        address: stakeContractAddress,
        abi: stakingNFTABI,
        functionName: 'claimRewards',
        account: address as `0x${string}`,
      });

      toast(createToastMessage({
        title: t('claimingInProgress'),
        description: t('claimingInProgress'),
        txHash: hash,
      }));

      await publicClient.waitForTransactionReceipt({ hash });

      toast(createToastMessage({
        title: t('success'),
        description: t('claimingSuccess'),
        txHash: hash,
      }));

      return true;
    } catch {
      console.error('Claim rewards error');
      toast(createToastMessage({
        title: t('error'),
        description: t('claimingFailed'),
      }));
      return false;
    }
  }, [walletClient, address, stakeContractAddress, toast, t]);

const getClaimableRewards = async () => {
  const viemWalletClient = createWalletClient({
    chain: currentChain,
    transport: custom(walletClient!.transport),
  });
  // 调用合约的 stake 方法
  const hash = await viemWalletClient.writeContract({
    address: stakeContractAddress,
    abi: stakingNFTABI,
    functionName: 'stake',
    args: [1,],
    account: address as `0x${string}`,
  });
await publicClient.waitForTransactionReceipt({ hash });

toast(createToastMessage({
    title: "成功",
    description: "质押成功",
    txHash: hash,
  }));
}


  const getNFTMetadata = async () => {
    // ERC1155 标准接口
    const abi = [
      {
        "inputs": [],
        "name": "name",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
        "name": "uri",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      }
    ];
    
    const getTokenURIsBatch = async (tokenIds: number[]) => {
      const uris = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            const uri = await publicClient.readContract({
              address: nftContractAddress,
              abi: NFTABI,
              functionName: 'tokenURI',
              args: [tokenId],
            });
            return uri as string;
          } catch (error) {
            console.error(`Error fetching URI for token ${tokenId}:`, error);
            return '';
          }
        })
      );
      return uris;
    };

    const metadata = await getTokenURIsBatch([1, 2, 3]);
    console.log('metadata batch:', metadata);
    return metadata;
  }

  const getStakeList = async () => {
    if (!address) return [];

    try {
      setIsLoading(true);

      // 1. 获取用户的所有质押索引
      const indexes = await publicClient.readContract({
        address: stakeContractAddress,
        abi: stakingNFTABI,
        functionName: 'userIndexes',
        args: [address as `0x${string}`],
      }) as number[];

      // 2. 获取每个索引对应的质押信息
      const stakesPromises = indexes.map(async (index) => {
        // 获取质押信息，返回格式为 [tokenId, amount, stakedAt, claimed]
        const stakeInfoArray = await publicClient.readContract({
          address: stakeContractAddress,
          abi: stakingNFTABI,
          functionName: 'stakes',
          args: [address as `0x${string}`, BigInt(index)],
        }) as [bigint, bigint, bigint, bigint];

        // 将数组转换为对象格式
        const stakeInfo = {
          tokenId: stakeInfoArray[0],
          amount: stakeInfoArray[1],
          stakedAt: stakeInfoArray[2],
          claimed: stakeInfoArray[3]
        };

        // 3. 获取待领取的奖励
        const pendingReward = await publicClient.readContract({
          address: stakeContractAddress,
          abi: stakingNFTABI,
          functionName: 'pendingReward',
          args: [address as `0x${string}`, BigInt(index)],
        }) as bigint;

        // 4. 获取代币配置信息，返回格式为 [duration, rewardAmount]
        const tokenConfigArray = await publicClient.readContract({
          address: stakeContractAddress,
          abi: stakingNFTABI,
          functionName: 'tokenConfigs',
          args: [stakeInfo.tokenId],
        }) as [bigint, bigint];

        // 将数组转换为对象格式
        const tokenConfig = {
          duration: tokenConfigArray[0],
          rewardAmount: tokenConfigArray[1]
        };

        // 5. 将区块链数据转换为前端需要的格式
        const stakedAt = new Date(Number(stakeInfo.stakedAt) * 1000);
        const duration = Number(tokenConfig.duration);
        const tokenId = Number(stakeInfo.tokenId);
        
        return {
          id: tokenId,
          name: getNFTNameById(tokenId),
          image: getNFTImageById(tokenId),
          count: Number(stakeInfo.amount),
          totalReward: getTotalRewardById(tokenId),
          dailyReward: getDailyRewardById(tokenId),
          iaoExtraPercentage: getIAOExtraPercentageById(tokenId),
          isStaked: true,
          receivedReward: Number(stakeInfo.claimed) / 1e18,
          pendingReward: Number(pendingReward) / 1e18,
          stakeStartTime: stakedAt,
          stakeEndTime: new Date(stakedAt.getTime() + duration * 1000),
          price: getNFTPriceById(tokenId)
        };
      });

      const stakes = await Promise.all(stakesPromises);
      
      // 计算总质押价值
      const totalValue = calculateTotalStakedValue(stakes);
      setTotalStakedValue(totalValue);

      return stakes;
    } catch (error) {
      console.error('Error fetching stake list:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }

// 辅助函数
const getNFTNameById = (id: number) => {
  switch (id) {
    case 1:
      return "Starter Node";
    case 2:
      return "Pro Node";
    case 3:
      return "Master Node";
    default:
      return `Node #${id}`;
  }
};

const getNFTImageById = (id: number) => {
  return `https://raw.githubusercontent.com/XAIAgentAI/NodeNFTForXAA/main/resource/image/${id}.png`;
};

const getTotalRewardById = (id: number) => {
  switch (id) {
    case 1:
      return 4000;
    case 2:
      return 4000;
    case 3:
      return 10000;
    default:
      return 4000;
  }
};

const getDailyRewardById = (id: number) => {
  switch (id) {
    case 1:
      return 40;
    case 2:
      return 40;
    case 3:
      return 100;
    default:
      return 40;
  }
};

const getIAOExtraPercentageById = (id: number) => {
  switch (id) {
    case 1:
      return 3;
    case 2:
      return 5;
    case 3:
      return 10;
    default:
      return 3;
  }
};

  return {
    stakeNFTs,
    unstakeNFTs,
    claimRewards,
    getNFTMetadata,
    getClaimableRewards,
    getStakeList,
    isLoading,
    totalStakedValue
  };
}; 