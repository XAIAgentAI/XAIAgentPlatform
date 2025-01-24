'use client';

import { Card } from "@/components/ui/card";
import { SwapCard } from "@/components/agent-detail/SwapCard";

export default function BuyDbcPage() {
  return (
    <div className="container mx-auto px-4 py-2">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧介绍区域 */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-card">
            <h1 className="text-2xl font-semibold mb-6 pb-4 border-b border-border-dark">How to Purchase DBC and Transfer It to Your Wallet</h1>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">1.</span>
                  Buy DBC on Gate.io
                </h2>
                <p className="text-sm text-muted-foreground opacity-80 pl-5">
                    Visit <a href="https://www.gate.io/trade/DBC_USDT" target="_blank" className="text-primary underline">Gate.io</a> to purchase DBC.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">2.</span>
                  Add a Custom Network to Your Wallet
                </h2>
                <p className="text-sm text-muted-foreground opacity-80 pl-5">
                    You can use wallets like <a href="https://metamask.io/" target="_blank" className="text-primary underline">MetaMask</a>, <a href="https://imtoken.io/" target="_blank" className="text-primary underline">ImToken</a>, or <a href="https://tokenpocket.net/" target="_blank" className="text-primary underline">TokenPocket</a>.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">3.</span>
                  Configure the Network with the Following Details:
                </h2>
                <div className="space-y-3 text-sm p-4 bg-card-inner rounded-lg pl-12">
                  <div className="flex items-center">
                    <p className="text-muted-foreground pr-4">Network Name:</p>
                    <p className="font-medium">DeepBrainChain Mainnet</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-muted-foreground pr-4">Chain RPC URL:</p>
                    <a href="https://rpc.dbcwallet.io" target="_blank" className="font-medium text-primary underline">https://rpc.dbcwallet.io</a>
                  </div>
                  <div className="flex items-center">
                    <p className="text-muted-foreground pr-4">Chain ID:</p>
                    <p className="font-medium">19880818</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-muted-foreground pr-4">Currency Symbol:</p>
                    <p className="font-medium">DBC</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">4.</span>
                  Withdraw DBC from Gate.io
                </h2>
                <p className="text-sm text-muted-foreground opacity-80 pl-5">
                    When withdrawing, choose <span className="font-bold opacity-100">DBC EVM</span> as the network.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* 右侧交换区域 */}
        <div className="lg:col-span-1">
          <SwapCard />
        </div>
      </div>
    </div>
  );
} 