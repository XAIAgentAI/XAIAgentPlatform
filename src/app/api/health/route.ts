/**
 * 健康检查端点
 * 检查服务器和事件监听器状态
 */

import { NextResponse } from 'next/server';
import { contractEventListener } from '@/services/contractEventListener';

export async function GET(request: Request) {
  try {
    const isListening = contractEventListener.isActive();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      eventListener: {
        status: isListening ? 'running' : 'stopped',
        message: isListening ? '事件监听器正在运行' : '事件监听器已停止',
        note: '事件监听器通过 instrumentation.ts 自动启动'
      },
      server: {
        nodeEnv: process.env.NODE_ENV,
        uptime: process.uptime()
      }
    });
  } catch (error) {
    console.error('健康检查失败:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// 处理OPTIONS请求（预检请求）
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204 });
}
