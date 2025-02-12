import { useCallback } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { currentChain } from '@/config/wagmi';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

export const useTestNetwork = () => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();
  const t = useTranslations();

  const ensureTestNetwork = useCallback(async () => {
    if (chainId !== currentChain.id) {
      if (switchChain) {
        try {
          await switchChain({ chainId: currentChain.id });
          toast({
            title: t('messages.info'),
            description: t('messages.switchedToTestnet'),
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
    isTestnet: chainId === currentChain.id,
    ensureTestNetwork,
  };
}; 