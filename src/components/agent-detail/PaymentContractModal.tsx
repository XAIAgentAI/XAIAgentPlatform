'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentContractModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  tokenAddress: string;
  ownerAddress: string;
  onSuccess?: () => void;
}

export const PaymentContractModal = ({
  isOpen,
  onOpenChange,
  agentId,
  tokenAddress,
  ownerAddress,
  onSuccess
}: PaymentContractModalProps) => {
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [paymentParams, setPaymentParams] = useState({
    address_free_request_count: 10,
    free_request_count: 100,
    min_usd_balance_for_using_free_request: 100000,
    owner: "",
    payment_token: "",
    vip_monthly_quotas: 10,
    vip_price_fixed_count: 100000,
    vip_price_monthly: 100000
  });

  // 更新支付合约参数中的owner和payment_token
  useEffect(() => {
    setPaymentParams(prev => ({
      ...prev,
      owner: ownerAddress,
      payment_token: tokenAddress || ""
    }));
  }, [ownerAddress, tokenAddress]);

  // 处理支付参数变更
  const handlePaymentParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentParams(prev => ({
      ...prev,
      [name]: name === 'owner' || name === 'payment_token' ? value : Number(value)
    }));
  };

  // 部署支付合约
  const handleDeployPaymentContract = async () => {
    if (!tokenAddress) {
      toast({
        title: "错误",
        description: "Token地址不能为空",
      });
      return;
    }

    try {
      setIsDeploying(true);
      
      // 确保payment_token已设置为token地址
      const finalParams = {
        ...paymentParams,
        payment_token: tokenAddress
      };

      // 调用API部署支付合约
      const response = await fetch("http://3.0.25.131:8070/deploy/payment", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify(finalParams)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "成功",
          description: "支付合约部署成功",
        });
        
        // 关闭模态框
        onOpenChange(false);
        
        // 可以选择保存支付合约地址到数据库
        if (data.data?.proxy_address) {
          try {
            await fetch(`/api/agents/${agentId}/payment-contract`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify({
                paymentContractAddress: data.data.proxy_address
              }),
            });
            
            // 调用成功回调
            if (onSuccess) {
              onSuccess();
            }
          } catch (err) {
            console.error('Failed to save payment contract address:', err);
          }
        }
      } else {
        throw new Error(data.message || "部署支付合约失败");
      }
    } catch (error: any) {
      console.error('Deploy payment contract failed:', error);
      toast({
        title: "错误",
        description: error.message || "部署支付合约失败",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>部署支付合约</DialogTitle>
          <DialogDescription>
            设置支付合约参数，部署后将与当前Token关联
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="owner" className="text-right">
              所有者地址
            </Label>
            <Input
              id="owner"
              name="owner"
              value={paymentParams.owner}
              onChange={handlePaymentParamChange}
              className="col-span-3"
              disabled
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment_token" className="text-right">
              支付Token
            </Label>
            <Input
              id="payment_token"
              name="payment_token"
              value={paymentParams.payment_token}
              onChange={handlePaymentParamChange}
              className="col-span-3"
              disabled
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address_free_request_count" className="text-right">
              地址免费请求数
            </Label>
            <Input
              id="address_free_request_count"
              name="address_free_request_count"
              type="number"
              value={paymentParams.address_free_request_count}
              onChange={handlePaymentParamChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="free_request_count" className="text-right">
              免费请求数
            </Label>
            <Input
              id="free_request_count"
              name="free_request_count"
              type="number"
              value={paymentParams.free_request_count}
              onChange={handlePaymentParamChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="min_usd_balance_for_using_free_request" className="text-right">
              最低USD余额
            </Label>
            <Input
              id="min_usd_balance_for_using_free_request"
              name="min_usd_balance_for_using_free_request"
              type="number"
              value={paymentParams.min_usd_balance_for_using_free_request}
              onChange={handlePaymentParamChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vip_monthly_quotas" className="text-right">
              VIP月配额
            </Label>
            <Input
              id="vip_monthly_quotas"
              name="vip_monthly_quotas"
              type="number"
              value={paymentParams.vip_monthly_quotas}
              onChange={handlePaymentParamChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vip_price_fixed_count" className="text-right">
              VIP固定价格
            </Label>
            <Input
              id="vip_price_fixed_count"
              name="vip_price_fixed_count"
              type="number"
              value={paymentParams.vip_price_fixed_count}
              onChange={handlePaymentParamChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vip_price_monthly" className="text-right">
              VIP月价格
            </Label>
            <Input
              id="vip_price_monthly"
              name="vip_price_monthly"
              type="number"
              value={paymentParams.vip_price_monthly}
              onChange={handlePaymentParamChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDeploying}
          >
            取消
          </Button>
          <Button 
            onClick={handleDeployPaymentContract}
            disabled={isDeploying || !paymentParams.payment_token}
          >
            {isDeploying ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                部署中...
              </div>
            ) : (
              "部署合约"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 