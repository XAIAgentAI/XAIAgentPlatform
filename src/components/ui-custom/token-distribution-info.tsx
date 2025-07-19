import { useTranslations } from 'next-intl';

interface TokenDistributionInfoProps {
  symbol: string;
  hours?: number;
  className?: string;
  textSize?: 'sm' | 'md' | 'lg';
}

export const TokenDistributionInfo: React.FC<TokenDistributionInfoProps> = ({
  symbol,
  hours = 72,
  className = '',
  textSize = 'sm'
}) => {
  const t = useTranslations('create.createAgent.TokenDistribution');
  
  // 所有需要显示的点
  const allPoints = [1, 2, 3, 4, 5, 6, 7, 8];
  
  return (
    <div className={`space-y-3 text-${textSize} ${className}`}>
      {/* 前两点 */}
      {[1, 2].map((point) => (
        <p key={point}>
          {point}. {t(`points.${point}`, { symbol })}
        </p>
      ))}
      
      {/* 第3点使用动态IAO持续时间 */}
      <p>
        3. {t(`points.3`, { 
          symbol, 
          hours 
        })}
      </p>
      
      {/* 剩余点 */}
      {[4, 5, 6, 7, 8].map((point) => (
        <p key={point}>
          {point}. {t(`points.${point}`, { symbol })}
        </p>
      ))}
    </div>
  );
};

export default TokenDistributionInfo; 