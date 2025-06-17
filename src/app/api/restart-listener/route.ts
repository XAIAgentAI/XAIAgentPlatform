/**
 * 重启事件监听器的 API
 */

import { NextResponse } from 'next/server';
import { contractEventListener } from '@/services/contractEventListener';

export async function POST() {
  try {
    console.log('🔄 手动重启事件监听器...');
    
    // 停止当前监听器
    contractEventListener.stopListening();
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 重新启动
    await contractEventListener.startListening();
    
    const response = NextResponse.json({
      status: 'success',
      message: '事件监听器重启成功',
      timestamp: new Date().toISOString()
    });

    // 禁用缓存
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('重启事件监听器失败:', error);
    
    const errorResponse = NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : '重启失败'
    }, { status: 500 });

    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return errorResponse;
  }
}

// 禁用 Next.js 的静态优化和缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;
