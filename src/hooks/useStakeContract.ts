import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { CONTRACTS, STAKE_CONTRACT_ABI } from '@/config/contracts';
import { useToast } from '@/components/ui/use-toast';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAuth } from '@/hooks/useAuth';
import { createPublicClient, createWalletClient, custom, parseEther, type Hash } from 'viem';
import { useWalletClient } from 'wagmi';
import { dbcTestnet } from '@/config/wagmi';
import * as React from 'react';

type ToastMessage = {
  title: string;
  description: string | React.ReactNode;
  txHash?: Hash;
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
  const { data: walletClient } = useWalletClient();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [poolInfo, setPoolInfo] = useState({
    totalDeposited: '0',
    startTime: 0,
    endTime: 0,
    userDeposited: '0',
    hasClaimed: false,
  });

  // Fetch pool info
  const fetchPoolInfo = useCallback(async () => {
    if (!walletClient || !isConnected) return;

    try {
      setIsLoading(true);
      
      const publicClient = createPublicClient({
        chain: dbcTestnet,
        transport: custom(walletClient.transport),
      });

      const [totalDeposited, startTime, endTime] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
          abi: STAKE_CONTRACT_ABI,
          functionName: 'totalDepositedDBC',
        }),
        publicClient.readContract({
          address: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
          abi: STAKE_CONTRACT_ABI,
          functionName: 'startTime',
        }),
        publicClient.readContract({
          address: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
          abi: STAKE_CONTRACT_ABI,
          functionName: 'endTime',
        }),
      ]);

      const newPoolInfo: any = {
        totalDeposited: ethers.formatEther(totalDeposited.toString()),
        startTime: Number(startTime),
        endTime: Number(endTime),
      };

      if (isAuthenticated && address) {
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
        newPoolInfo.userDeposited = ethers.formatEther(userDeposited.toString());
        newPoolInfo.hasClaimed = hasClaimed;
      } else {
        newPoolInfo.userDeposited = '0';
        newPoolInfo.hasClaimed = false;
      }

      setPoolInfo(newPoolInfo);
    } catch (error) {
      console.error('Failed to fetch pool info:', error);
      toast({
        // variant: "destructive",
        title: "Error",
        description: "Failed to fetch pool info",
      });
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, address, isConnected, isAuthenticated, toast]);

  // Auto fetch pool info
  useEffect(() => {
    if (walletClient && isConnected) {
      fetchPoolInfo();
    }
  }, [walletClient, isConnected, address, isAuthenticated, fetchPoolInfo]);

  // Stake DBC
  const stake = async (amount: string) => {
    if (!walletClient || !isConnected || !address) {
      toast(createToastMessage({
        title: "Error",
        description: "Please connect your wallet first",
      } as ToastMessage));
      return;
    }

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

      // Check balance
      const balance = await publicClient.getBalance({ 
        address: address as `0x${string}` 
      });
      const amountWei = parseEther(amount);
      
      if (balance < amountWei) {
        throw new Error('Insufficient balance');
      }

      console.log('Sending transaction to contract:', CONTRACTS.STAKE_CONTRACT);
      const hash = await viemWalletClient.sendTransaction({
        to: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
        value: amountWei,
        account: address as `0x${string}`,
      });

      toast(createToastMessage({
        title: "Transaction Sent",
        description: "Please wait for confirmation",
        txHash: hash,
      } as ToastMessage));

      console.log('Waiting for transaction confirmation:', hash);
      await publicClient.waitForTransactionReceipt({ hash });
      
      toast(createToastMessage({
        title: "Success",
        description: `Successfully staked ${amount} DBC`,
        txHash: hash,
      } as ToastMessage));

      // Refresh pool info
      await fetchPoolInfo();
    } catch (error: any) {
      console.error('Stake failed:', error);
      toast(createToastMessage({
        title: "Error",
        description: error?.message || "Failed to stake",
      } as ToastMessage));
    } finally {
      setIsLoading(false);
    }
  };

  // Claim rewards
  const claimRewards = async () => {
    if (!walletClient || !isConnected || !address) {
      toast(createToastMessage({
        title: "Error",
        description: "Please connect your wallet first",
      } as ToastMessage));
      return;
    }

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

      const { request } = await publicClient.simulateContract({
        address: CONTRACTS.STAKE_CONTRACT as `0x${string}`,
        abi: STAKE_CONTRACT_ABI,
        functionName: 'claimRewards',
        account: address as `0x${string}`,
      });

      const hash = await viemWalletClient.writeContract(request);
      
      toast(createToastMessage({
        title: "Transaction Sent",
        description: "Please wait for confirmation",
        txHash: hash,
      } as ToastMessage));

      await publicClient.waitForTransactionReceipt({ hash });
      
      toast(createToastMessage({
        title: "Success",
        description: "Successfully claimed XAA rewards",
        txHash: hash,
      } as ToastMessage));

      // Refresh pool info
      await fetchPoolInfo();
    } catch (error: any) {
      console.error('Claim rewards failed:', error);
      toast(createToastMessage({
        title: "Error",
        description: error?.message || "Failed to claim rewards",
      } as ToastMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    poolInfo,
    isLoading,
    stake,
    claimRewards,
    fetchPoolInfo,
  };
}; 