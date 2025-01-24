'use client';

import { Card } from "@/components/ui/card";

export default function BuyDbcPage() {
  return (
    <div className="container mx-auto px-4 py-2 flex justify-center">
      <div className="flex justify-center">
        <Card className="p-6 bg-card max-w-3xl">
          <h1 className="text-2xl font-semibold mb-6 pb-4 border-b border-border-dark">How to Purchase DBC and Transfer It to Your Wallet</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">1.</span>
                Buy DBC on Gate.io
              </h2>
              <p className="text-sm text-muted-foreground pl-5">
                  Visit <a href="https://www.gate.io/trade/DBC_USDT" target="_blank" className="text-primary">Gate.io</a> to purchase DBC.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">2.</span>
                Add a Custom Network to Your Wallet
              </h2>
              <p className="text-sm text-muted-foreground pl-5">
                  You can use wallets like <a href="https://metamask.io/" target="_blank" className="text-primary">MetaMask</a>, <a href="https://imtoken.io/" target="_blank" className="text-primary">ImToken</a>, or <a href="https://tokenpocket.net/" target="_blank" className="text-primary">TokenPocket</a>.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">3.</span>
                Configure the Network with the Following Details:
              </h2>
              <div className="space-y-3 text-sm p-4 bg-card-inner rounded-lg pl-4 lg:pl-12">
                <div className="flex items-center">
                  <p className="text-muted-foreground pr-4">Network Name:</p>
                  <p className="font-medium">DeepBrainChain Mainnet</p>
                </div>
                <div className="flex items-center">
                  <p className="text-muted-foreground pr-4">Chain RPC URL:</p>
                  <a href="https://rpc.dbcwallet.io" target="_blank" className="font-medium text-primary">https://rpc.dbcwallet.io</a>
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
              <p className="text-sm text-muted-foreground pl-5">
                  When withdrawing, choose <span className="font-bold">DBC EVM</span> as the network.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 