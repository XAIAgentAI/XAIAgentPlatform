import { useState } from "react";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { agentAPI } from '@/services/api';
import { LocalAgent } from "@/types/agent";

interface DescriptionManagerProps {
  agent: LocalAgent;
  isCreator: boolean;
  getLocalizedDescription: () => string;
  onRefresh: () => void;
}

export function DescriptionManager({ agent, isCreator, getLocalizedDescription, onRefresh }: DescriptionManagerProps) {
  const t = useTranslations('descriptionManager');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [translatedDescription, setTranslatedDescription] = useState<{ zh?: string; en?: string; jp?: string; ko?: string }>({});

  const handleEditDescription = () => {
    setDescriptionInput(getLocalizedDescription() || '');
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    setIsUpdatingDescription(true);
    try {
      // 1. 先调用翻译API
      const res = await fetch('/api/chat/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: descriptionInput,
          targetLanguages: ['zh', 'en', 'ja', 'ko']
        })
      });

      let translationData = {};
      if (res.ok) {
        translationData = await res.json();
        setTranslatedDescription(translationData);
      }

      // 2. 更新Agent，包含翻译后的描述
      const response = await agentAPI.updateAgent(agent.id, {
        name: agent.name,
        description: (translationData as any).en || descriptionInput, // 英文描述作为主描述
        descriptionZH: (translationData as any).zh || descriptionInput,
        descriptionJA: (translationData as any).ja || descriptionInput,
        descriptionKO: (translationData as any).ko || descriptionInput,
        category: agent.category,
        capabilities: typeof agent.capabilities === 'string' ? JSON.parse(agent.capabilities) : agent.capabilities,
      });

      if (response.code === 200) {
        // 更新本地状态
        agent.description = (translationData as any).en || descriptionInput;
        (agent as any).descriptionZH = (translationData as any).zh || descriptionInput;
        (agent as any).descriptionJA = (translationData as any).ja || descriptionInput;
        (agent as any).descriptionKO = (translationData as any).ko || descriptionInput;
        setIsEditingDescription(false);
        toast({
          description: t('updateSuccess'),
        });
        onRefresh();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('更新描述失败:', error);
      toast({
        description: t('updateFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingDescription(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingDescription(false);
    setDescriptionInput('');
  };

  // 如果不是创建者，只显示描述内容
  if (!isCreator) {
    return (
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">{t('description')}</h2>
        {getLocalizedDescription()?.split("\n").map((line: string, index: number) => (
          <p key={index} className="text-sm text-muted-foreground break-words mb-2">
            {line}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6">
      {isEditingDescription ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">{t('description')}</h2>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveDescription}
                disabled={isUpdatingDescription}
                size="sm"
              >
                {isUpdatingDescription ? t('saving') : t('save')}
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                size="sm"
                disabled={isUpdatingDescription}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
          <textarea
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
            className="w-full min-h-[120px] bg-white dark:bg-[#1a1a1a] p-3 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 resize-vertical"
            placeholder={t('placeholder')}
          />
          <div className="text-gray-400 text-sm mt-1">{t('supportNewlines')}</div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">{t('description')}</h2>
            <Button
              onClick={handleEditDescription}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {t('edit')}
            </Button>
          </div>
          <div className="px-0 bg-white dark:bg-[#1a1a1a] rounded-lg ">
            {getLocalizedDescription()?.split("\n").map((line: string, index: number) => (
              <p key={index} className="text-sm text-muted-foreground break-words mb-2 last:mb-0">
                {line || "\u00A0"} {/* 空行显示为不换行空格 */}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}