'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SocialLinks } from "@/components/ui/social-links";
import { LocalAgent } from "@/types/agent";
import { toast } from "@/components/ui/use-toast";
import { TwitterIcon, TelegramIcon, GitHubIcon, YouTubeIcon } from "@/components/ui/social-icons";

interface SocialMediaManagerProps {
  agent: LocalAgent;
  isCreator: boolean;
  onRefresh?: () => void;
}

interface SocialFormData {
  twitter: string;
  telegram: string;
  github: string;
  youtube: string;
}

export function SocialMediaManager({ agent, isCreator, onRefresh }: SocialMediaManagerProps) {
  const t = useTranslations('common');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [socialFormData, setSocialFormData] = useState<SocialFormData>({
    twitter: '',
    telegram: '',
    github: '',
    youtube: ''
  });

  // 解析社交媒体链接
  const parseSocialLinks = (socialLinks?: string) => {
    if (!socialLinks) return { twitter: [], telegram: [], github: [], youtube: [] };
    
    const links = socialLinks.split(",").map(link => link.trim());
    return {
      twitter: links.filter(link => link.includes("x.com") || link.includes("twitter.com")),
      telegram: links.filter(link => link.includes("t.me")),
      github: links.filter(link => link.includes("github.com")),
      youtube: links.filter(link => link.includes("youtube.com") || link.includes("youtu.be")),
    };
  };

  // 初始化表单数据
  const initializeFormData = () => {
    if (!agent.socialLinks) return;
    
    const parsed = parseSocialLinks(agent.socialLinks);
    setSocialFormData({
      twitter: parsed.twitter[0] || '',
      telegram: parsed.telegram[0] || '',
      github: parsed.github[0] || '',
      youtube: parsed.youtube[0] || ''
    });
  };

  // 处理输入变化
  const handleInputChange = (field: keyof SocialFormData, value: string) => {
    setSocialFormData(prev => ({ ...prev, [field]: value }));
  };

  // 处理提交
  const handleSubmit = async () => {
    setIsUpdating(true);
    try {
      const socialLinks = [
        socialFormData.twitter,
        socialFormData.telegram,
        socialFormData.github,
        socialFormData.youtube
      ].filter(Boolean).join(',');
      
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ socialLinks })
      });
      
      if (response.ok) {
        toast({
          title: t('success'),
          description: t('socialMediaUpdated'),
        });
        setIsModalOpen(false);
        // 通知父组件刷新
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || t('updateFailed'));
      }
    } catch (error) {
      console.error('更新社交媒体失败:', error);
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('updateFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // 当弹窗打开时初始化表单数据
  useEffect(() => {
    if (isModalOpen) {
      initializeFormData();
    }
  }, [isModalOpen, agent.socialLinks]);

    return (
    <div className="flex items-center gap-2">
      {/* 社交媒体展示 */}
      {agent.socialLinks && (
        <SocialLinks links={agent.socialLinks} />
      )}
      
      {/* 编辑按钮 - 仅创建者可见，放在图标右边 */}
      {isCreator && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs hover:bg-muted/50"
            >
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {t('editSocialMedia')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('editSocialMedia')}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1">
                  <TwitterIcon />
                  Twitter (X)
                </label>
                <input
                  type="text"
                  value={socialFormData.twitter}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                  className="w-full p-2 border rounded bg-background"
                  placeholder="https://x.com/your-account"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1">
                  <TelegramIcon />
                  Telegram
                </label>
                <input
                  type="text"
                  value={socialFormData.telegram}
                  onChange={(e) => handleInputChange('telegram', e.target.value)}
                  className="w-full p-2 border rounded bg-background"
                  placeholder="https://t.me/your-channel"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1">
                  <GitHubIcon />
                  GitHub
                </label>
                <input
                  type="text"
                  value={socialFormData.github}
                  onChange={(e) => handleInputChange('github', e.target.value)}
                  className="w-full p-2 border rounded bg-background"
                  placeholder="https://github.com/your-account"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1">
                  <YouTubeIcon />
                  YouTube
                </label>
                <input
                  type="text"
                  value={socialFormData.youtube}
                  onChange={(e) => handleInputChange('youtube', e.target.value)}
                  className="w-full p-2 border rounded bg-background"
                  placeholder="https://youtube.com/@your-channel"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleSubmit} 
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? t('saving') : t('save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 