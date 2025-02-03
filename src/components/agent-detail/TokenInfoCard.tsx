import { Card } from "@/components/ui/card";
import { useTranslations } from 'next-intl';

export function TokenInfoCard() {
  const t = useTranslations('tokenInfo');

  const tokenInfo = [
    t('totalSupply'),
    t('iaoAllocation'),
    t('iaoDuration'),
    t('tradingPair')
  ];

  return (
    <Card className="p-6 bg-card mt-6">
      <div className="space-y-3">
        {tokenInfo.map((info, index) => (
          <div key={index} className="flex items-start gap-2 text-sm opacity-50">
            <span className="text-muted-foreground">{index + 1}.</span>
            <span className="text-secondary">{info}</span>
          </div>
        ))}
      </div>
    </Card>
  );
} 