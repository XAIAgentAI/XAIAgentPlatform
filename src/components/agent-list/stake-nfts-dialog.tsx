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
import { useTranslations } from 'next-intl';
import {
  ConfigurableTable,
  ColumnRenderers,
  type ColumnConfig
} from "@/components/ui-custom/configurable-table";
import { Input } from "@/components/ui/input";
import { NFT_CONFIGS } from './constants/nft-config';
import { mockNFTItems } from './mock-data';
interface NFTItem {
  id: number;
  name: string;
  image: string;
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

// 使用 NFT_CONFIGS 替换原来的 nftItems
const nftItems: NFTItem[] = NFT_CONFIGS.map(config => ({
  ...config,
  isStaked: false,
  count: 0
}));

// 格式化数字
const formatNumber = (num: number) => {
  return num.toLocaleString('en-US');
};

// 添加倒计时格式化函数
const formatCountdown = (endTime?: Date) => {
  if (!endTime) return '-';
  
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  
  if (diff <= 0) return '已到期';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  const parts = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}时`);
  if (minutes > 0) parts.push(`${minutes}分`);
  
  return parts.join(' ');
};

export const StakeNFTsDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: StakeNFTsDialogProps) => {
  const t = useTranslations('nft');
  const { address } = useAccount();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("stake");
  const [isStaking, setIsStaking] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState<NFTItem[]>([]);
  const [nftAmounts, setNftAmounts] = useState<{ [key: number]: number }>({});
  const {
    stakeNFTs,
    getStakeList,
    isLoading,
    getNFTBalance
  } = useStakingNFTContract()
  const [stakedList, setStakedList] = useState<NFTItem[]>([]);
  const [nftBalances, setNftBalances] = useState<{ [key: number]: number }>({});
  
  // 计算已质押NFT的每日总奖励，考虑每个NFT的数量
  const totalStakedDailyReward = stakedList.reduce((total, item) => {
    // 确保使用实际质押的数量
    const count = item.count || 0;
    return total + (item.dailyReward * count);
  }, 0);

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

  useEffect(() => {
    const fetchNFTBalances = async () => {
      if (address) {
        const res = await getNFTBalance();
        const [tokenIds, amounts] = res as [bigint[], bigint[]];
        const balances: { [key: number]: number } = {};
        tokenIds.forEach((id, index) => {
          balances[Number(id)] = Number(amounts[index]);
        });
        setNftBalances(balances);
      }
    };

    fetchNFTBalances();
  }, [address, getNFTBalance]);

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
        // 刷新质押列表
        await getStakeList().then(list => {
          setStakedList(list);
        });
        // 刷新 NFT 余额
        await getNFTBalance().then(res => {
          const [tokenIds, amounts] = res as [bigint[], bigint[]];
          const balances: { [key: number]: number } = {};
          tokenIds.forEach((id, index) => {
            balances[Number(id)] = Number(amounts[index]);
          });
          setNftBalances(balances);
        });
        // 重置状态并关闭对话框
        onOpenChange(false);
        setSelectedNFTs([]);
        setNftAmounts({});
        onSuccess?.();
      }
    } catch (error) {
      console.error('Stake error:', error);
    } finally {
      setIsStaking(false);
    }
  };

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
                  max={nftBalances[row.id] || 0}
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

                    // 限制数值范围在0到余额之间
                    const maxAmount = nftBalances[row.id] || 0;
                    const value = Math.min(Math.max(0, parsedValue), maxAmount);
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
      id: "balance",
      header: t('nftBalance'),
      width: "100px",
      cell: (row) => <span>{formatNumber(nftBalances[row.id] || 0)} {t('itemCount')}</span>,
    },
    {
      id: "totalReward",
      header: t('totalReward'),
      width: "150px",
      cell: (row) => <span>{formatNumber(500000 * (nftBalances[row.id] || 0))} XAA</span>,
    },
    {
      id: "dailyReward",
      header: t('dailyRewardXAA'),
      width: "150px",
      cell: (row) => <span>{formatNumber(row.dailyReward)} XAA/天</span>,
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
      cell: (row) => <span>{formatNumber(row.count)}个</span>,
    },
    {
      id: "totalReward",
      header: t('totalReward'),
      width: "150px",
      cell: (row) => <span>{formatNumber(500000 * row.count)} XAA</span>,
    },
    {
      id: "dailyReward",
      header: t('dailyRewardXAA'),
      width: "150px",
      cell: (row) => <span>{formatNumber(row.dailyReward * row.count)} XAA/天</span>,
    },
    {
      id: "receivedReward",
      header: t('claimedReward'),
      width: "150px",
      cell: (row) => <span>{formatNumber(row.receivedReward || 0)} XAA</span>,
    },
    {
      id: "stakeEndTime",
      header: t('stakeExpireTime'),
      width: "150px",
      cell: (row) => <span>{formatCountdown(row.stakeEndTime)}</span>,
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

        <div className="hidden md:flex items-center justify-between bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-orange-500/10 px-4 py-1 rounded-lg border border-orange-500/20 mb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-base font-medium text-foreground">{t('noNFTTip')}</div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white hover:text-white border-none whitespace-nowrap ml-4"
            onClick={() => window.open('https://www.drcpad.io/project?name=XAIAgent', '_blank')}
          >
            {t('buyNFT')}
          </Button>
        </div>

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
                // height="400px"
                scroll={{ x: 650, y: true }}
                fixedLeftColumn={true}
                tableClassName="min-w-[650px]"
              />
            </div>

            <div className="bg-muted/20 p-4 rounded-lg h-16">
              <div className="flex justify-between mb-2">
                <span>{t('selected')}:</span>
                <span>{formatNumber(selectedNFTs.length)} {t('itemCount')}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>{t('totalDailyReward')}:</span>
                <span className="text-primary">{formatNumber(totalDailyReward)} XAA</span>
              </div>
            </div>

            <DialogFooter>
              {/* <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                {t('cancel')}
              </Button> */}
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
                  // data={mockNFTItems}
                  data={stakedList}
                  emptyText={t('noStakedNFT')}
                  className="overflow-hidden"
                  height="300px"
                  scroll={{ x: 900, y: true }}
                  fixedLeftColumn={true}
                  tableClassName="min-w-[900px]"
                  rowKey={(row: NFTItem) => `${row.id}-${row.stakeStartTime?.getTime() || Date.now()}`}
                />
              )}
            </div>

            <div className="bg-muted/20 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span>{t('totalDailyReward')}:</span>
                <span className="text-lg font-semibold">{formatNumber(totalStakedDailyReward)} XAA/天</span>
              </div>
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

            {/* <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                {t('close')}
              </Button>
            </DialogFooter> */}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog >
  );
}; 