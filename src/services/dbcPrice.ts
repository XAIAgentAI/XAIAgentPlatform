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

interface DBCPriceInfo {
  priceUsd: string;
  percentChange24h: number;
}

export const fetchDBCPrice = async (): Promise<DBCPriceInfo> => {
  try {
    const response = await fetch('https://dbchaininfo.congtu.cloud/query/dbc_info?language=CN');
    if (!response.ok) {
      throw new Error('获取 DBC 价格失败：网络请求错误');
    }
    const data: DBCPriceResponse = await response.json();
    if (data.status === 1 && data.code === "10502") {
      return {
        priceUsd: data.content.dbc_price.toString(),
        percentChange24h: data.content.percent_change_24h
      };
    }
    throw new Error(`获取 DBC 价格失败：${data.msg || '未知错误'}`);
  } catch (err) {
    console.error('获取 DBC 价格失败:', err);
    return {
      priceUsd: "0",
      percentChange24h: 0
    };
  }
}; 