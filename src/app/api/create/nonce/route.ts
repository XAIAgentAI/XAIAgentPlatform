import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// 生产环境配置
const API_BASE_URL = process.env.API_BASE_URL;

export async function POST(request: Request) {
  try {
    // 1. 获取请求数据
    const requestData = await request.json();

    // 2. 设置默认值
    const agentData = {
      rewardAmount: '2000000000000000000000000000',
      rewardToken: '0xabcdef123',
      detailDescription: 'Agent的详细描述信息',
      startTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24小时后
      durationHour: 72,
      holdersCount: 0,
      projectDescription: JSON.stringify({
        en: "项目描述内容",
        zh: "项目描述内容",
      }),
      symbol: `AGENT${uuidv4().slice(0, 4)}`.toUpperCase(),
      ...requestData
    };

    // 3. 获取nonce并生成签名
    const nonceResponse = await axios.get(`${API_BASE_URL}/api/auth/nonce`);
    const wallet = ethers.Wallet.createRandom();
    const signature = await wallet.signMessage(nonceResponse.data.data.message);
    
    // 4. 获取访问令牌
    const authResponse = await axios.post(`${API_BASE_URL}/api/auth/wallet-connect`, {
      address: wallet.address,
      signature,
      message: nonceResponse.data.data.message
    });

    // 5. 创建Agent
    const createResponse = await axios.post(`${API_BASE_URL}/api/agents/new`, agentData, {
      headers: {
        'Authorization': `Bearer ${authResponse.data.data.token}`,
        'Content-Type': 'application/json'
      }
    });

    // 6. 返回成功响应
    return NextResponse.json({
      success: true,
      data: createResponse.data.data
    });

  } catch (error: any) {
    console.error('创建Agent失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '创建Agent过程中发生错误'
    }, { 
      status: 500 
    });
  }
}