import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useLocale, useTranslations } from 'next-intl';
import { agentAPI } from '@/services/api';
import { LocalAgent } from '@/types/agent';

interface ConversationExamplesModalProps {
  agent: LocalAgent;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ConversationExamplesModal({ agent, isOpen, onClose, onUpdate }: ConversationExamplesModalProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [isSaving, setIsSaving] = useState(false);

  // 对话示例状态
  const [examples, setExamples] = useState<{
    en: string[];
    ja: string[];
    ko: string[];
    zh: string[];
  }>({
    en: [],
    ja: [],
    ko: [],
    zh: []
  });

  // 当前语言的示例
  const currentLangExamples = examples[locale as keyof typeof examples] || [];
  
  // 加载对话示例
  useEffect(() => {
    if (agent && isOpen) {
      const loadExamples = () => {
        try {
          // 尝试解析当前的用例
          const enUseCases = typeof agent.useCases === 'string' 
            ? JSON.parse(agent.useCases || '[]') 
            : (agent.useCases || []);
          
          const jaUseCases = typeof agent.useCasesJA === 'string' 
            ? JSON.parse(agent.useCasesJA || '[]') 
            : (agent.useCasesJA || []);
          
          const koUseCases = typeof agent.useCasesKO === 'string' 
            ? JSON.parse(agent.useCasesKO || '[]') 
            : (agent.useCasesKO || []);
          
          const zhUseCases = typeof agent.useCasesZH === 'string' 
            ? JSON.parse(agent.useCasesZH || '[]') 
            : (agent.useCasesZH || []);
          
          setExamples({
            en: Array.isArray(enUseCases) ? enUseCases.slice(0, 3) : [],
            ja: Array.isArray(jaUseCases) ? jaUseCases.slice(0, 3) : [],
            ko: Array.isArray(koUseCases) ? koUseCases.slice(0, 3) : [],
            zh: Array.isArray(zhUseCases) ? zhUseCases.slice(0, 3) : []
          });
        } catch (err) {
          console.error('Failed to parse use cases:', err);
          // 如果解析失败，设置为空数组
          setExamples({
            en: [],
            ja: [],
            ko: [],
            zh: []
          });
        }
      };

      loadExamples();
    }
  }, [agent, isOpen]);

  // 更新示例
  const handleExampleChange = (index: number, value: string) => {
    setExamples(prev => {
      const newArray = [...(prev[locale as keyof typeof prev] || [])];
      newArray[index] = value;
      
      return {
        ...prev,
        [locale]: newArray
      };
    });
  };

  // 保存示例
  const handleSaveExamples = async () => {
    if (!agent?.id) return;
    
    setIsSaving(true);
    try {
      // 确保每种语言都有三个示例
      const finalExamples = {
        en: examples.en.length ? examples.en.slice(0, 3) : Array(3).fill(''),
        ja: examples.ja.length ? examples.ja.slice(0, 3) : Array(3).fill(''),
        ko: examples.ko.length ? examples.ko.slice(0, 3) : Array(3).fill(''),
        zh: examples.zh.length ? examples.zh.slice(0, 3) : Array(3).fill(''),
      };

      // 更新API
      const response = await agentAPI.updateAgent(agent.id, {
        name: agent.name,
        description: agent.description,
        category: agent.category,
        capabilities: typeof agent.capabilities === 'string' 
          ? JSON.parse(agent.capabilities) 
          : agent.capabilities,
        // 使用 as any 绕过类型检查，因为API支持这些字段但类型定义未更新
        useCases: JSON.stringify(finalExamples.en),
        useCasesJA: JSON.stringify(finalExamples.ja),
        useCasesKO: JSON.stringify(finalExamples.ko),
        useCasesZH: JSON.stringify(finalExamples.zh)
      } as any);

      if (response.code === 200) {
        toast({
          description: t('messages.updateSuccess'),
        });
        // 通知父组件更新
        onUpdate();
        onClose();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('更新对话示例失败:', error);
      toast({
        description: t('messages.updateFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getLocaleTitle = () => {
    switch(locale) {
      case 'zh': return '中文示例';
      case 'ja': return '日本語の例';
      case 'ko': return '한국어 예시';
      default: return 'English Examples';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('agent.editPromptExamples')}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="text-lg font-medium mb-4">{getLocaleTitle()}</h3>
          
          <div className="space-y-4">
            {[0, 1, 2].map((index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white font-bold mr-2">
                    {index + 1}
                  </div>
                  <label className="text-sm font-medium">
                    {t('agent.examplePrompt')} {index + 1}
                  </label>
                </div>
                
                <textarea
                  value={currentLangExamples[index] || ''}
                  onChange={(e) => handleExampleChange(index, e.target.value)}
                  className="w-full bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg h-16 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                  placeholder={t('agent.examplePlaceholder')}
                />
              </div>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground mt-4">
            {t('agent.examplesUpdateNotice')}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSaveExamples}
            disabled={isSaving}
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 