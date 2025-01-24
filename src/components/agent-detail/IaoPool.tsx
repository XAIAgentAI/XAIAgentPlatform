'use client';

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Countdown } from "../ui-custom/countdown";
import { useStakeContract } from "@/hooks/useStakeContract";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/components/ui/use-toast";

export const IaoPool = () => {
  const [dbcAmount, setDbcAmount] = useState("");
  const { address } = useWallet();
  const { poolInfo, isLoading, stake } = useStakeContract();
  const { toast } = useToast();

  const handleStake = async () => {
    if (!dbcAmount || Number(dbcAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid stake amount",
      });
      return;
    }

    await stake(dbcAmount);
    setDbcAmount("");
  };

  const now = Date.now();
  const isDepositPeriod = now >= poolInfo.startTime * 1000 && now <= poolInfo.endTime * 1000;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">IAO Pool</h2>

      <div className="space-y-4">
        <div className="text-base text-secondary-foreground">
          Total XAA in the IAO pool: 20,000,000,000
        </div>

        <div className="text-base text-secondary-foreground">
          Current total of DBC in the IAO pool: {poolInfo.totalDeposited}
        </div>

        <div className="text-base text-secondary-foreground flex items-center gap-2">
          {/* {isDepositPeriod ? (
            <>
              End countdown:
              <Countdown 
                remainingTime={poolInfo.endTime * 1000 - now}
                onEnd={() => console.log('Staking period ended')} 
              />
            </>
          ) : ( */}
            <span>To be announced</span>
          {/* )} */}
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-4">You send</h3>

          <div className="flex items-center gap-4 mb-6">
            <div className="font-medium">DBC</div>
            <Input
              type="number"
              value={dbcAmount}
              onChange={(e) => setDbcAmount(e.target.value)}
              className="flex-1 placeholder:text-muted-foreground/50"
              placeholder="0.0"
              disabled={!isDepositPeriod || isLoading}
            />
          </div>

          <Button 
            className="w-full bg-[#F47521] hover:bg-[#F47521]/90 text-white"
            onClick={handleStake}
            disabled={!address || !isDepositPeriod || isLoading}
          >
            {!address 
              ? "Connect Wallet" 
              : !isDepositPeriod 
                ? "Staking Not Available" 
                : isLoading 
                  ? "Processing..." 
                  : "Send"}
          </Button>

          {address && (
            <p className="mt-4 text-sm text-muted-foreground">
              I have transferred the number of DBCs to the IAO pool: {poolInfo.userDeposited}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}; 