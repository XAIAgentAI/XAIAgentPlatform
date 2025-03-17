"use server";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { neonConfig, Pool } from "@neondatabase/serverless";

interface Sentence {
  user?: string;
  assistant?: string;
  convid: string;
}

interface Conversation {
  [id: string]: Array<Sentence>;
}

const connectionString = process.env.CHAT_URL;

const pool = new Pool({ connectionString });

//初始化数据
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

// 确保chat表存在
async function ensureChatTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS chat (
      name VARCHAR(255) PRIMARY KEY,
      password VARCHAR(255) NOT NULL,
      chat JSONB NOT NULL
    );
  `;
  try {
    await pool.query(createTableQuery);
    console.log('Chat table ensured.');
  } catch (error) {
    console.error('Error ensuring chat table:', error);
    throw error;
  }
}

// 向chat表中插入一条新记录
async function insertUserRecord(user: string, password: string, chat: Conversation) {
  const insertUserQuery = `
    INSERT INTO chat (name, password, chat)
    VALUES ($1, $2, $3)
    ON CONFLICT (name) DO NOTHING;
  `;
  const values = [user, password, JSON.stringify(chat)]; 
  
  try {
    await pool.query(insertUserQuery, values);
    console.log('User record inserted successfully.');
  } catch (error) {
    console.error('Error inserting user record:', error);
    throw error;
  }
}

// 从chat表中获取用户记录
async function getUserRecord(user: string) {
  const getUserQuery = `
    SELECT * FROM chat WHERE name = $1;
  `;
  const values = [user];
  
  try {
    const result = await pool.query(getUserQuery, values);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting user record:', error);
    throw error;
  }
}

// 更新chat字段
async function updateUserChat(user: string, chat: Conversation) {
  const updateUserQuery = `
    UPDATE chat
    SET chat = $1
    WHERE name = $2;
  `;
  const values = [JSON.stringify(chat), user];
  
  try {
    await pool.query(updateUserQuery, values);
    console.log('User chat updated successfully.');
  } catch (error) {
    console.error('Error updating user chat:', error);
    throw error;
  }
}

// 初始化并执行插入操作
(async () => {
  try {
    await ensureChatTable();
    await insertUserRecord("Sword", '666666', conversationData); 
  } catch (error) {
    console.error('Failed to initialize and insert data:', error);
  }
})();

// 获取消息历史
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  const user = request.nextUrl.searchParams.get('user'); 
  
  if (!user) {
    return NextResponse.json([]);
  }

  const userChat = await getUserRecord(user);

  if (!userChat) {
    return NextResponse.json([]);
  }

  let chat = userChat.chat;

  if (typeof chat === 'string') {
    chat = JSON.parse(chat);
  }

  if (!chat[agentId]) {
    return NextResponse.json([]);
  }

  return NextResponse.json(chat[agentId]);
}

// 发送新消息
export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  const { message, password, user, thing, isNew } = await request.json();
  
  if (thing === 'signup' && password) {
    const existingUser = await getUserRecord(user);
    
    if (!existingUser) {
      await insertUserRecord(user, password, {});
      return NextResponse.json({ success: true, message: 'User registered successfully.' });
    }
    return NextResponse.json({ success: false, message: 'User already exists.' });
  } else if (thing === "login" && password) {
    const existingUser = await getUserRecord(user);
    if (existingUser && existingUser.password === password) {
      return NextResponse.json({ success: true, message: 'Login successful.', chat: chat[agentId] || [] });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid username or password.' });
    }
  }

  const userChat = await getUserRecord(user);
  if (!userChat) {
    return NextResponse.json({ error: 'User not found.' });
  }

  let chat = userChat.chat;
  if (!chat[agentId]) {
    chat[agentId] = [];
  }

  let maxConvid = 0;
  if (chat[agentId].length > 0) {
    maxConvid = Math.max(...chat[agentId].map(sentence => parseInt(sentence.convid)));
  }

  const userMessage: Sentence = {
    user: message,
    convid: isNew === "yes" ? (maxConvid + 1).toString() : maxConvid.toString()
  };

  chat[agentId].push(userMessage);

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

  const response = await fetch('https://korea-chat.degpt.ai/api/v0/chat/completion/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const responseData = await response.json();
  const aiResponseData = responseData.choices[0].message;

  const aiResponse: Sentence = {
    assistant: aiResponseData.content,
    convid: userMessage.convid
  };

  chat[agentId].push(aiResponse);
  await updateUserChat(user, chat);
  
  return NextResponse.json(aiResponse);
}
