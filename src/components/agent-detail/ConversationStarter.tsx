import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CustomButton } from "@/components/ui-custom/custom-button";
import Image from "next/image";
import { toast } from "../ui/use-toast";
import { useLocale, useTranslations } from 'next-intl';
import { agentAPI } from "@/services/api";
import { LocalAgent } from "@/types/agent";

export default function ConversationStarter({ agentId }: { agentId: string }) {
  const t = useTranslations();
  const [agent, setAgent] = useState<LocalAgent | null>(null);
  const [loading, setLoading] = useState(true);

  const locale = useLocale();


  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const data = await agentAPI.getAgentById(Number(agentId));
        setAgent(data);
      } catch (error) {
        console.error('Failed to fetch agent:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [agentId]);

  if (loading) {
    return <div className="animate-pulse h-32 bg-card-inner rounded-lg"></div>;
  }

  if (!agent) {
    return null;
  }


  // 根据当前语言获取对应的用例
  const getLocalizedUseCases = () => {
    if (!agent) return [];
    switch (locale) {
      case 'ja':
        return agent.useCasesJA || agent.useCases;
      case 'ko':
        return agent.useCasesKO || agent.useCases;
      case 'zh':
        return agent.useCasesZH || agent.useCases;
      default:
        return agent.useCases;
    }
  };

  const suggestions = getLocalizedUseCases();
  const chatEntry = agentId;

  if (!suggestions) {
    return null;
  }

  return (
    <Card className="p-6 bg-card">
      <h2 className="text-lg font-semibold mb-4">{t('conversationStarter')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-50">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="p-4 bg-card-inner rounded-lg text-sm text-secondary hover:bg-card-inner-hover cursor-pointer transition-colors"
          >
            {suggestion}
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <CustomButton 
          className="flex items-center gap-2 px-8"
          onClick={() => {
            //if (chatEntry && chatEntry.trim() !== "None") {
              //window.open(`/zh/chat/${chatEntry}`, "_blank");
            //} else {
              toast({
                description: t('chatComingSoon'),
              })
            //}
          }}
        >
          <Image 
            src="/images/chat.svg" 
            alt={t('accessibility.chatIcon')} 
            width={12} 
            height={12} 
            aria-hidden="true"
          />
          {t('chat')}
        </CustomButton>
      </div>
    </Card>
  );
} 