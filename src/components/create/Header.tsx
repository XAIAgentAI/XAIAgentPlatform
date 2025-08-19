import React from 'react';
import { useTranslations } from 'next-intl';
import { TokenDistributionInfo } from '@/components/ui-custom/token-distribution-info';

const Header: React.FC = () => {
  const t = useTranslations("create");
  const m = useTranslations("create.createAgent");


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
              <TokenDistributionInfo 
                symbol="$XXX" 
                hours={72} 
                textSize="sm"
                className="pl-5"
              />
            </div>
          </div>

          {/* IAO说明 */}
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-primary">2.</span>{t("iaoDescription.title")}
            </h2>
            <div className="text-sm text-muted-foreground pl-5 space-y-3">
              <ul className="list-disc pl-5 space-y-2">
                <ol>
                  1. {t("iaoDescription.point1")}
                </ol>
                <ol>
                  2. {t("iaoDescription.point2")}
                </ol>
                <ol>
                  3. {t("iaoDescription.point3")}
                </ol>
                <ol>
                  4. {t("iaoDescription.point4")}
                </ol>
                <ol>
                  5. {t("iaoDescription.point5")}
                </ol>
              </ul>
            </div>
          </div>

          {/* 去中心化AI模型服务说明 */}
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-primary">3.</span>{t("decentralizedAI.title")}
            </h2>
            <div className="text-sm text-muted-foreground pl-5 space-y-3">
              <ul className="list-disc pl-5 space-y-2">
                <ol>
                  {t("decentralizedAI.intro")}
                </ol>
                <ol>
                  1. <strong>{t("decentralizedAI.point1.title")}</strong><br />
                  
                  {t("decentralizedAI.point1.content")}
                </ol>
                <ol>
                  2. <strong>{t("decentralizedAI.point2.title")}</strong><br />{t("decentralizedAI.point2.content")}
                </ol>
                <ol>
                  3. <strong>{t("decentralizedAI.point3.title")}</strong><br />{t("decentralizedAI.point3.content")}
                </ol>
                <ol>
                  4. <strong>{t("decentralizedAI.point4.title")}</strong><br />{t("decentralizedAI.point4.content")}
                </ol>
                <ol>
                  5. <strong>{t("decentralizedAI.point5.title")}</strong><br />{t("decentralizedAI.point5.content")}
                </ol>
              </ul>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Header;