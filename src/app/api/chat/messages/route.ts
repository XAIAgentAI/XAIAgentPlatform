"use server";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { neonConfig, Pool } from "@neondatabase/serverless";

interface Sentence {
  user?: string;
  assistant?: string;
  convid: string;
  agent?: string;
  time?: string; // 新增time字段
}

interface Conversation {
  [id: string]: Array<Sentence>;
}

const connectionString = process.env.CHAT_URL;
const chatDeployed = process.env.LLM_URL || "";

const pool = new Pool({ connectionString });

const initTime = new Date().toLocaleString().replace(/[/ ]/g, '-').replace(/:/g, '-').replace(/,/g, '');
//初始化数据时增加时间字段
const conversationData: Conversation = {
  "1": [
      {convid: "1", user: "What is your name?", time: initTime},
      {convid: "1", assistant: "Hello, I am your AI assistant, I am Fitten Code.", agent: "Xaiagent", time: initTime},
      {convid: "2", user: "Yes, what services do you offer?", time: initTime},
      {convid: "2", assistant: "I can help you with coding, answering questions, and more.", agent: "Xaiagent", time: initTime}
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
async function insertUserRecord(user: string, password: string, chat: any) {
  const insertUserQuery = `
    INSERT INTO chat (name, password, chat)
    VALUES ($1, $2, $3)
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
  const result = await pool.query(getUserQuery, values);
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  return null;
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

(async () => {
  try {
    await ensureChatTable();
  } catch (error) {
    console.error('Failed to initialize and insert data:', error);
  }
})();

// 获取消息历史
export async function GET(
  request: NextRequest,
) {
  const user = request.nextUrl.searchParams.get('user'); 
  
  if (!user) {
    return NextResponse.json([]);
  }

  const userChat = await getUserRecord(user);

  if (!userChat) {
    return NextResponse.json([]);
  }

  let chat = userChat.chat;
  
  if (!chat["1"]) {
    return NextResponse.json([]);
  }

  return NextResponse.json(chat["1"]);
}

export async function POST(
  request: NextRequest,
) {
  const { message, thing, isNew, user: requestUser, convid, agent } = await request.json();

  if (thing === 'signup') {
    // 生成初始用户名
    let timestamp = Math.floor(Date.now() / 1000);
    let randomNumbers = Math.floor(1000 + Math.random() * 90000).toString();
    let user = `${timestamp}${randomNumbers}`;
    console.log(user);

    let existingUser = await getUserRecord(user);
    while (existingUser) {
        randomNumbers = Math.floor(1000 + Math.random() * 90000).toString();
        user = `${timestamp}${randomNumbers}`;
        console.log(user);
        existingUser = await getUserRecord(user);
    }

    // 插入新用户的记录
    await insertUserRecord(user, "******", {"0": []});
    return NextResponse.json({ success: true, message: user });
  } else {
    // 使用请求中提供的用户名
    const user = requestUser;
    if (!user) {
      return NextResponse.json({ error: 'User not found in request.' });
    }

    // 获取用户记录
    const userChat = await getUserRecord(user);
    if (!userChat) {
      return NextResponse.json({ error: 'User not found.' });
    }

    let chat = userChat.chat;
    if (typeof chat === 'string') {
      chat = JSON.parse(chat); // 将字符串解析为对象
    }
    if (!chat["1"]) {
      chat["1"] = [];
    }

    let maxConvid = 0;
    if (chat["1"].length > 0) {
      maxConvid = Math.max(...chat["1"].map((sentence: any) => parseInt(sentence.convid)));
    }

    const currentTime = new Date().toLocaleString().replace(/[/ ]/g, '-').replace(/:/g, '-').replace(/,/g, '');
    const userMessage: Sentence = {
      user: message,
      convid: isNew === "yes" ? (maxConvid + 1).toString() : convid.toString(),
      time: currentTime // 插入当前时间
    };

    chat["1"].push(userMessage);
    
    //固定Model
    const selectedModel = "Llama3.3-70B";
    console.log(selectedModel);

    const requestBody = {
      project: "DecentralGPT",
      model: selectedModel,
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

    const response = await fetch(chatDeployed, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    console.log(responseData); // 添加一行调试输出

    if (!responseData.choices || responseData.choices.length === 0) {
      return NextResponse.json({ error: 'No choices found in response.' });
    }

    const aiResponseData = responseData.choices[0].message;

    const aiResponse: Sentence = {
      assistant: aiResponseData.content,
      convid: userMessage.convid,
      agent: agent,
      time: currentTime // 插入当前时间
    };

    chat["1"].push(aiResponse);
    await updateUserChat(user, chat);
    
    return NextResponse.json(aiResponse);
  }
}
