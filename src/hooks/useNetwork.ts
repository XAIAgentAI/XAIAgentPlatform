import { useCallback } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { currentChain } from '@/config/wagmi';
import { isTestnet } from '@/config/networks';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

export const useNetwork = () => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();
  const t = useTranslations();

  const ensureCorrectNetwork = useCallback(async () => {
    if (chainId !== currentChain.id) {
      if (switchChain) {
        try {
          await switchChain({ chainId: currentChain.id });
          toast({
            title: t('messages.info'),
            description: isTestnet 
              ? t('messages.switchedToTestnet')
              : t('messages.switchedToMainnet'),
          });
          return false;
        } catch (error) {
          console.error('Failed to switch network:', error);
          toast({
            title: t('messages.error'),
            description: t('messages.switchNetworkFailed'),
          });
          return false;
        }
      } else {
        toast({
          title: t('messages.error'),
          description: t('messages.switchNetworkFailed'),
        });
        return false;
      }
    }
    return true;
  }, [chainId, switchChain, toast, t]);

  return {
    isCorrectNetwork: chainId === currentChain.id,
    isTestnet,
    ensureCorrectNetwork,
  };
}; 