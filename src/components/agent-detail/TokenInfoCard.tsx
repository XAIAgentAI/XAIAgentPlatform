import { Card } from "@/components/ui/card";
import { useLocale, useTranslations } from 'next-intl';
import { TokenDistributionInfo } from '@/components/ui-custom/token-distribution-info';

interface TokenInfoCardProps {
  projectDescription?: string;
  symbol?: string;
  iaoDurationHours?: number; // 添加IAO持续时间参数
  totalSupply?: number;
  miningRate?: number;
  agentName?: string;
  iaoTokenAmount?: number;
  totalSupplyYears?: number; // 添加总供应量年限参数
}

export function TokenInfoCard({ projectDescription, symbol, iaoDurationHours, totalSupply, miningRate, agentName, iaoTokenAmount, totalSupplyYears }: TokenInfoCardProps) { 
  const locale = useLocale();
  const t = useTranslations("create.createAgent");


  // if (!projectDescription) {
  //   return null;
  // }

  // 尝试判断是否为 JSON 格式
  const isJsonString = (str: string) => {
    try {
      return typeof JSON.parse(str) === 'object';
    } catch (e) {
      return false;
    }
  };

  // // 获取最终要显示的描述文本
  // const getDescription = () => {
  //   if (isJsonString(projectDescription)) {
  //     const descObj = JSON.parse(projectDescription);
  //     return descObj[locale] || descObj['en'] || '';
  //   }
  //   return projectDescription;
  // };

  // const localizedDescription = getDescription();

  // if (!localizedDescription) {
  //   return null;
  // }

  console.log("123", totalSupply, miningRate);
  

  return (
    <Card className="p-6 bg-card mt-6">
      <div className="space-y-3">
        {/* {localizedDescription.split("\n").map((line: string, index: number) => (
          <p key={index} className="text-sm text-muted-foreground break-words mb-2">
            {line}
          </p>
        ))} */}

        <TokenDistributionInfo 
          symbol={symbol || 'Token'} 
          hours={iaoDurationHours} 
          textSize="sm"
          totalSupply={totalSupply?.toString() || '100000000000'}
          iaoPercentage="15"
          miningRate={miningRate?.toString() || '5'}
          agentName={agentName}
          iaoTokenAmount={iaoTokenAmount}
          totalSupplyYears={totalSupplyYears || 8}
        />

      </div>
    </Card>
  );
} 