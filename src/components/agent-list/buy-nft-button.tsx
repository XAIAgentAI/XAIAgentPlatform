import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from '@/components/ui/use-toast';
import { cn } from "@/lib/utils";

interface BuyNFTButtonProps {
  nftName: string;
  price: number;
  className?: string;
}

export const BuyNFTButton = ({
  nftName,
  price,
  className,
}: BuyNFTButtonProps) => {
  const { toast } = useToast();
  
  const handleBuyClick = () => {
    toast({
      title: `请求购买 ${nftName} 成功，等待确认`,
      description: `价格: ${price} XAA`,
      variant: "default",
    });
    
    console.log("购买NFT:", {
      name: nftName,
      price: price
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBuyClick}
      className={cn("border-primary text-primary hover:bg-primary/10", className)}
    >
      购买
    </Button>
  );
};