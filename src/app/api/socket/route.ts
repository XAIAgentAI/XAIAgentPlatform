import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { currentChain } from '@/config/wagmi';
import { CONTRACTS, CURRENT_CONTRACT_ABI } from '@/config/contracts';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface TokenPriceData {
  price: number;
  timestamp: number;
}

interface DBCPriceResponse {
  status: number;
  code: string;
  msg: string;
  content: {
    dbc_price: number;
    update_time: string | null;
    percent_change_24h: number;
  };
}

// 获取 DBC 价格
async function getDBCPrice(): Promise<TokenPriceData> {
  try {
    console.log('Fetching DBC price from:', 'https://dbchaininfo.congtu.cloud/query/dbc_info');
    
    const response = await fetch('https://dbchaininfo.congtu.cloud/query/dbc_info', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // 添加 5 秒超时
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: DBCPriceResponse = await response.json();
    
    // 检查状态码是否为成功（1）
    if (data.status !== 1) {
      throw new Error(`API error! status: ${data.status}, message: ${data.msg}`);
    }

    console.log('Parsed DBC price data:', data);
    
    return {
      price: data.content.dbc_price,
      timestamp: Date.now() // 由于 update_time 可能为 null，我们使用当前时间戳
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Detailed error in getDBCPrice:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error('Unknown error in getDBCPrice:', error);
    }
    
    // 如果是网络错误，返回一个默认值而不是抛出错误
    return {
      price: 1, // 默认价格
      timestamp: Date.now()
    };
  }
}

// 获取 IAO 池中的 DBC 数量
async function getPoolDBCAmount(): Promise<bigint> {
  try {
    const publicClient = createPublicClient({
      chain: currentChain,
      transport: http(),
    });

    const totalDeposited = BigInt(0);
    
    // await publicClient.readContract({
    //   address: CONTRACTS.IAO_CONTRACT,
    //   abi: CURRENT_CONTRACT_ABI,
    //   functionName: 'totalDepositedDBC',
    // });

    console.log('getPoolDBCAmount-totalDeposited', totalDeposited);

    return totalDeposited;
  } catch (error) {
    console.error('Error fetching pool DBC amount:', error);
    throw error;
  }
}

// 获取实时价格
async function getRealtimePrice(agentId: number): Promise<number> {
  console.log('getRealtimePrice-agentId', agentId);
  try {
    // 只有 agentId 为 1 时才进行特殊计算
    if (agentId === 1) {
      const [dbcPrice, dbcAmount] = await Promise.all([
        getDBCPrice(),
        getPoolDBCAmount()
      ]);

      // 将 DBC 数量从 wei 转换为标准单位
      const dbcAmountInStandard = Number(dbcAmount) / 1e18;
      
      // XAA 总量固定为 2000 亿
      const XAA_TOTAL_SUPPLY = 200_000_000_000;
      
      // 计算价格：(DBC数量 * DBC单价) / XAA总量
      const price = (dbcAmountInStandard * dbcPrice.price) / XAA_TOTAL_SUPPLY;

      console.log('getRealtimePrice-price', dbcAmountInStandard, dbcPrice.price, XAA_TOTAL_SUPPLY, price);
      
      return price;
    }
    
    // 其他 agentId 返回默认价格 1
    return 1;
  } catch (error) {
    console.error('Error calculating realtime price:', error);
    return 1; // 发生错误时返回默认价格
  }
}

export async function GET(req: Request) {
  try {
    // 从 URL 参数中获取 agentId
    const url = new URL(req.url);
    const agentId = parseInt(url.searchParams.get('agentId') || '1');
    
    const price = await getRealtimePrice(agentId);
    
    return NextResponse.json({
      price,
      timestamp: Date.now(),
      volume: 0 // 由于目前没有实际的成交量数据，暂时返回0
    });
  } catch (error) {
    console.error('Error fetching price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    );
  }
} 