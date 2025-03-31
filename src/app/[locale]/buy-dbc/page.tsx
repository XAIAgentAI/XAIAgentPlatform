'use client';

import { Card } from "@/components/ui/card";
import { useTranslations } from 'next-intl';

export default function BuyDbcPage() {
  const t = useTranslations('buy-dbc');

  const renderStep1 = () => {
    return (
      <p className="text-sm text-muted-foreground pl-5">
        {t('step1.description.prefix')}{' '}
        <a 
          href="https://www.gate.io/trade/DBC_USDT" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Gate.io
        </a>
        {' '}{t('step1.description.suffix')}
      </p>
    );
  };

  const renderStep2 = () => {
    return (
      <p className="text-sm text-muted-foreground pl-5">
        {t('step2.description.prefix')}{' '}
        <a 
          href="https://metamask.io/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          MetaMask
        </a>
        、
        <a 
          href="https://imtoken.io/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          ImToken
        </a>
        {' '}{t('step2.description.middle')}{' '}
        <a 
          href="https://tokenpocket.net/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          TokenPocket
        </a>
        {' '}{t('step2.description.suffix')}
      </p>
    );
  };

  const renderStep4 = () => {
    return (
      <p className="text-sm text-muted-foreground pl-5">
        {t('step4.description.prefix')}{' '}
        <span className="font-bold">DBC EVM</span>
        {' '}{t('step4.description.suffix')}
      </p>
    );
  };

  return (
    <div className="container mx-auto px-4 py-2 flex justify-center">
      <div className="flex justify-center">
        <Card className="p-6 bg-card max-w-3xl">
          <h1 className="text-2xl font-semibold mb-6 pb-4 border-b border-border-dark">
            {t('title')}
          </h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">1.</span>
                {t('step1.title')}
              </h2>
              {renderStep1()}
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">2.</span>
                {t('step2.title')}
              </h2>
              {renderStep2()}
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">3.</span>
                {t('step3.title')}
              </h2>
              <div className="space-y-3 text-sm p-4 bg-card-inner rounded-lg pl-4 lg:pl-12">
                <div className="flex items-center">
                  <p className="text-muted-foreground pr-4 min-w-[120px]">{t('step3.networkName')}</p>
                  <p className="font-medium">{t('step3.networkNameValue')}</p>
                </div>
                <div className="flex items-center">
                  <p className="text-muted-foreground pr-4 min-w-[120px]">{t('step3.chainRPC')}</p>
                  <a 
                    href="https://rpc2.dbcwallet.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    https://rpc2.dbcwallet.io
                  </a>
                </div>
                <div className="flex items-center">
                  <p className="text-muted-foreground pr-4 min-w-[120px]">{t('step3.chainID')}</p>
                  <p className="font-medium">{t('step3.chainIDValue')}</p>
                </div>
                <div className="flex items-center">
                  <p className="text-muted-foreground pr-4 min-w-[120px]">{t('step3.currencySymbol')}</p>
                  <p className="font-medium">{t('step3.currencySymbolValue')}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">4.</span>
                {t('step4.title')}
              </h2>
              {renderStep4()}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 