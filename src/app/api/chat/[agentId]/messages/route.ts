import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Sentence {
  user?: string;
  assistant?: string;
  convid: string;
}

interface Conversation {
  [id: string]: Array<Sentence>;
}

const total = await prisma.agent.count()
console.log(total)

// 示例使用
const conversationData: Conversation = {
  "1": [
      {convid: "1", user: "What is your name?"},
      {convid: "1", assistant: "Hello, I am your AI assistant, I am Fitten Code."},
      {convid: "1", assistant: "Is there anything else you would like to know?"},
      {convid: "2", user: "Yes, what services do you offer?"},
      {convid: "2", assistant: "I can help you with coding, answering questions, and more."}
  ],
  "5": [
      {convid: "1", user: "Hello, can you assist me with something?"},
      {convid: "1", assistant: "Of course! What do you need help with?"},
      {convid: "1", user: "I need to debug some JavaScript code."},
      {convid: "1", assistant: "Sure, I can help with that. Please share the code you're having trouble with."}
  ]
};

// 模拟数据库
let chatStore: Array<{
  user: string;
  password: string;
  chat: Conversation;
}> = [];

// 获取消息历史
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  const { user } = await request.json();
  
  console.log(chatStore);
  
  // 找到对应用户的数据项
  const userChat = chatStore.find(item => item.user === user);

  // 如果用户不存在，返回空数组
  if (!userChat) {
    return NextResponse.json([]);
  }

  // 如果没有历史记录，返回空数组
  if (!userChat.chat[agentId]) {
    userChat.chat[agentId] = [];
  }

  return NextResponse.json(userChat.chat[agentId]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { user } = await request.json();
  const { agentId } = params;

  // 找到对应用户的数据项
  const userChat = chatStore.find(item => item.user === user);

  // 如果用户存在，删除指定agentId的聊天记录
  if (userChat && userChat.chat[agentId]) {
    userChat.chat[agentId] = [];
  }

  console.log(chatStore);
  return NextResponse.json(userChat ? userChat.chat[agentId] : []);
}

// 发送新消息
export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  const { message, password, user, thing, isNew } = await request.json();
  
  // 如果请求是signup，添加新用户
  if (thing === 'signup' && password) {
    const existingUser = chatStore.find(item => item.user === user);
    if (!existingUser) {
      chatStore.push({
        user: user,
        password: password,
        chat: {}
      });
    }
    console.log(chatStore); //调试
    return NextResponse.json({ success: existingUser ? false : true, message: existingUser ? 'User already exists.' : 'User registered successfully.' });
  } else if (thing === "login" && password) {
    const existingUser = chatStore.find(item => item.user === user);
    if (existingUser && existingUser.password === password) {
        console.log(chatStore); //调试
        return NextResponse.json({ success: true, message: 'Login successful.', chat: existingUser.chat[agentId] });
    } else {
        return NextResponse.json({ success: false, message: 'Invalid username or password.' });
    }
  }

  // 找到对应用户的数据项
  const userChat = chatStore.find(item => item.user === user);

  // 如果用户不存在，返回错误
  if (!userChat) {
    return NextResponse.json({ error: 'User not found.' });
  }

  // 初始化用户聊天记录
  if (!userChat.chat[agentId]) {
    userChat.chat[agentId] = [];
  }

  // 计算当前最大convid值
  let maxConvid = 0;
  if (userChat.chat[agentId].length > 0) {
    maxConvid = Math.max(...userChat.chat[agentId].map(sentence => parseInt(sentence.convid)));
  }

  // 用户消息对象
  const userMessage: Sentence = {
    user: message,
    convid: isNew === "yes" ? (maxConvid + 1).toString() : maxConvid.toString()
  };

  // 将用户消息添加到消息存储中
  userChat.chat[agentId].push(userMessage);

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

  // 向向AI发送POST请求
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
  const aiResponse: Sentence = {
    assistant: aiResponseData.content,
    convid: userMessage.convid
  };

  userChat.chat[agentId].push(aiResponse);
  console.log(chatStore); //调试
  return NextResponse.json(aiResponse);
}
