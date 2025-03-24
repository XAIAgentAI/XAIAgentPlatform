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
  const { toast } = useToast();
  const [isStaking, setIsStaking] = useState(false);

  const handleStakeNFT = () => {
    setIsStaking(true);
    // 模拟质押过程
    setTimeout(() => {
      setIsStaking(false);
      toast({
        title: "质押成功",
        description: `你已成功质押 ${nftInfo.name}，每日可获得 ${nftInfo.dailyReward} XAA 奖励`,
      });
      onOpenChange(false);
      console.log("质押NFT:", nftInfo);
    }, 1500);
  };

  const handleClaimReward = () => {
    toast({
      title: "领取奖励",
      description: `你已成功领取 ${nftInfo.dailyReward} XAA 奖励`,
    });
    onOpenChange(false);
    console.log("领取奖励:", nftInfo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isStaked ? "NFT质押奖励详情" : "质押NFT获取奖励"}
          </DialogTitle>
          <DialogDescription>
            {isStaked 
              ? "查看你的质押详情和当前奖励" 
              : "质押你的NFT获取每日XAA奖励"}
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
            <div className="text-muted-color">总奖励额度:</div>
            <div className="font-medium text-right">{nftInfo.totalReward} XAA</div>
            
            <div className="text-muted-color">每日奖励:</div>
            <div className="font-medium text-right">{nftInfo.dailyReward} XAA</div>
            
            {nftInfo.iaoExtraPercentage && (
              <>
                <div className="text-muted-color">IAO额外收益:</div>
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
              领取奖励
            </Button>
          ) : (
            <Button
              variant="colored"
              className="w-full"
              onClick={handleStakeNFT}
              disabled={isStaking}
            >
              {isStaking ? "质押中..." : "质押NFT"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 