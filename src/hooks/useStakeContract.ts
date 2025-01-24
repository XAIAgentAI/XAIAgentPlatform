import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useWallet } from './useWallet';
import { CONTRACTS, STAKE_CONTRACT_ABI } from '@/config/contracts';
import { useToast } from '@/components/ui/use-toast';

type ToastMessage = {
  title: string;
  description: string;
  txHash?: string;
};

const createToastMessage = ({ title, description, txHash }: ToastMessage) => ({
  title,
  description: txHash
    ? `${description}\n\nView on Etherscan: https://sepolia.etherscan.io/tx/${txHash}`
    : description,
});

type StakeContract = ethers.Contract & {
  totalDepositedDBC: () => Promise<bigint>;
  startTime: () => Promise<bigint>;
  endTime: () => Promise<bigint>;
  userDeposits: (address: string) => Promise<bigint>;
  hasClaimed: (address: string) => Promise<boolean>;
  claimRewards: () => Promise<ethers.ContractTransactionResponse>;
};

export const useStakeContract = () => {
  const { address } = useWallet();
  const { toast } = useToast();
  const [contract, setContract] = useState<StakeContract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [poolInfo, setPoolInfo] = useState({
    totalDeposited: '0',
    startTime: 0,
    endTime: 0,
    userDeposited: '0',
    hasClaimed: false,
  });

  // Initialize contract
  useEffect(() => {
    if (!window.ethereum) return;
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      CONTRACTS.STAKE_CONTRACT,
      STAKE_CONTRACT_ABI,
      provider
    ) as StakeContract;
    
    setContract(contract);
  }, []);

  // Fetch pool info
  const fetchPoolInfo = useCallback(async () => {
    if (!contract || !address) return;

    try {
      setIsLoading(true);
      const [totalDeposited, startTime, endTime, userDeposited, hasClaimed] = await Promise.all([
        contract.totalDepositedDBC(),
        contract.startTime(),
        contract.endTime(),
        contract.userDeposits(address),
        contract.hasClaimed(address),
      ]);

      setPoolInfo({
        totalDeposited: ethers.formatEther(totalDeposited),
        startTime: Number(startTime),
        endTime: Number(endTime),
        userDeposited: ethers.formatEther(userDeposited),
        hasClaimed,
      });
    } catch (error) {
      console.error('Failed to fetch pool info:', error);
      toast(createToastMessage({
        title: "Error",
        description: "Failed to fetch pool information",
      }));
    } finally {
      setIsLoading(false);
    }
  }, [contract, address, toast]);

  // Stake DBC
  const stake = async (amount: string) => {
    if (!window.ethereum || !address) {
      toast(createToastMessage({
        title: "Error",
        description: "Please connect your wallet first",
      }));
      return;
    }

    try {
      setIsLoading(true);
      console.log('Starting stake:', amount, 'DBC');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Check balance
      const balance = await provider.getBalance(address);
      const amountWei = ethers.parseEther(amount);
      
      if (balance < amountWei) {
        throw new Error('Insufficient balance');
      }

      console.log('Sending transaction to contract:', CONTRACTS.STAKE_CONTRACT);
      const tx = await signer.sendTransaction({
        to: CONTRACTS.STAKE_CONTRACT,
        value: amountWei,
        gasLimit: 100000,
      });

      toast(createToastMessage({
        title: "Transaction Sent",
        description: "Please wait for confirmation",
        txHash: tx.hash,
      }));

      console.log('Waiting for transaction confirmation:', tx.hash);
      await tx.wait();
      
      toast(createToastMessage({
        title: "Success",
        description: `Successfully staked ${amount} DBC`,
        txHash: tx.hash,
      }));

      // Refresh pool info
      await fetchPoolInfo();
    } catch (error: any) {
      console.error('Stake failed:', error);
      toast(createToastMessage({
        title: "Error",
        description: error?.message || "Failed to stake",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Claim rewards
  const claimRewards = async () => {
    if (!window.ethereum || !address) {
      toast(createToastMessage({
        title: "Error",
        description: "Please connect your wallet first",
      }));
      return;
    }

    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract?.connect(signer) as StakeContract;

      if (!contractWithSigner) throw new Error('Contract not initialized');

      const tx = await contractWithSigner.claimRewards();
      
      toast(createToastMessage({
        title: "Transaction Sent",
        description: "Please wait for confirmation",
        txHash: tx.hash,
      }));

      await tx.wait();
      
      toast(createToastMessage({
        title: "Success",
        description: "Successfully claimed XAA rewards",
        txHash: tx.hash,
      }));

      // Refresh pool info
      await fetchPoolInfo();
    } catch (error: any) {
      console.error('Claim rewards failed:', error);
      toast(createToastMessage({
        title: "Error",
        description: error?.message || "Failed to claim rewards",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Auto fetch pool info
  useEffect(() => {
    if (address) {
      fetchPoolInfo();
    }
  }, [address, fetchPoolInfo]);

  return {
    poolInfo,
    isLoading,
    stake,
    claimRewards,
    fetchPoolInfo,
  };
}; 