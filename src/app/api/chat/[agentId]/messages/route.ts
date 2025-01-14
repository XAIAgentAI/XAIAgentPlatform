import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 模拟数据库
let messageStore: Record<string, Array<{
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}>> = {};

// 获取消息历史
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const agentId = params.agentId;
  
  // 如果没有历史记录，返回空数组
  if (!messageStore[agentId]) {
    messageStore[agentId] = [];
  }

  return NextResponse.json(messageStore[agentId]);
}

// 发送新消息
export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const agentId = params.agentId;
  const { message } = await request.json();

  if (!messageStore[agentId]) {
    messageStore[agentId] = [];
  }

  // 模拟 AI 响应
  const aiResponse = {
    id: Date.now().toString(),
    role: 'assistant' as const,
    content: `这是来自 AI Agent 的回复：${message}`,
    timestamp: new Date().toISOString(),
  };

  messageStore[agentId].push(aiResponse);

  return NextResponse.json(aiResponse);
} 