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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

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

interface BatchStakeNFTDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nftItems: NFTItem[];
}

export const BatchStakeNFTDialog = ({
  open,
  onOpenChange,
  nftItems,
}: BatchStakeNFTDialogProps) => {
  const [activeTab, setActiveTab] = useState<string>("stake");
  const [isStaking, setIsStaking] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState<number[]>([]);

  const { toast } = useToast();
  
  // 计算总每日奖励
  const totalDailyReward = nftItems
    .filter(item => selectedNFTs.includes(item.id) && !item.isStaked)
    .reduce((total, item) => total + item.dailyReward * item.count, 0);
  
  // 处理NFT选择
  const handleNFTSelect = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedNFTs(prev => [...prev, id]);
    } else {
      setSelectedNFTs(prev => prev.filter(nftId => nftId !== id));
    }
  };
  
  // 处理批量质押
  const handleBatchStake = async () => {
    if (selectedNFTs.length === 0) {
      toast({
        title: "请至少选择一个NFT进行质押",
        variant: "destructive",
      });
      return;
    }
    
    setIsStaking(true);
    
    try {
      // 模拟质押操作
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const stakedNFTs = nftItems
        .filter(item => selectedNFTs.includes(item.id))
        .map(item => item.name)
        .join(", ");
      
      toast({
        title: `成功质押 ${stakedNFTs}`,
        description: `每日将获得 ${totalDailyReward} XAA 奖励`,
      });
      
      onOpenChange(false);
      setSelectedNFTs([]);
    } catch {
      toast({
        title: "质押失败，请稍后重试",
      });
    } finally {
      setIsStaking(false);
    }
  };
  
  // 选择全部未质押的NFT
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const unstakednftIds = nftItems
        .filter(item => !item.isStaked)
        .map(item => item.id);
      setSelectedNFTs(unstakednftIds);
    } else {
      setSelectedNFTs([]);
    }
  };
  
  // 判断全选状态
  const isAllSelected = nftItems
    .filter(item => !item.isStaked)
    .every(item => selectedNFTs.includes(item.id));
  
  // 获取可选择的NFT数量
  const selectableNFTCount = nftItems.filter(item => !item.isStaked).length;
  
  // 获取已质押的NFT
  const stakedNFTs = nftItems.filter(item => item.isStaked);
  
  // 格式化日期
  const formatDate = (date?: Date) => {
    return date ? format(date, 'yyyy-MM-dd HH:mm') : '-';
  };

  // 获取当前时间
  const currentTime = new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>NFT质押管理</DialogTitle>
          <DialogDescription>
            管理您的NFT质押，查看已质押NFT状态或质押新的NFT
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="stake">质押NFT</TabsTrigger>
            <TabsTrigger value="staked">已质押NFT</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stake" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      id="select-all" 
                      checked={isAllSelected && selectableNFTCount > 0}
                      onCheckedChange={handleSelectAll}
                      disabled={selectableNFTCount === 0}
                    />
                  </TableHead>
                  <TableHead>你可质押的NFT</TableHead>
                  <TableHead>奖励总额（XAA）</TableHead>
                  <TableHead>每日奖励（XAA）</TableHead>
                  <TableHead>IAO额外收益</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nftItems.filter(item => !item.isStaked).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox 
                        id={`nft-${item.id}`}
                        checked={selectedNFTs.includes(item.id)}
                        onCheckedChange={(checked) => 
                          handleNFTSelect(item.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className={`w-8 h-8 rounded-md mr-3 ${
                          item.id === 1 ? "bg-blue-100" : 
                          item.id === 2 ? "bg-purple-100" : "bg-red-100"
                        }`}>
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="object-cover" 
                          />
                        </Avatar>
                        <span>{item.name} ({item.count}个)</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.totalReward * item.count} XAA</TableCell>
                    <TableCell>{item.dailyReward * item.count} XAA/天</TableCell>
                    <TableCell>+{item.iaoExtraPercentage}%</TableCell>
                  </TableRow>
                ))}
                <div className="h-64">
                {nftItems.filter(item => !item.isStaked).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      暂无可质押的NFT
                    </TableCell>
                  </TableRow>
                )}
                </div>
      
              </TableBody>
            </Table>

            <div className="bg-muted/20 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>已选择:</span>
                <span>{selectedNFTs.length} 个 NFT</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>总每日奖励:</span>
                <span className="text-primary">{totalDailyReward} XAA</span>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                取消
              </Button>
              <Button
                variant="colored"
                onClick={handleBatchStake}
                disabled={selectedNFTs.length === 0 || isStaking}
                className="w-full sm:w-auto"
              >
                {isStaking ? "处理中..." : "确认质押"}
              </Button>
            </DialogFooter>
          </TabsContent>
          
          <TabsContent value="staked" className="space-y-4 ">
            

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>你已质押的NFT</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead>奖励总额（XAA）</TableHead>
                  <TableHead>每日奖励（XAA）</TableHead>
                  <TableHead>已领取奖励（XAA）</TableHead>
                  <TableHead>起始时间</TableHead>
                  <TableHead>当前时间</TableHead>
                  <TableHead>质押到期时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stakedNFTs.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className={`w-8 h-8 rounded-md mr-3 ${
                          item.id === 1 ? "bg-blue-100" : 
                          item.id === 2 ? "bg-purple-100" : "bg-red-100"
                        }`}>
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="object-cover" 
                          />
                        </Avatar>
                        <span>{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.count}个</TableCell>
                    <TableCell>{item.totalReward * item.count} XAA</TableCell>
                    <TableCell>{item.dailyReward * item.count} XAA/天</TableCell>
                    <TableCell>{item.receivedReward || 0} XAA</TableCell>
                    <TableCell>{formatDate(item.stakeStartTime)}</TableCell>
                    <TableCell>{formatDate(currentTime)}</TableCell>
                    <TableCell>{formatDate(item.stakeEndTime)}</TableCell>
                  </TableRow>
                ))}
                <div className="h-64">
                {stakedNFTs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      暂无已质押的NFT
                    </TableCell>
                  </TableRow>
                )}
                </div>
             
              </TableBody>
            </Table>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                关闭
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 