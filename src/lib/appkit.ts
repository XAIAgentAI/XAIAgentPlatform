import { useEffect, useState } from 'react';

interface AppKitAccount {
  address: string | null;
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected';
}

interface AppKit {
  open: (options: { view: 'Connect' | 'Account' }) => void;
}

// 这是一个模拟的实现，实际应该从真实的 AppKit SDK 中导入
export function useAppKitAccount(): AppKitAccount {
  const [account, setAccount] = useState<AppKitAccount>({
    address: null,
    isConnected: false,
    status: 'disconnected',
  });

  useEffect(() => {
    // 这里应该是真实的 AppKit SDK 的实现
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount({
          address: accounts[0],
          isConnected: true,
          status: 'connected',
        });
      } else {
        setAccount({
          address: null,
          isConnected: false,
          status: 'disconnected',
        });
      }
    };

    // 监听钱包连接状态
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(handleAccountsChanged);

      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  return account;
}

export function useAppKit(): AppKit {
  return {
    open: ({ view }) => {
      if (view === 'Connect') {
        window.ethereum?.request({ method: 'eth_requestAccounts' });
      }
      // Account view 的处理可以根据需求添加
    },
  };
}

// 为 window.ethereum 添加类型定义
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
} 