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
    console.log('Network Debug Info:', {
      currentChainId: chainId,
      expectedChainId: currentChain.id,
      isTestnet,
      currentChainConfig: currentChain,
      switchChainAvailable: !!switchChain,
    });
    
    if (chainId !== currentChain.id) {
      if (switchChain) {
        try {
          console.log('Attempting to switch to chain:', {
            chainId: currentChain.id,
            name: currentChain.name,
            rpcUrls: currentChain.rpcUrls,
          });
          
          await switchChain({ chainId: currentChain.id });
          
          console.log('Chain switch successful');
          
          toast({
            title: t('messages.info'),
            description: isTestnet 
              ? t('messages.switchedToTestnet')
              : t('messages.switchedToMainnet'),
          });
          return false;
        } catch (error) {
          console.error('Chain switch failed:', error);
          toast({
            title: t('messages.error'),
            description: t('messages.switchNetworkFailed'),
          });
          return false;
        }
      } else {
        console.error('switchChain not available');
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