import { Card } from "@/components/ui/card";
import { CustomButton } from "@/components/ui-custom/custom-button";
import Image from "next/image";
import { toast } from "../ui/use-toast";
import { localAgents } from "@/data/localAgents";
import { useLocale, useTranslations } from 'next-intl';

export function ConversationStarter({ agentId }: { agentId: string }) {
  const agent = localAgents.find((agent) => agent.id === Number(agentId));
  const locale = useLocale();
  const t = useTranslations('agent');

  // 根据当前语言获取对应的用例
  const getLocalizedUseCases = () => {
    if (!agent) return [];
    switch (locale) {
      case 'ja':
        return agent.useCasesJA || agent.useCases;
      case 'ko':
        return agent.useCasesKO || agent.useCases;
      default:
        return agent.useCases;
    }
  };

  const suggestions = getLocalizedUseCases();
  const chatEntry = agent?.chatEntry || "";

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
            if (chatEntry && chatEntry.trim() !== "None") {
              window.open(chatEntry, "_blank");
            } else {
              toast({
                description: t('chatComingSoon'),
              })
            }
          }}
        >
          <Image src="/images/chat.svg" alt="Chatting" width={12} height={12} />
          {t('chat')}
        </CustomButton>
      </div>
    </Card>
  );
} 