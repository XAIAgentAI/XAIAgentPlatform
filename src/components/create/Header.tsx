import React from 'react';
import { useLocale, useTranslations } from 'next-intl';

const Header: React.FC = () => {
  const t = useTranslations("create");
  const locale = useLocale();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full rounded-xl text-card-foreground shadow p-6 bg-card">
        <h1 className="text-2xl font-semibold mb-6 pb-4 border-b border-border-dark">{t("title")}</h1>
        
        {/* Token Creation Requirements */}
        <div className="space-y-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-primary">1.</span>{t("requirements.title")}
            </h2>
            <div className="text-sm text-muted-foreground pl-5 space-y-3">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>{t("requirements.supply")}</strong></li>
                <li><strong>{t("requirements.iao")}</strong></li>
                <li className="space-y-1">
                  <strong>{t("requirements.iaoAllocation.title")}</strong> 
                  <ul className="list-disc pl-5">
                    <li>{t("requirements.iaoAllocation.pool")}</li>
                    <li>{t("requirements.iaoAllocation.burn")}</li>
                  </ul>
                </li>
                <li><strong>{t("requirements.liquidity")}</strong></li>
                <li><strong>{t("requirements.team")}</strong></li>
                <li className="space-y-1">
                  <strong>{t("requirements.mining.title")}</strong> 
                  <ul className="list-disc pl-5">
                    <li>{t("requirements.mining.output")}</li>
                    <li>{t("requirements.mining.unlock")}</li>
                    <li>{t("requirements.mining.requirement")}</li>
                  </ul>
                </li>
                <li className="space-y-1">
                  <strong>{t("requirements.airdrop.title")}</strong> 
                  <ul className="list-disc pl-5">
                    <li>{t("requirements.airdrop.holders")}</li>
                    <li>{t("requirements.airdrop.nft")}</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>

          {/* Creation Process */}
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-primary">2.</span>{t("process.title")}
            </h2>
            <div className="text-sm space-y-3 p-4 bg-card-inner rounded-lg pl-4 lg:pl-12">
              <h3 className="font-medium">1. {t("process.title")}</h3>
              <div className="space-y-2 mt-2">
                <div className="flex items-start">
                  <span className="text-muted-foreground pr-2 min-w-[60px]">{t("process.steps.name")}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-muted-foreground pr-2 min-w-[60px]">{t("process.steps.description")}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-muted-foreground pr-2 min-w-[60px]">{t("process.steps.examples")}</span>
                </div>
              </div>
              <h3 className="font-medium">2. {t("process.title2")}</h3>
                <div className="flex items-start">
                  <span className="text-muted-foreground pr-1">{t("process.href")}</span>
                  <a className="text-primary pr-1 cursor-pointer" href={`/${locale}/chat`}>chat</a>
                  <span className="text-muted-foreground pr-1 min-w-[60px]">{t("process.hrefc")}</span>
                </div>
            </div>
          </div>

          {/* IAO Settings */}
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-primary">3.</span>{t("iao.title")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-sm p-4 bg-card-inner rounded-lg">
                <h3 className="font-medium mb-2">{t("iao.time.title")}</h3>
                <div className="space-y-1">
                  <p>{t("iao.time.duration")}</p>
                  <p>{t("iao.time.start")}</p>
                </div>
              </div>
              <div className="text-sm p-4 bg-card-inner rounded-lg">
                <h3 className="font-medium mb-2">{t("iao.mining.title")}</h3>
                <div className="space-y-1">
                  <p>{t("iao.mining.gpu")}</p>
                  <p>{t("iao.mining.container")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Example Section */}
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-primary">4.</span>{t("examples.title")}
            </h2>
            <div className="space-y-4">
              <div className="text-sm p-4 bg-card-inner rounded-lg">
                <p className="font-medium">{t("examples.user")}</p>
                <p>{t("examples.example1.user")}</p>
                <p className="font-medium mt-2">{t("examples.ai")}</p>
                <p>{t("examples.example1.ai")}</p>
              </div>
              <div className="text-sm p-4 bg-card-inner rounded-lg">
                <p className="font-medium">{t("examples.user")}</p>
                <p>{t("examples.example2.user")}</p>
                <p className="font-medium mt-2">{t("examples.ai")}</p>
                <p>{t("examples.example2.ai")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;