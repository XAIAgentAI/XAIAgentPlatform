import { useEffect, useState } from "react";
import { useAppKitAccount } from '@reown/appkit/react';
import { createPublicClient, http, formatEther, custom } from 'viem';
import { currentChain } from '@/config/wagmi';
import { useTranslations } from 'next-intl';
import { CONTRACTS } from "@/config/contracts";
import { useWalletClient } from 'wagmi';

// ERC20 Token ABI
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

export const TokenBalance = () => {
  const [dbcBalance, setDbcBalance] = useState<string>("0");
  const [xaaBalance, setXaaBalance] = useState<string>("0");
  const [sicBalance, setSicBalance] = useState<string>("0");
  const { address, isConnected } = useAppKitAccount();
  const { data: walletClient } = useWalletClient();
  const t = useTranslations('common');
  const tErrors = useTranslations('errors');

  // Fetch DBC balance
  const fetchDBCBalance = async () => {
    if (!address || !isConnected) {
      setDbcBalance("0");
      return;
    }

    try {
      
      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(),
      });

      const balance = await publicClient.getBalance({
        address: address as `0x${string}`
      });

      console.log('DBC balance:', formatEther(balance));
      setDbcBalance(formatEther(balance));
    } catch (error) {
      console.error(tErrors('fetchDBCBalanceFailed'), error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      setDbcBalance("0");
    }
  };

  // Fetch XAA balance
  const fetchXAABalance = async () => {
    if (!address || !isConnected) {
      setXaaBalance("0");
      return;
    }

    try {
      
      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(),
      });

      const balance = await publicClient.readContract({
        address: CONTRACTS.XAA_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      });

      console.log('XAA balance:', formatEther(balance));
      setXaaBalance(formatEther(balance));
    } catch (error) {
      console.error(tErrors('fetchXAABalanceFailed'), error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      setXaaBalance("0");
    }
  };

  // Fetch SIC balance
  const fetchSICBalance = async () => {
    if (!address || !isConnected) {
      setSicBalance("0");
      return;
    }

    try {
      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(),
      });

      const balance = await publicClient.readContract({
        address: CONTRACTS.SIC_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      });

      console.log('SIC balance:', formatEther(balance));
      setSicBalance(formatEther(balance));
    } catch (error) {
      console.error(tErrors('fetchSICBalanceFailed'), error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      setSicBalance("0");
    }
  };

  useEffect(() => {
    fetchDBCBalance();
    fetchXAABalance();
    fetchSICBalance();
    
    // Set timer to update balances every 30 seconds
    const timer = setInterval(() => {
      fetchDBCBalance();
      fetchXAABalance();
      fetchSICBalance();
    }, 30000);

    return () => clearInterval(timer);
  }, [address, isConnected]);

  if (!isConnected) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 py-0 text-sm justify-end">
      <div className="flex items-center gap-2 min-w-[120px]">
        <span className="text-muted-foreground whitespace-nowrap">{t('dbcBalance')}:</span>
        <span className="font-medium text-primary truncate" title={Number(dbcBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}>{Number(dbcBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="flex items-center gap-2 min-w-[120px]">
        <span className="text-muted-foreground whitespace-nowrap">{t('xaaBalance')}:</span>
        <span className="font-medium text-primary truncate" title={Number(xaaBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}>{Number(xaaBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="flex items-center gap-2 min-w-[120px]">
        <span className="text-muted-foreground whitespace-nowrap">{t('sicBalance')}:</span>
        <span className="font-medium text-primary truncate" title={Number(sicBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}>{Number(sicBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}; 