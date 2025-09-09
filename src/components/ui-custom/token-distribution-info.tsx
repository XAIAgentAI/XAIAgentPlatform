import { useTranslations } from 'next-intl';
import { localAgents } from '../../../scripts/localAgents';
import { formatUnits } from 'viem';
import BigNumber from 'bignumber.js';

interface TokenDistributionInfoProps {
  symbol: string;
  hours?: number;
  className?: string;
  textSize?: 'sm' | 'md' | 'lg';
  totalSupply?: string;
  iaoPercentage?: string;
  miningRate?: string;
  agentName?: string;
  iaoTokenAmount?: number;
  totalSupplyYears?: number;
}

export const TokenDistributionInfo: React.FC<TokenDistributionInfoProps> = ({
  symbol,
  hours = 72,
  className = '',
  textSize = 'sm',
  totalSupply = '100000000000',
  iaoPercentage = '15',
  miningRate = '5',
  agentName,
  iaoTokenAmount,
  totalSupplyYears = 8
}) => {
  const t = useTranslations('create.createAgent.TokenDistribution');
  
  // 判断当前agent是否在官方agent列表中
  const isOfficialAgent = agentName ? localAgents.some(agent => agent.name === agentName) : false;
  
  // 计算显示值
  const totalSupplyInBillions = Math.round(Number(totalSupply) / 100000000).toString(); // 转换为几十亿的格式
  const miningPerYear = Math.round((Number(totalSupply) * Number(miningRate)) / 100 / 100000000).toString(); // 每年挖矿数量（亿）

  // 测试不同的转换方法
  if (iaoTokenAmount) {
    console.log("Original iaoTokenAmount:", iaoTokenAmount);
    console.log("Type:", typeof iaoTokenAmount);
    console.log("Constructor:", iaoTokenAmount.constructor.name);
    console.log("Available methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(iaoTokenAmount)));
    
    // 方法1: 直接转换为字符串
    const str1 = iaoTokenAmount.toString();
    console.log("toString():", str1);
    
    // 方法2: 转换为Number再toFixed
    try {
      const num = Number(iaoTokenAmount);
      console.log("Number conversion:", num);
      console.log("Number toFixed(0):", num.toFixed(0));
    } catch (e) {
      console.log("Number conversion error:", e);
    }
  }
  
  // 计算实际的IAO百分比（iaoTokenAmount是Wei单位，需要转换）
  const actualIaoPercentage = iaoTokenAmount && Number(totalSupply) > 0 
    ? (() => {
        try {
          // 使用 BigNumber.js 进行精确计算
          const iaoTokenAmountBN = new BigNumber(iaoTokenAmount.toString());
          const totalSupplyBN = new BigNumber(totalSupply);
          const oneEther = new BigNumber(10).pow(18);
          
          // 计算: (iaoTokenAmount / 10^18) / totalSupply * 100
          const iaoTokenAmountInTokens = iaoTokenAmountBN.div(oneEther);
          const percentage = iaoTokenAmountInTokens.div(totalSupplyBN).multipliedBy(100);
          
          console.log("BigNumber.js 精确计算:", {
            original: iaoTokenAmount,
            iaoTokenAmountBN: iaoTokenAmountBN.toString(),
            totalSupplyBN: totalSupplyBN.toString(),
            iaoTokenAmountInTokens: iaoTokenAmountInTokens.toString(),
            percentage: percentage.toString(),
            percentageRounded: percentage.integerValue(BigNumber.ROUND_HALF_UP).toString()
          });
          
          return percentage.toString();
        } catch (error) {
          console.warn('IAO token amount conversion error:', error);
          return iaoPercentage.replace('%', '');
        }
      })()
    : '-';
  
  return (
    <div className={`space-y-3 text-${textSize} ${className}`}>
      {/* 第1点：使用动态总供应量和挖矿率 */}
      <p>
        1. {t(`points.1`, { 
          symbol,
          totalSupply: totalSupplyInBillions,
          miningPerYear: miningPerYear,
          totalSupplyYears: totalSupplyYears
        })}
      </p>
      
      {/* 第2点：使用动态IAO百分比 */}
      <p>
        2. {t(`points.2`, { 
          symbol,
          iaoPercentage: actualIaoPercentage
        })}
      </p>
      
      {/* 第3点使用动态IAO持续时间 */}
      <p>
        3. {t(`points.3`, { 
          symbol, 
          hours 
        })}
      </p>
      
      {/* 第4点：使用固定的流动性池百分比 */}
      <p>
        4. {t(`points.4`, { 
          symbol,
          liquidityPercentage: actualIaoPercentage
        })}
      </p>
      
      {/* 第5、6、7、8点 - 只有当不是官方agent时才显示 */}
      {!isOfficialAgent && [5].map((point) => (
        <p key={point}>
          {point}. {t(`points.${point}`, { symbol })}
        </p>
      ))}
      
      {/* 第6点：使用动态挖矿数量 - 只有当不是官方agent时才显示 */}
      {!isOfficialAgent && (
        <p>
          6. {t(`points.6`, { 
            symbol,
            miningPerYear: miningPerYear
          })}
        </p>
      )}
      
      {/* 第7、8点 - 只有当不是官方agent时才显示 */}
      {!isOfficialAgent && [7, 8].map((point) => (
        <p key={point}>
          {point}. {t(`points.${point}`, { symbol })}
        </p>
      ))}
    </div>
  );
};

export default TokenDistributionInfo; 