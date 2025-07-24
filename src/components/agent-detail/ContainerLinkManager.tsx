import { useState } from "react";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { agentAPI } from '@/services/api';
import { LocalAgent } from "@/types/agent";
import { copyToClipboard } from '@/lib/utils';

interface ContainerLinkManagerProps {
  agent: LocalAgent;
  isCreator: boolean;
}

export function ContainerLinkManager({ agent, isCreator }: ContainerLinkManagerProps) {
  const t = useTranslations('containerLinkManager');
  const [isEditingContainer, setIsEditingContainer] = useState(false);
  const [containerLinkInput, setContainerLinkInput] = useState('');
  const [isUpdatingContainer, setIsUpdatingContainer] = useState(false);

  const handleEditContainer = () => {
    setContainerLinkInput((agent as any).containerLink || '');
    setIsEditingContainer(true);
  };

  const handleSaveContainer = async () => {
    if (!containerLinkInput.trim()) {
      toast({
        description: t('pleaseEnterContainerLink'),
        variant: 'destructive',
      });
      return;
    }

    // 验证容器链接格式 - 只需要是有效的HTTPS链接
    const fullUrl = containerLinkInput.startsWith('https://') ? containerLinkInput : `https://${containerLinkInput}`;
    try {
      const urlObj = new URL(fullUrl);
      // 确保是HTTPS协议
      if (urlObj.protocol !== 'https:') {
        toast({
          description: t('mustUseHttps'),
          variant: 'destructive',
        });
        return;
      }
    } catch {
      toast({
        description: t('enterValidLinkFormat'),
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingContainer(true);
    try {
      const response = await agentAPI.updateAgent(agent.id, {
        name: agent.name,
        description: agent.description,
        category: agent.category,
        capabilities: typeof agent.capabilities === 'string' ? JSON.parse(agent.capabilities) : agent.capabilities,
        containerLink: fullUrl,
      });

      if (response.code === 200) {
        // 更新本地状态
        (agent as any).containerLink = fullUrl;
        setIsEditingContainer(false);
        toast({
          description: t('updateSuccess'),
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('更新容器链接失败:', error);
      toast({
        description: t('updateFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingContainer(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingContainer(false);
    setContainerLinkInput('');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText((agent as any).containerLink);
    toast({
      description: t('copied'),
    });
  };

  // 如果不是创建者，不显示任何内容
  if (!isCreator) {
    return null;
  }

  return (
    <div className="mt-6">
      {/* 如果正在编辑或者没有容器链接，显示输入框 */}
      {(isEditingContainer || !(agent as any).containerLink) ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block">
              {t('containerLink')} <span className="text-gray-500 text-sm">({t('optional')})</span>
            </label>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveContainer}
                disabled={isUpdatingContainer}
                size="sm"
              >
                {isUpdatingContainer ? t('saving') : t('save')}
              </Button>
              {(agent as any).containerLink && (
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  size="sm"
                  disabled={isUpdatingContainer}
                >
                  {t('cancel')}
                </Button>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">https://</span>
            </div>
            <input
              value={containerLinkInput.startsWith('https://') ? containerLinkInput.substring(8) : containerLinkInput}
              onChange={(e) => {
                let value = e.target.value;
                if (value.startsWith('https://')) {
                  value = value.substring(8);
                }
                setContainerLinkInput(value);
              }}
              className="w-full bg-white dark:bg-[#1a1a1a] p-1.5 pl-20 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
              placeholder="example.com/your-container-image"
            />
          </div>
          <div className="text-gray-400 text-sm mt-1">{t('example')}</div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block">
              {t('containerLink')}
            </label>
            <Button
              onClick={handleEditContainer}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {t('edit')}
            </Button>
          </div>
          <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-[#1a1a1a] rounded-lg border border-black dark:border-white border-opacity-10 dark:border-opacity-10">
            <a
              href={(agent as any).containerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 text-sm truncate flex-1"
            >
              {(agent as any).containerLink}
            </a>
            <button
              onClick={async () => {
                const ok = await copyToClipboard((agent as any).containerLink);
                toast({
                  title: ok ? t('copied') : t('copyFailed'),
                  duration: 2000,
                  variant: ok ? undefined : 'destructive',
                });
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={t('copyContainerLink')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
