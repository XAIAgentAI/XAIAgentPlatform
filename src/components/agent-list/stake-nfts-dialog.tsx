import React, { useState } from "react";
import { useToast } from '@/components/ui/use-toast';
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
  nftItems: NFTItem[];
}

export const StakeNFTsDialog = ({
  open,
  onOpenChange,
  nftItems,
}: StakeNFTsDialogProps) => {
  const t = useTranslations('nft');
  const [activeTab, setActiveTab] = useState<string>("stake");
  const [isStaking, setIsStaking] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState<NFTItem[]>([]);

  const { toast } = useToast();

  // 计算总每日奖励
  const totalDailyReward = selectedNFTs
    .filter(item => !item.isStaked)
    .reduce((total, item) => total + item.dailyReward * item.count, 0);

  // 处理质押
  const handleStake = async () => {
    if (selectedNFTs.length === 0) {
      toast({
        title: t('pleaseSelectNFT'),
        variant: "destructive",
      });
      return;
    }

    setIsStaking(true);

    try {
      // 模拟质押操作
      await new Promise(resolve => setTimeout(resolve, 1500));

      const stakedNFTs = selectedNFTs
        .map(item => item.name)
        .join(", ");

      toast({
        title: `${t('stakeSuccess')} ${stakedNFTs}`,
        description: `${t('dailyReward')}: ${totalDailyReward} XAA`,
      });

      onOpenChange(false);
      setSelectedNFTs([]);
    } catch {
      toast({
        title: t('stakeFailRetry'),
      });
    } finally {
      setIsStaking(false);
    }
  };

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
        {/* 
        部署好了  <Tabs defaultValue="marketCap" className="w-auto">
          <TabsList className="bg-transparent border border-[#E5E5E5] dark:border-white/30 p-1">
            <TabsTrigger
              value="marketCap"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-1"
            >
              {t('marketCap')}
            </TabsTrigger>
            <TabsTrigger
              value="latest"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-1"
            >
              {t('latest')}
            </TabsTrigger>
          </TabsList>
        </Tabs> */}


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
                data={nftItems.filter(item => !item.isStaked)}
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
              {/* <Button
                variant="colored"
                onClick={handleStake}
                disabled={selectedNFTs.length === 0 || isStaking}
                className="w-full sm:w-auto"
              >
                {isStaking ? "处理中..." : "确认质押"}
              </Button> */}

              <Button onClick={handleStake}
                disabled={selectedNFTs.length === 0 || isStaking}>
                {isStaking ? t('confirming') : t('confirmStake')}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="staked" className="space-y-4">
            <div className="w-full" style={{ overflowX: 'hidden', overflowY: 'hidden' }}>
              <ConfigurableTable<NFTItem>
                columns={stakedNFTColumns}
                data={nftItems.filter(item => item.isStaked)}
                emptyText={t('noStakedNFT')}
                height="400px"
                scroll={{ x: 1200, y: true }}
                fixedLeftColumn={true}
                tableClassName="min-w-[1200px]"
              />
            </div>

            <div className="bg-muted/20 p-4 rounded-lg h-16">

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