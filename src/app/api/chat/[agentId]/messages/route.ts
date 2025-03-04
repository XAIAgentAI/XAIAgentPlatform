import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 模拟数据库
let messageStore: Record<string, Array<{
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  conversation: number;
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

export async function DELETE (
  request: NextRequest,
  { params }: { params : { agentId: string }}
){
  const agentId = params.agentId;
  messageStore[agentId] = [];
  console.log(messageStore[agentId])
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
    // 初始化messageStore[agentId]为包含一条消息的数组
    messageStore[agentId] = [
      {
        id: Date.now().toString(),
        role: 'user' as 'user',
        content: message,
        timestamp: new Date().toISOString(),
        conversation: 1,
      }
    ];
  }

  // 用户消息对象
  const userMessage = {
    id: Date.now().toString(),
    role: "user" as 'user',
    content: message,
    timestamp: new Date().toISOString(),
    conversation: 1,
  };

  // 将用户消息添加到消息存储中
  messageStore[agentId].push(userMessage);

  // 构建要发送给AI的请求体
  const requestBody = {
    project: "DecentralGPT",
    model: "Llama3.3-70B",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: message
      }
    ],
    stream: false,
    wallet: "not yet",
    signature: "no signature yet",
    hash: "not yet"
  };

  // 向目标AI发送POST请求
  const response = await fetch('https://korea-chat.degpt.ai/api/v0/chat/completion/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  // 解析AI的返回结果
  const responseData = await response.json();
  const aiResponseData = responseData.choices[0].message;

  // 构建消息对象并添加到消息存储中
  const aiResponse = {
    id: Date.now().toString(),
    role: aiResponseData.role as 'user' | 'assistant',
    content: aiResponseData.content,
    timestamp: new Date().toISOString(),
    conversation: 1,
  };

  messageStore[agentId].push(aiResponse);
  console.log(messageStore[agentId]);
  return NextResponse.json(aiResponse);
}
