'use client';

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Countdown } from "../ui-custom/countdown";
import { useStakeContract } from "@/hooks/useStakeContract";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAppKitAccount } from '@reown/appkit/react'


export const IaoPool = () => {
  const [dbcAmount, setDbcAmount] = useState("");
  const { address, isConnected } = useAppKitAccount();
  const { isAuthenticated } = useAuth();
  const { poolInfo, isLoading, stake } = useStakeContract();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 只允许输入正数和小数点
    if (value === '' || (/^\d*\.?\d*$/.test(value) && Number(value) >= 0)) {
      setDbcAmount(value);
    }
  };

  const handleStake = async () => {
    if (!isAuthenticated) {
      toast({
        // variant: "destructive",
        title: "Error",
        description: "Please connect wallet first",
      });
      return;
    }

    if (!dbcAmount || Number(dbcAmount) <= 0) {
      toast({
        // variant: "destructive",
        title: "Error",
        description: "Please enter a valid stake amount",
      });
      return;
    }

    await stake(dbcAmount);
    toast({
      variant: "default",
      title: "Success",
      description: "Stake successful!",
    });
    setDbcAmount("");
  };

  const now = Date.now();
  const isDepositPeriod = now >= poolInfo.startTime * 1000 && now <= poolInfo.endTime * 1000;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">IAO Pool</h2>

      <div className="space-y-4">
        <div className="text-base flex flex-wrap items-center gap-2 bg-orange-50 p-3 rounded-lg">
          <span className="text-black whitespace-nowrap">Total XAA in the IAO pool:</span>
          <span className="font-semibold text-[#F47521] break-all">{Number(20000000000).toLocaleString()}</span>
        </div>

        <div className="text-base flex flex-wrap items-center gap-2 bg-blue-50 p-3 rounded-lg">
          <span className="text-black whitespace-nowrap">Current total of DBC in the IAO pool:</span>
          <span className="font-semibold text-[#3B82F6] break-all">
            {Number(poolInfo.totalDeposited).toLocaleString()}
          </span>
        </div>

        <div className="text-base flex flex-wrap items-center gap-2 bg-purple-50 p-3 rounded-lg">
          <span className="text-black whitespace-nowrap">End countdown:</span>
          <span className="font-semibold text-[#8B5CF6] break-all">To be announced</span>
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-4">You send</h3>

          <div className="flex items-center gap-4 mb-6">
            <div className="font-medium">DBC</div>
            <Input
              type="number"
              value={dbcAmount}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                // 阻止输入负号
                if (e.key === '-' || e.key === 'e') {
                  e.preventDefault();
                }
              }}
              min="0"
              step="any"
              className="flex-1 placeholder:text-muted-foreground/50"
              placeholder="0.0"
              disabled={!isDepositPeriod || isLoading || !isAuthenticated}
            />
          </div>

          {/* <Button 
            className="w-full bg-[#F47521] hover:bg-[#F47521]/90 text-white"
            onClick={handleStake}
            disabled={!isAuthenticated || !isDepositPeriod || isLoading}
          >
            {!isAuthenticated 
              ? "Connect Wallet" 
              : !isDepositPeriod 
                ? "Staking not started" 
                : isLoading 
                  ? "Processing..." 
                  : "Send"}
          </Button> */}

          <Button
            className="w-full bg-[#F47521] hover:bg-[#F47521]/90 text-white"
            onClick={handleStake}
            disabled={true}
          >
            IAO not started
          </Button>


          {isAuthenticated && (
            <p className="mt-4 text-sm text-muted-foreground">
              Staked DBC Amount: {Number(poolInfo.userDeposited).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}; 