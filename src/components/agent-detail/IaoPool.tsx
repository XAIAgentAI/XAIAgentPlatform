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
import { useTranslations } from 'next-intl';
import { LocalAgent } from "@/data/localAgents";

export const IaoPool = ({ agent }: { agent: LocalAgent }) => {
  const [dbcAmount, setDbcAmount] = useState("");
  const { address, isConnected } = useAppKitAccount();
  const { isAuthenticated } = useAuth();
  const { poolInfo, isLoading, stake } = useStakeContract();
  const { toast } = useToast();
  const t = useTranslations('iaoPool');

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
        title: t('error'),
        description: t('connectWalletFirst'),
      });
      return;
    }

    if (!dbcAmount || Number(dbcAmount) <= 0) {
      toast({
        title: t('error'),
        description: t('enterValidAmount'),
      });
      return;
    }

    await stake(dbcAmount);
    toast({
      variant: "default",
      title: t('success'),
      description: t('stakeSuccessful'),
    });
    setDbcAmount("");
  };

  const now = Date.now();
  const isDepositPeriod = now >= poolInfo.startTime * 1000 && now <= poolInfo.endTime * 1000;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">{t('title')}</h2>

      <div className="space-y-4">
        <div className="text-base flex flex-wrap items-center gap-2 bg-orange-50 p-3 rounded-lg">
          <span className="text-black whitespace-nowrap">{t('totalInPool', { symbol: agent.symbol })}:</span>
          <span className="font-semibold text-[#F47521] break-all">{agent.totalSupply}</span>
        </div>

        <div className="text-base flex flex-wrap items-center gap-2 bg-blue-50 p-3 rounded-lg">
          <span className="text-black whitespace-nowrap">{t('currentTotal', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:</span>
          <span className="font-semibold text-[#F47521] break-all">
            {Number(poolInfo.totalDeposited).toLocaleString()}
          </span>
        </div>

        <div className="text-base flex flex-wrap items-center gap-2 bg-purple-50 p-3 rounded-lg">
          <span className="text-black whitespace-nowrap">{t('endCountdown')}:</span>
          <span className="font-semibold text-[#F47521] break-all">{t('toBeAnnounced')}</span>
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{t('youSend')}</h3>

          <div className="flex items-center gap-4 mb-6">
            <div className="font-medium">{agent.symbol === 'XAA' ? 'DBC' : 'XAA'}</div>
            <Input
              type="number"
              value={dbcAmount}
              onChange={handleInputChange}
              onKeyDown={(e) => {
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

          <Button
            className="w-full bg-[#F47521] hover:bg-[#F47521]/90 text-white"
            onClick={handleStake}
            disabled={true}
          >
            {t('iaoNotStarted')}
          </Button>

          {isAuthenticated && (
            <p className="mt-4 text-sm text-muted-foreground">
              {t('stakedAmount', { symbol: 'DBC' })}: {Number(poolInfo.userDeposited).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}; 