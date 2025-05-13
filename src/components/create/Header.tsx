import React, { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

const Header: React.FC = () => {
  const t = useTranslations("create");
  const m = useTranslations("createAgent");
  const [warn,setWarn] = useState<boolean>(false);
  const { open } = useAppKit();
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isManualConnecting, setIsManualConnecting] = useState(false);
  const { address, isConnected, status } = useAppKitAccount();
  const [connectingTimeout, setConnectingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);
  const { isAuthenticated, isLoading, error, authenticate } = useAuth()
  const locale = useLocale();
  const CheckWallet = (e:React.MouseEvent) => {
    e.preventDefault();
    if(localStorage.getItem("@appkit/connection_status")==="connected"){
      window.open(`/${locale}/chat/create`);
    } else {
      handleWalletClick();
    }
  }

    useEffect(() => {
      // 只要有地址就认为已连接
      if (address) {
        if (connectingTimeout) {
          clearTimeout(connectingTimeout);
          setConnectingTimeout(null);
        }
        setIsTimeout(false);
        setIsManualConnecting(false);
        authenticate();
      }
    }, [address, connectingTimeout, authenticate]);
  
    const handleWalletClick = () => {
      // 使用 address 判断是否已连接
      if (address) {
        open({ view: 'Account' });
      } else {
        // 如果当前状态是connecting，先重置状态
        if (status === 'connecting') {
          if (connectingTimeout) {
            clearTimeout(connectingTimeout);
            setConnectingTimeout(null);
          }
          setIsTimeout(false);
        }
        setIsManualConnecting(true);
        open({ view: 'Connect' });
      }
      setIsMenuOpen(false);
    }

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
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((point) => (
                    <li key={point}>
                        {point}. {m(`TokenDistribution.points.${point}`, { symbol:"$XXX" })}
                    </li>
                    ))}
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
                  <a className="text-primary pr-1 cursor-pointer underline" href={`/${locale}/chat/create`} onClick={(e)=>{CheckWallet(e)}} target="_blank">create</a>
                  <span className="text-muted-foreground pr-1 min-w-[60px]">{t("process.hrefc")}</span>
                </div>
                {warn && 
                  <div className="text-muted-foreground w-[96%] bg-card rounded-sm h-[1.8em] flex flex-col justify-center pl-2">
                    {t("process.error")}
                  </div>
                }
            </div>
          </div>

          {/* IAO Settings */}
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-primary">3.</span>{t("iao.title")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-sm p-4 bg-card-inner rounded-lg">
                <h3 className="font-medium mb-2">{t("time_setting_requirements.title")}</h3>
                <div className="space-y-1">
                  <p>{t("time_setting_requirements.description")}</p>
                  <p>{t("time_setting_requirements.example")}</p>
                </div>
              </div>
              <div className="text-sm p-4 bg-card-inner rounded-lg">
                <h3 className="font-medium mb-2">{t("runtime_duration_range.title")}</h3>
                <div className="space-y-1">
                  <p>{t("runtime_duration_range.description")}</p>
                  <p>{t("runtime_duration_range.note")}</p>
                </div>
              </div>
              <div className="text-sm p-4 bg-card-inner rounded-lg">
                <h3 className="font-medium mb-2">{t("start_time_restrictions.title")}</h3>
                <div className="space-y-1">
                  <p>{t("start_time_restrictions.description")}</p>
                  <p>{t("start_time_restrictions.note")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mining Requirements */}
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-primary">4.</span>{t("mining_requirements.title")}
            </h2>
            <div className="text-sm p-4 bg-card-inner rounded-lg">
              <h3 className="font-semibold mb-2">{t("mining_requirements.ai_model_environment.title")}</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t("mining_requirements.ai_model_environment.point1")}</li>
                <li>{t("mining_requirements.ai_model_environment.point2")}</li>
                <li>{t("mining_requirements.ai_model_environment.point3")}</li>
                <li>{t("mining_requirements.ai_model_environment.point4")}</li>
              </ul> 
            </div>
          </div>

          {/* Example Section */}
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-primary">5.</span>{t("examples.title")}
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