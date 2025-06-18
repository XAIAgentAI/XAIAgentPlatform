'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('paymentContract');
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
        title: t('error'),
        description: t('tokenAddressRequired'),
      });
      return;
    }

    try {
      setIsDeploying(true);

      // 调用我们自己的API端点部署支付合约
      const response = await fetch(`/api/agents/${agentId}/deploy-payment-contract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          address_free_request_count: paymentParams.address_free_request_count,
          free_request_count: paymentParams.free_request_count,
          min_usd_balance_for_using_free_request: paymentParams.min_usd_balance_for_using_free_request,
          vip_monthly_quotas: paymentParams.vip_monthly_quotas,
          vip_price_fixed_count: paymentParams.vip_price_fixed_count,
          vip_price_monthly: paymentParams.vip_price_monthly
        })
      });

      const data = await response.json();

      if (response.ok && data.code === 200) {
        toast({
          title: t('success'),
          description: t('deploySuccess'),
        });

        // 关闭模态框
        onOpenChange(false);

        // 调用成功回调
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(data.message || t('deployFailed'));
      }
    } catch (error: any) {
      console.error('Deploy payment contract failed:', error);
      toast({
        title: t('error'),
        description: error.message || t('deployFailed'),
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="owner" className="text-right">
              {t('ownerAddress')}
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
              {t('paymentToken')}
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
              {t('addressFreeRequestCount')}
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
              {t('freeRequestCount')}
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
              {t('minUsdBalance')}
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
              {t('vipMonthlyQuotas')}
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
              {t('vipPriceFixed')}
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
              {t('vipPriceMonthly')}
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
            {t('cancel')}
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
                {t('deploying')}
              </div>
            ) : (
              t('deploy')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 