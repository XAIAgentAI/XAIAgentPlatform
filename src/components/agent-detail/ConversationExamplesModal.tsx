import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useLocale, useTranslations } from 'next-intl';
import { agentAPI } from '@/services/api';
import { LocalAgent } from '@/types/agent';

interface ConversationExamplesModalProps {
  agent: LocalAgent;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedAgent?: LocalAgent) => void;
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
  
  // 生成缓存键
  const getCacheKey = () => {
    return `conversation_examples_${agent?.id || 'draft'}`;
  };

  // 加载对话示例
  useEffect(() => {
    if (agent && isOpen) {
      const loadExamples = () => {
        try {
          // 首先尝试从localStorage加载缓存的数据
          const cachedData = localStorage.getItem(getCacheKey());
          if (cachedData) {
            const parsedCache = JSON.parse(cachedData);
            setExamples(parsedCache);
            return;
          }
          
          // 如果没有缓存数据，则从agent加载
          let enUseCases: string[] = [];
          let jaUseCases: string[] = [];
          let koUseCases: string[] = [];
          let zhUseCases: string[] = [];
          
          // 安全解析英文示例
          if (agent.useCases) {
            if (typeof agent.useCases === 'string') {
              try {
                const parsed = JSON.parse(agent.useCases);
                enUseCases = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.error('Failed to parse EN useCases:', e);
              }
            } else if (Array.isArray(agent.useCases)) {
              enUseCases = agent.useCases;
            }
          }
          
          // 安全解析日文示例
          if (agent.useCasesJA) {
            if (typeof agent.useCasesJA === 'string') {
              try {
                const parsed = JSON.parse(agent.useCasesJA);
                jaUseCases = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.error('Failed to parse JA useCases:', e);
              }
            } else if (Array.isArray(agent.useCasesJA)) {
              jaUseCases = agent.useCasesJA;
            }
          }
          
          // 安全解析韩文示例
          if (agent.useCasesKO) {
            if (typeof agent.useCasesKO === 'string') {
              try {
                const parsed = JSON.parse(agent.useCasesKO);
                koUseCases = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.error('Failed to parse KO useCases:', e);
              }
            } else if (Array.isArray(agent.useCasesKO)) {
              koUseCases = agent.useCasesKO;
            }
          }
          
          // 安全解析中文示例
          if (agent.useCasesZH) {
            if (typeof agent.useCasesZH === 'string') {
              try {
                const parsed = JSON.parse(agent.useCasesZH);
                zhUseCases = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.error('Failed to parse ZH useCases:', e);
              }
            } else if (Array.isArray(agent.useCasesZH)) {
              zhUseCases = agent.useCasesZH;
            }
          }
          
          setExamples({
            en: enUseCases.slice(0, 3),
            ja: jaUseCases.slice(0, 3),
            ko: koUseCases.slice(0, 3),
            zh: zhUseCases.slice(0, 3)
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

  // 当示例变化时，保存到localStorage
  useEffect(() => {
    if (isOpen && agent?.id) {
      try {
        localStorage.setItem(getCacheKey(), JSON.stringify(examples));
      } catch (err) {
        console.error('Failed to cache examples:', err);
      }
    }
  }, [examples, isOpen, agent]);

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

      // 确保数组中不含有空字符串
      const cleanExamples = {
        en: finalExamples.en.filter(item => item.trim() !== ''),
        ja: finalExamples.ja.filter(item => item.trim() !== ''),
        ko: finalExamples.ko.filter(item => item.trim() !== ''),
        zh: finalExamples.zh.filter(item => item.trim() !== ''),
      };

      // 将数组转换为JSON字符串
      const stringifiedExamples = {
        en: JSON.stringify(cleanExamples.en),
        ja: JSON.stringify(cleanExamples.ja),
        ko: JSON.stringify(cleanExamples.ko),
        zh: JSON.stringify(cleanExamples.zh),
      };

      console.log('[保存对话示例] 准备更新数据:', {
        name: agent.name,
        description: agent.description,
        category: agent.category,
        capabilities: typeof agent.capabilities === 'string' 
          ? JSON.parse(agent.capabilities) 
          : agent.capabilities,
        useCases: stringifiedExamples.en,
        useCasesJA: stringifiedExamples.ja,
        useCasesKO: stringifiedExamples.ko,
        useCasesZH: stringifiedExamples.zh,
      });

      // 获取认证信息
      const userId = localStorage.getItem('userId');
      const walletAddress = localStorage.getItem('walletAddress');
      const token = localStorage.getItem('token');

      console.log('[保存对话示例] 认证信息:', {
        userId,
        walletAddress,
        hasToken: !!token
      });

      // 更新API
      const response = await agentAPI.updateAgent(agent.id, {
        name: agent.name,
        description: agent.description,
        category: agent.category,
        capabilities: typeof agent.capabilities === 'string' 
          ? JSON.parse(agent.capabilities) 
          : agent.capabilities,
        // 使用清理过的JSON字符串
        useCases: stringifiedExamples.en,
        useCasesJA: stringifiedExamples.ja,
        useCasesKO: stringifiedExamples.ko,
        useCasesZH: stringifiedExamples.zh
      } as any);

      console.log('[保存对话示例] API响应:', response);

      if (response.code === 200) {
        toast({
          description: t('messages.updateSuccess'),
        });
        // 保存成功后清除缓存
        localStorage.removeItem(getCacheKey());
        
        // 创建更新后的agent对象，确保类型正确
        const updatedAgent: LocalAgent = {
          ...agent,
          useCases: cleanExamples.en,
          useCasesJA: cleanExamples.ja,
          useCasesKO: cleanExamples.ko,
          useCasesZH: cleanExamples.zh
        };
        
        console.log('[保存对话示例] 更新成功, 返回更新后的agent:', updatedAgent);
        
        // 通知父组件更新，传递更新后的agent数据
        onUpdate(updatedAgent);
        onClose();
      } else {
        throw new Error(response.message || '更新失败');
      }
    } catch (error) {
      console.error('[保存对话示例] 更新失败:', error);
      toast({
        description: t('messages.updateFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 关闭对话框时的处理
  const handleClose = () => {
    // 不清除缓存，这样下次打开时还能恢复
    onClose();
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('agent.editPromptExamples')}</DialogTitle>
          <DialogDescription>
            {t('agent.examplesUpdateNotice')}
          </DialogDescription>
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
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
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