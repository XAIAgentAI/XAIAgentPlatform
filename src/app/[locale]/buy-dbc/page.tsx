'use client';

import { Card } from "@/components/ui/card";
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export default function BuyDbcPage() {
  const t = useTranslations('buy-dbc');

  return (
    <div className="container mx-auto px-4 py-2 flex justify-center">
      <div className="flex justify-center">
        <Card className="p-6 bg-card max-w-3xl">
          <h1 className="text-2xl font-semibold mb-6 pb-4 border-b border-border-dark">{t('title')}</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">1.</span>
                {t('step1.title')}
              </h2>
              <p className="text-sm text-muted-foreground pl-5">
                {t.rich('step1.description', {
                  link: (chunks: ReactNode) => (
                    <a href="https://www.gate.io/trade/DBC_USDT" target="_blank" className="text-primary">
                      Gate.io
                    </a>
                  )
                })}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">2.</span>
                {t('step2.title')}
              </h2>
              <p className="text-sm text-muted-foreground pl-5">
                {t.rich('step2.description', {
                  metamask: (chunks: ReactNode) => (
                    <a href="https://metamask.io/" target="_blank" className="text-primary">MetaMask</a>
                  ),
                  imtoken: (chunks: ReactNode) => (
                    <a href="https://imtoken.io/" target="_blank" className="text-primary">ImToken</a>
                  ),
                  tokenpocket: (chunks: ReactNode) => (
                    <a href="https://tokenpocket.net/" target="_blank" className="text-primary">TokenPocket</a>
                  )
                })}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">3.</span>
                {t('step3.title')}
              </h2>
              <div className="space-y-3 text-sm p-4 bg-card-inner rounded-lg pl-4 lg:pl-12">
                <div className="flex items-center">
                  <p className="text-muted-foreground pr-4">{t('step3.networkName')}</p>
                  <p className="font-medium">{t('step3.networkNameValue')}</p>
                </div>
                <div className="flex items-center">
                  <p className="text-muted-foreground pr-4">{t('step3.chainRPC')}</p>
                  <a href="https://rpc.dbcwallet.io" target="_blank" className="font-medium text-primary">https://rpc.dbcwallet.io</a>
                </div>
                <div className="flex items-center">
                  <p className="text-muted-foreground pr-4">{t('step3.chainID')}</p>
                  <p className="font-medium">{t('step3.chainIDValue')}</p>
                </div>
                <div className="flex items-center">
                  <p className="text-muted-foreground pr-4">{t('step3.currencySymbol')}</p>
                  <p className="font-medium">{t('step3.currencySymbolValue')}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">4.</span>
                {t('step4.title')}
              </h2>
              <p className="text-sm text-muted-foreground pl-5">
                {t.rich('step4.description', {
                  network: (chunks: ReactNode) => (
                    <span className="font-bold">DBC EVM</span>
                  )
                })}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 