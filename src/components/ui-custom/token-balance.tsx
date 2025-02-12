import { useEffect, useState } from "react";
import { useAppKitAccount } from '@reown/appkit/react';
import { createPublicClient, http, formatEther, custom } from 'viem';
import { dbcTestnet } from '@/config/wagmi';
import { useTranslations } from 'next-intl';
import { CONTRACTS } from "@/config/contracts";
import { useWalletClient } from 'wagmi';

// ERC20 的 ABI
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
  const { address, isConnected } = useAppKitAccount();
  const { data: walletClient } = useWalletClient();
  const t = useTranslations('common');

  // 获取DBC余额
  const fetchDBCBalance = async () => {
    if (!address || !isConnected || !walletClient) {
      setDbcBalance("0");
      return;
    }

    try {
      const publicClient = createPublicClient({
        chain: dbcTestnet,
        transport: custom(walletClient.transport),
      });

      const balance = await publicClient.getBalance({
        address: address as `0x${string}`
      });

      setDbcBalance(formatEther(balance));
    } catch (error) {
      console.error('获取DBC余额失败:', error);
      setDbcBalance("0");
    }
  };

  // 获取XAA余额
  const fetchXAABalance = async () => {
    if (!address || !isConnected || !walletClient) {
      setXaaBalance("0");
      return;
    }

    try {
      const publicClient = createPublicClient({
        chain: dbcTestnet,
        transport: custom(walletClient.transport),
      });

      const balance = await publicClient.readContract({
        address: CONTRACTS.XAA_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      });

      setXaaBalance(formatEther(balance));
    } catch (error) {
      console.error('获取XAA余额失败:', error);
      setXaaBalance("0");
    }
  };

  useEffect(() => {
    fetchDBCBalance();
    fetchXAABalance();
    
    // 设置定时器，每30秒更新一次余额
    const timer = setInterval(() => {
      fetchDBCBalance();
      fetchXAABalance();
    }, 30000);

    return () => clearInterval(timer);
  }, [address, isConnected, walletClient]);

  if (!isConnected) return null;

  return (
    <div className="flex items-center gap-6 py-0 text-sm justify-end">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{t('dbcBalance')}:</span>
        <span className="font-medium text-primary">{Number(dbcBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{t('xaaBalance')}:</span>
        <span className="font-medium text-primary">{Number(xaaBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}; 