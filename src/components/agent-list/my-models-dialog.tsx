import React, { useState, useEffect } from "react";
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { CustomBadge } from "@/components/ui-custom/custom-badge";
import { Loading } from "@/components/ui-custom/loading";
import { getStatusVariant, getStatusI18nKey } from "@/types/agent";

interface MyModel {
  id: string;
  name: string;
  symbol: string;
  avatar: string;
  status: string;
  type: string;
  createdAt: string;
}

interface MyModelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModelsCount?: (count: number) => void;
}

export const MyModelsDialog = ({ open, onOpenChange, onModelsCount }: MyModelsDialogProps) => {
  const { address } = useAccount();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('myModels');
  const tAgent = useTranslations('agentList');
  
  const [models, setModels] = useState<MyModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && address) {
      fetchMyModels();
    }
  }, [open, address]);

  const fetchMyModels = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/agents/my-models?address=${address}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 200) {
          setModels(result.data || []);
          // 通知父组件模型数量
          if (onModelsCount) {
            onModelsCount(result.data?.length || 0);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching my models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModelClick = (modelId: string) => {
    window.open(`/${locale}/agent-detail/${modelId}`, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t('title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center flex-1 py-16">
              <Loading />
            </div>
          ) : models.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('noModelsTitle')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm leading-relaxed">
                {t('noModelsDescription')}
              </p>
              <button
                onClick={() => {
                  window.open(`/${locale}/create`, '_blank');
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary/90 transition-all duration-200 hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('createFirstModel')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {models.map((model) => (
                <div
                  key={model.id}
                  onClick={() => handleModelClick(model.id)}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <Avatar className="w-12 h-12 rounded-full">
                    <img src={model.avatar} alt={model.name} className="object-cover" />
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {model.name}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ${model.symbol}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <CustomBadge>
                        {model.type}
                      </CustomBadge>
                      <CustomBadge variant={getStatusVariant(model.status)}>
                        {tAgent(getStatusI18nKey(model.status))}
                      </CustomBadge>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('createdAt')}: {formatDate(model.createdAt)}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};