import React, { useState } from "react";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';

interface StakeNFTInfo {
  id: number;
  name: string;
  image: string;
  totalReward: number;
  dailyReward: number;
  iaoExtraPercentage?: number;
}

interface StakeNFTDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nftInfo: StakeNFTInfo;
  isStaked: boolean;
}

export const StakeNFTDialog = ({
  open,
  onOpenChange,
  nftInfo,
  isStaked,
}: StakeNFTDialogProps) => {
  const t = useTranslations('nft');
  const { toast } = useToast();
  const [isStaking, setIsStaking] = useState(false);

  const handleStakeNFT = () => {
    setIsStaking(true);
    // 模拟质押过程
    setTimeout(() => {
      setIsStaking(false);
      toast({
        title: t('stakeSuccess'),
        description: `${t('stakeSuccessDesc', {
          name: nftInfo.name,
          reward: nftInfo.dailyReward
        })}`,
      });
      onOpenChange(false);
      console.log("质押NFT:", nftInfo);
    }, 1500);
  };

  const handleClaimReward = () => {
    toast({
      title: t('claimReward'),
      description: `${t('claimRewardDesc', {
        reward: nftInfo.dailyReward
      })}`,
    });
    onOpenChange(false);
    console.log("领取奖励:", nftInfo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isStaked ? t('stakeNFTRewardDetail') : t('stakeNFTForReward')}
          </DialogTitle>
          <DialogDescription>
            {isStaked 
              ? t('viewStakeDetailAndReward') 
              : t('stakeNFTForDailyReward')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          <div className="w-32 h-32 rounded-lg overflow-hidden mb-4">
            {nftInfo.image && (
              <Image
                src={nftInfo.image}
                alt={nftInfo.name}
                width={128}
                height={128}
                className="object-cover"
              />
            )}
          </div>
          
          <h3 className="text-lg font-semibold">{nftInfo.name}</h3>
          
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mt-6 w-full">
            <div className="text-muted-color">{t('totalRewardLabel')}:</div>
            <div className="font-medium text-right">{nftInfo.totalReward} XAA</div>
            
            <div className="text-muted-color">{t('dailyReward')}:</div>
            <div className="font-medium text-right">{nftInfo.dailyReward} XAA</div>
            
            {nftInfo.iaoExtraPercentage && (
              <>
                <div className="text-muted-color">{t('iaoExtraIncome')}:</div>
                <div className="font-medium text-right">{nftInfo.iaoExtraPercentage}%</div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-center gap-4">
          {isStaked ? (
            <Button
              variant="colored"
              className="w-full"
              onClick={handleClaimReward}
            >
              {t('claimReward')}
            </Button>
          ) : (
            <Button
              variant="colored"
              className="w-full"
              onClick={handleStakeNFT}
              disabled={isStaking}
            >
              {isStaking ? t('staking') : t('stake')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 