import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CustomButton } from "@/components/ui-custom/custom-button";
import Image from "next/image";
import { toast } from "../ui/use-toast";
import { useLocale, useTranslations } from 'next-intl';
import { agentAPI } from "@/services/api";
import { LocalAgent } from "@/types/agent";
import { MessageSquare } from "lucide-react";

export default function ConversationStarter({ agent }: { agent: LocalAgent }) {
  const t = useTranslations();

  const locale = useLocale();

  console.log("agent", agent);

  if (!agent) {
    return null;
  }

  // 根据当前语言获取对应的用例
  const getLocalizedUseCases = () => {
    if (!agent) return [];
    let useCases: string[] | string | undefined;

    switch (locale) {
      case 'ja':
        useCases = agent.useCasesJA || agent.useCases;
        break;
      case 'ko':
        useCases = agent.useCasesKO || agent.useCases;
        break;
      case 'zh':
        useCases = agent.useCasesZH || agent.useCases;
        break;
      default:
        useCases = agent.useCases;
    }

    // 如果是 undefined，返回空数组
    if (!useCases) return [];

    // 如果已经是数组，直接返回
    if (Array.isArray(useCases)) return useCases;

    // 如果是字符串，尝试解析 JSON
    if (typeof useCases === 'string') {
      try {
        return JSON.parse(useCases);
      } catch (e) {
        console.error('Failed to parse useCases:', e);
        return [];
      }
    }

    return [];
  };

  const suggestions = getLocalizedUseCases();
  console.log("suggestions", suggestions);

  if (!suggestions) {
    return null;
  }

  return (
    <Card className="p-6 bg-card" style={{
      marginTop: 16
    }}>
      <h2 className="text-lg font-semibold mb-4">{t('agent.conversationStarter')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-50">
        {suggestions.map((suggestion: string, index: number) => (
          <div
            key={index}
            className="p-4 bg-card-inner rounded-lg text-sm text-secondary hover:bg-card-inner-hover cursor-pointer transition-colors"
            onClick={() => { window.open(`/${locale}/chat?prompt=${suggestion}`, '_blank') }}
          >
            {suggestion}
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <CustomButton
          className="flex items-center gap-2 px-8"
          onClick={() => {
            window.open(`/${locale}/chat`)
          }}
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
    </Card>
  );
} 