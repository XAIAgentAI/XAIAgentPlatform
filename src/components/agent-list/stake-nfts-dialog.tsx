import React, { useState, useEffect } from "react";
import { useToast } from '@/components/ui/use-toast';
import { useAccount } from 'wagmi';
import { useStakingNFTContract } from '@/hooks/contracts/useStakingNFTContract';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useTranslations } from 'next-intl';
import {
  ConfigurableTable,
  ColumnRenderers,
  type ColumnConfig
} from "@/components/ui-custom/configurable-table";
import { Input } from "@/components/ui/input";

interface NFTItem {
  id: number;
  name: string;
  image: string;
  totalReward: number;
  dailyReward: number;
  iaoExtraPercentage: number;
  isStaked: boolean;
  count: number;
  price?: number;
  receivedReward?: number;
  stakeStartTime?: Date;
  stakeEndTime?: Date;
}

interface StakeNFTsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
const nftItems = [
  {
    id: 1,
    name: "Starter Node",
    image: "https://raw.githubusercontent.com/XAIAgentAI/NodeNFTForXAA/main/resource/image/1.png",
    totalReward: 4000,
    dailyReward: 40,
    iaoExtraPercentage: 3,
    isStaked: false,
    // count: 2,
    price: 99
  },
  {
    id: 2,
    name: "Pro Node",
    image: "https://raw.githubusercontent.com/XAIAgentAI/NodeNFTForXAA/main/resource/image/2.png",
    totalReward: 4000,
    dailyReward: 40,
    iaoExtraPercentage: 5,
    isStaked: false,
    // count: 1,
    price: 199
  },
  {
    id: 3,
    name: "Master Node",
    image: "https://raw.githubusercontent.com/XAIAgentAI/NodeNFTForXAA/main/resource/image/3.png",
    totalReward: 10000,
    dailyReward: 100,
    iaoExtraPercentage: 10,
    isStaked: false,
    // count: 1,
    price: 299
  }
];

export const StakeNFTsDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: StakeNFTsDialogProps) => {
  const t = useTranslations('nft');
  const [activeTab, setActiveTab] = useState<string>("stake");
  const [isStaking, setIsStaking] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState<NFTItem[]>([]);
  const [nftAmounts, setNftAmounts] = useState<{ [key: number]: number }>({});
  const { address } = useAccount()
  const {
    stakeNFTs,
    getStakeList,
    isLoading,
  } = useStakingNFTContract()
  // const [totalClaimable, setTotalClaimable] = useState(0)
  const [stakedList, setStakedList] = useState<NFTItem[]>([]);
  
  useEffect(() => {
    const fetchStakedList = async () => {
      const list = await getStakeList();
      console.log('stakedList', list);
      setStakedList(list);
    };
    
    if (address) {
      fetchStakedList();
    }
  }, [address]);

  const { toast } = useToast();

  // 计算总每日奖励
  const totalDailyReward = selectedNFTs
    .filter(item => !item.isStaked)
    .reduce((total, item) => total + item.dailyReward * (nftAmounts[item.id] || 0), 0);

  // 处理质押
  const handleStake = async () => {
    if (selectedNFTs.length === 0) {
      toast({
        title: t('pleaseSelectNFT'),
        variant: "destructive",
      });
      return;
    }

    const hasValidAmount = selectedNFTs.some(nft => (nftAmounts[nft.id] || 0) > 0);
    if (!hasValidAmount) {
      toast({
        title: t('pleaseEnterValidAmount'),
        variant: "destructive",
      });
      return;
    }

    setIsStaking(true);

    try {
      const tokenIdsWithAmounts = selectedNFTs
        .filter(nft => (nftAmounts[nft.id] || 0) > 0)
        .map(nft => ({
          tokenId: nft.id,
          amount: nftAmounts[nft.id] || 0
        }));

      const success = await stakeNFTs(tokenIdsWithAmounts);

      if (success) {
        onOpenChange(false);
        setSelectedNFTs([]);
        setNftAmounts({});
        onSuccess?.();
      }
    } finally {
      setIsStaking(false);
    }
  };

  // // 处理解除质押
  // const handleUnstake = async (nft: NFTItem) => {
  //   try {
  //     const success = await unstakeNFTs([nft.id])
  //     if (success) {
  //       onSuccess?.();
  //     }
  //   } catch (error) {
  //     console.error('Unstake error:', error)
  //   }
  // };

  // // 处理领取奖励
  // const handleClaim = async () => {
  //   // try {
  //   //   const success = await claimRewards()
  //   //   if (success) {
  //   //     setTotalClaimable(0)
  //   //     onSuccess?.();
  //   //   }
  //   // } catch (error) {
  //   //   console.error('Claim rewards error:', error)
  //   // }
  // };

  // 格式化日期
  const formatDate = (date?: Date) => {
    return date ? format(date, 'yyyy-MM-dd HH:mm') : '-';
  };

  // 获取当前时间
  const currentTime = new Date();

  // 可质押NFT的表格列配置
  const unstakeNFTColumns: ColumnConfig<NFTItem>[] = [
    {
      id: "name",
      header: t('stakeableNFT'),
      width: "200px",
      cell: (row) => (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg overflow-hidden ${row.id === 1 ? "bg-blue-100" :
                row.id === 2 ? "bg-purple-100" : "bg-red-100"
              }`}>
              <img src={row.image} alt={row.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{row.name}</span>
              {selectedNFTs.some(nft => nft.id === row.id) && (
                <Input
                  type="number"
                  min="0"
                  value={nftAmounts[row.id] || 0}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // 允许清空输入框
                    if (inputValue === '') {
                      setNftAmounts(prev => ({
                        ...prev,
                        [row.id]: 0
                      }));
                      return;
                    }

                    const parsedValue = parseInt(inputValue);
                    // 检查是否为有效数字
                    if (isNaN(parsedValue)) {
                      return;
                    }

                    // 限制数值范围
                    const value = (Math.max(0, parsedValue));
                    setNftAmounts(prev => ({
                      ...prev,
                      [row.id]: value
                    }));
                  }}
                  className="w-20 h-7 text-sm mt-1"
                />
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "totalReward",
      header: t('totalReward'),
      width: "150px",
      cell: (row) => <span>{row.totalReward} XAA</span>,
    },
    {
      id: "dailyReward",
      header: t('dailyRewardXAA'),
      width: "150px",
      cell: (row) => <span>{row.dailyReward} XAA/天</span>,
    },
    {
      id: "iaoExtraPercentage",
      header: t('iaoExtraReward'),
      width: "150px",
      cell: (row) => <span>+{row.iaoExtraPercentage}%</span>,
    },
  ];

  // 已质押NFT的表格列配置
  const stakedNFTColumns: ColumnConfig<NFTItem>[] = [
    {
      id: "name",
      header: t('stakedNFT'),
      width: "200px",
      cell: ColumnRenderers.avatarWithName<NFTItem>(
        "image",
        "name",
        {
          avatarClassName: (row: NFTItem) =>
            row.id === 1 ? "bg-blue-100" :
              row.id === 2 ? "bg-purple-100" : "bg-red-100"
        }
      ),
    },
    {
      id: "count",
      header: t('count'),
      width: "100px",
      cell: (row) => <span>{row.count}个</span>,
    },
    {
      id: "totalReward",
      header: t('totalReward'),
      width: "150px",
      cell: (row) => <span>{row.totalReward * row.count} XAA</span>,
    },
    {
      id: "dailyReward",
      header: t('dailyRewardXAA'),
      width: "150px",
      cell: (row) => <span>{row.dailyReward * row.count} XAA/天</span>,
    },
    {
      id: "receivedReward",
      header: t('claimedReward'),
      width: "150px",
      cell: (row) => <span>{row.receivedReward || 0} XAA</span>,
    },
    {
      id: "stakeStartTime",
      header: t('startTime'),
      width: "180px",
      cell: (row) => <span>{formatDate(row.stakeStartTime)}</span>,
    },
    {
      id: "currentTime",
      header: t('currentTime'),
      width: "180px",
      cell: () => <span>{formatDate(currentTime)}</span>,
    },
    {
      id: "stakeEndTime",
      header: t('stakeExpireTime'),
      width: "180px",
      cell: (row) => <span>{formatDate(row.stakeEndTime)}</span>,
    },
    // {
    //   id: "actions",
    //   header: t('actions'),
    //   width: "150px",
    //   cell: (row) => (
    //     <div className="flex gap-2">
    //       <Button
    //         variant="outline"
    //         size="sm"
    //         onClick={() => handleUnstake(row)}
    //       >
    //         {t('unstake')}
    //       </Button>
    //     </div>
    //   ),
    // }
  ];

  // 处理选择变化
  const handleSelectionChange = (selected: NFTItem[]) => {
    setSelectedNFTs(selected);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="
        mx-auto 
        rounded-xl 
        overflow-hidden
        max-h-[80vh]
        w-[95%] 
        max-w-[95%] 
        md:w-[720px] 
        md:max-w-[720px]
        lg:w-[960px] 
        lg:max-w-[960px]
        xl:w-[1140px] 
        xl:max-w-[1140px]
        2xl:w-[1320px] 
        2xl:max-w-[1320px]">
        <DialogHeader>
          <DialogTitle>{t('stakeNFTRewardDetail')}</DialogTitle>
          <DialogDescription>
            {t('viewStakeDetailAndReward')}
          </DialogDescription>
        </DialogHeader>


        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-hidden">
          <TabsList className="bg-transparent border border-[#E5E5E5] dark:border-white/30 p-1 grid grid-cols-2 w-full mb-4">
            <TabsTrigger
              value="stake"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-1"
            >{t('stake')}</TabsTrigger>
            <TabsTrigger value="staked"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-1"

            >{t('staked')}</TabsTrigger>
          </TabsList>

          <TabsContent value="stake" className="space-y-4">
            <div className="w-full" style={{ overflowX: 'hidden', overflowY: 'hidden' }}>
              <ConfigurableTable<NFTItem>
                columns={unstakeNFTColumns}
                data={nftItems as NFTItem[]}
                selectable={true}
                onSelectionChange={handleSelectionChange}
                emptyText={t('noStakeableNFT')}
                height="400px"
                scroll={{ x: 650, y: true }}
                fixedLeftColumn={true}
                tableClassName="min-w-[650px]"
              />
            </div>

            <div className="bg-muted/20 p-4 rounded-lg h-16">
              <div className="flex justify-between mb-2">
                <span>{t('selected')}:</span>
                <span>{selectedNFTs.length} {t('itemCount')}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>{t('totalDailyReward')}:</span>
                <span className="text-primary">{totalDailyReward} XAA</span>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                {t('cancel')}
              </Button>
              <Button onClick={handleStake}
                disabled={!address || selectedNFTs.length === 0 || !selectedNFTs.some(nft => (nftAmounts[nft.id] || 0) > 0) || isStaking}>
                {isStaking ? t('confirming') : t('confirmStake')}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="staked" className="space-y-4">
            <div className="w-full" style={{ overflowX: 'hidden', overflowY: 'hidden' }}>
              {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-muted-foreground">{t('loadingStakedNFTs')}</p>
                  </div>
                </div>
              ) : (
                <ConfigurableTable<NFTItem>
                  columns={stakedNFTColumns}
                  data={stakedList}
                  emptyText={t('noStakedNFT')}
                  height="400px"
                  scroll={{ x: 1200, y: true }}
                  fixedLeftColumn={true}
                  tableClassName="min-w-[1200px]"
                />
              )}
            </div>

            <div className="bg-muted/20 p-4 rounded-lg space-y-2">
              {/* <div className="flex justify-between items-center">
                <span>{t('totalStakedValue')}:</span>
                <span className="text-lg font-semibold">${totalStakedValue.toLocaleString()}</span>
              </div> */}
              {/* <div className="flex justify-between items-center">
                <span>{t('totalClaimableRewards')}:</span>
                <span>{totalClaimable} XAA</span>
              </div> */}
              {/* <Button
                onClick={handleClaim}
                disabled={totalClaimable <= 0}
                className="w-full"
              >
                {t('claimAllRewards')}
              </Button> */}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                {t('close')}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog >
  );
}; 