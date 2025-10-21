import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CustomButton } from "@/components/ui-custom/custom-button";
import Image from "next/image";
import { toast } from "../ui/use-toast";
import { useLocale, useTranslations } from 'next-intl';
import { agentAPI } from "@/services/api";
import { LocalAgent } from "@/types/agent";
import { Edit, MessageCircle } from "lucide-react";
import { useAppKitAccount } from '@reown/appkit/react';
import { useRouter } from 'next/navigation';
import { ConversationExamplesModal } from "./ConversationExamplesModal";

interface ConversationStarterProps {
  agent: LocalAgent;
  onRefreshAgent?: () => Promise<void>;
}

export default function ConversationStarter({ agent, onRefreshAgent }: ConversationStarterProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { address } = useAppKitAccount();
  const [isExamplesModalOpen, setIsExamplesModalOpen] = useState(false);
  // 添加本地状态管理
  const [localAgent, setLocalAgent] = useState<LocalAgent>(agent);

  // 初始化和更新时同步props到本地状态
  useEffect(() => {
    setLocalAgent(agent);
  }, [agent]);

  // 检查是否为创建者
  const isAgentCreator = address && (localAgent as any)?.creator?.address &&
    address.toLowerCase() === (localAgent as any).creator.address.toLowerCase();

  // 处理编辑提示词
  const handleEditPrompt = () => {
    setIsExamplesModalOpen(true);
  };

  if (!localAgent) {
    return null;
  }

  // 根据当前语言获取对应的用例
  const getLocalizedUseCases = () => {
    console.log("localAgent11", localAgent);
    if (!localAgent) return [];
    let useCases: string[] | string | undefined;

    switch (locale) {
      case 'ja':
        useCases = localAgent.useCasesJA || localAgent.useCases;
        break;
      case 'ko':
        useCases = localAgent.useCasesKO || localAgent.useCases;
        break;
      case 'zh':
        useCases = localAgent.useCasesZH || localAgent.useCases;
        break;
      default:
        useCases = localAgent.useCases;
    }

    // 如果是 undefined 或 null，返回空数组
    if (!useCases) return [];

    // 如果已经是数组，直接返回
    if (Array.isArray(useCases)) return useCases;

    // 如果是字符串，尝试解析 JSON
    if (typeof useCases === 'string') {
      try {
        const parsed = JSON.parse(useCases);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to parse useCases:', e);
        return [];
      }
    }

    return [];
  };

  const suggestions = getLocalizedUseCases();
  
  // 处理聊天按钮点击
  const handleChatClick = () => {
    if (localAgent.symbol === "STID") {
      window.open(`/${locale}/chat/StyleID`, '_blank');
    } else if (localAgent.symbol === "SIC") {
      window.open('https://app.superimage.ai', '_blank');
    } else if (localAgent.symbol === "DLC") {
      window.open('https://www.deeplink.cloud/software', '_blank');
    } else if (localAgent.symbol === "LOGO") {
      window.open(`/${locale}/chat/LogoLift`, '_blank');
    }
  };

  // 处理suggestion点击
  const handleSuggestionClick = (suggestion: string) => {
      let agentPath
      if (localAgent.symbol === "STID") {
        agentPath = 'StyleID'
      } else if (localAgent.symbol === "LOGO") {
        agentPath = 'LogoLift'
      }
      window.open(`/${locale}/chat/${agentPath}?prompt=${suggestion}`, '_blank')
  }

  // 如果没有对话示例且不是创建者，则显示简化版的聊天按钮
  if (!suggestions.length && !isAgentCreator) {
    return (
      <div className="flex justify-center" style={{ marginTop: '1.5rem' }}>
        <CustomButton
          className="flex items-center gap-2 px-8"
          onClick={handleChatClick}
        >
          <Image
            src="/images/chat.svg"
            alt={t('agent.accessibility.chatIcon')}
            width={12}
            height={12}
            aria-hidden="true"
          />
          {t('agent.chat')}
        </CustomButton>
      </div>
    );
  }

  return (
    <>
      <Card className="p-6 bg-card" style={{
        marginTop: 16
      }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('agent.conversationStarter')}</h2>
          {isAgentCreator && (
            <button
              onClick={handleEditPrompt}
              className="flex items-center gap-1 px-3 py-1 text-xs text-primary hover:text-primary/80 border border-primary/20 hover:border-primary/40 rounded-md transition-colors"
              title={t('agent.editPromptExamples')}
            >
              <Edit size={12} />
              {t('agent.editPromptExamples')}
            </button>
          )}
        </div>
        
        {suggestions.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {suggestions.map((suggestion: string, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-card-inner rounded-lg text-sm text-secondary hover:bg-card-inner-hover cursor-pointer transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
            
            <div className="flex justify-center" style={{ marginTop: '1.5rem' }}>
              <CustomButton
                className="flex items-center gap-2 px-8"
                onClick={handleChatClick}
              >
                <Image
                  src="/images/chat.svg"
                  alt={t('agent.accessibility.chatIcon')}
                  width={12}
                  height={12}
                  aria-hidden="true"
                />
                {t('agent.chat')}
              </CustomButton>
            </div>
          </>
        ) : isAgentCreator ? (
          <div className="text-center py-6">
            <div className="text-muted-foreground mb-6">
              <p>{t('agent.noExamplesYet')}</p>
              <p className="text-sm mt-2">{t('agent.clickEditToAdd')}</p>
            </div>
            
            <CustomButton
              className="flex items-center gap-2 px-8 mx-auto"
              onClick={handleChatClick}
            >
              <Image
                src="/images/chat.svg"
                alt={t('agent.accessibility.chatIcon')}
                width={12}
                height={12}
                aria-hidden="true"
              />
              {t('agent.chat')}
            </CustomButton>
          </div>
        ) : null}
      </Card>

      {/* 对话示例编辑Modal */}
      <ConversationExamplesModal 
        agent={localAgent} 
        isOpen={isExamplesModalOpen} 
        onClose={() => setIsExamplesModalOpen(false)}
        onUpdate={(updatedAgent) => {
          // 更新本地状态
          if (updatedAgent) {
            setLocalAgent(updatedAgent);
          }
          // 同时通知父组件更新（如果需要）
          if (onRefreshAgent) {
            onRefreshAgent();
          }
        }}
      />
    </>
  );
} 