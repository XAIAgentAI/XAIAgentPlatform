"use server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { Pool } from "@neondatabase/serverless"

const connectionString = process.env.CHAT_URL;
const pool = new Pool({ connectionString })
const LLM_URL = process.env.LLM_URL || "";

    // 调用AI服务的通用函数
    async function callAIService(prompt: string): Promise<string> {
    try {
        const response = await fetch(LLM_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "Llama-4-Scout-Instruct",
            messages: [{ role: "user", content: prompt }],
            project: "DecentralGPT",
            stream: false
        })
        });

        if (!response.ok) {
        throw new Error(`AI服务请求失败: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    } catch (error) {
        console.error("调用AI服务失败:", error);
        throw error;
    }
    }

    // 获取AI翻译 - 严格固定格式
    async function getAITranslation(text: string, targetLanguage: string): Promise<string> {
    const prompt = `你是一名专业的本地化专家。请将以下文本精确翻译为${targetLanguage}，保持技术文档风格，不要添加任何额外内容或解释，只需返回翻译后的文本。

    原文: "${text}"

    翻译要求:
    1. 必须保持原意的准确性
    2. 使用专业术语
    3. 输出必须只是翻译后的文本，不要包含其他任何内容

    ${targetLanguage}翻译:`;
    
    const translated = await callAIService(prompt);
    // 清理响应，只取第一行（防止模型添加额外内容）
    return translated.split('\n')[0].trim();
    }

// 生成多语言用例 - 严格JSON格式
async function generateUseCases(description: string): Promise<{
  english: string[];
  ja: string[];
  ko: string[];
  zh: string[];
}> {
  const prompt = `你是一名产品专家，请基于以下AI代理描述，记住是基于下面的"AI代理描述"，生成3个典型使用场景(use cases)。严格按照以下JSON格式返回数据，不要包含任何额外内容或解释。

    要求:
    1. 每个用例用简洁的一句话描述
    2. 英文用例首字母大写
    3. 其他语言使用正确的标点符号
    4. 每个用例要以用户人称，像是用户的一个需求，比如"帮我制定一个...计划"
    5. 必须返回完整JSON对象

    {
    "english": ["Use case 1", "Use case 2", "Use case 3"],
    "ja": ["日本語用例1", "日本語用例2", "日本語用例3"],
    "ko": ["한국어 사용 사례1", "한국어 사용 사례2", "한국어 사용 사례3"],
    "zh": ["中文用例1", "中文用例2", "中文用例3"]
    }

    AI代理描述: ${description}

    请直接返回符合上述要求的JSON对象:`;
  
  const response = await callAIService(prompt);
  
  try {
    // 尝试提取JSON部分（防止模型添加额外文本）
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}') + 1;
    const jsonString = response.slice(jsonStart, jsonEnd);
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("解析用例JSON失败:", error);
    return {
      english: [],
      ja: [],
      ko: [],
      zh: []
    };
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.json();
  
  if (!formData.name) {
    return NextResponse.json(
      { success: false, message: "Name is required" },
      { status: 400 }
    );
  }

  // 设置默认值
  const description = formData.description || "An AI Agent";
  let translationResults = {
    ja: "",
    ko: "",
    zh: ""
  };
  let useCaseResults = {
    english: [] as string[],
    ja: [] as string[],
    ko: [] as string[],
    zh: [] as string[]
  };

  try {
    // 并行处理翻译和用例生成
    const [ja, ko, zh, useCases] = await Promise.all([
      getAITranslation(description, "Japanese"),
      getAITranslation(description, "Korean"),
      getAITranslation(description, "Simplified Chinese"),
      generateUseCases(description)
    ]);

    translationResults = { ja, ko, zh };
    useCaseResults = useCases;
  } catch (error) {
    console.error("AI处理失败:", error);
    // 即使失败也继续，使用默认值
  }

  // 构建插入数据
  const queryString = `
    INSERT INTO "CreatedAgents" (
      name, "tokenAddress", avatar, symbol, type,
      "marketCap", change24h, lifetime, tvl, "holdersCount",
      volume24h, status, "statusJA", "statusKO", "statusZH",
      description, "descriptionJA", "descriptionKO", "descriptionZH",
      "createdAt", "creatorAddress", "totalSupply",
      "useCases", "useCasesJA", "useCasesKO", "useCasesZH",
      "socialLinks", "chatEntry", "iaoTokenAmount", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
    )
    RETURNING id
  `;

  const values = [
    // 基本信息
    formData.name, // $1
    '', // $2 tokenAddress
    formData.imageUrl || '', // $3 avatar
    formData.name, // $4 symbol
    'AI Agent', // $5 type
    
    // 金融数据
    '$0', // $6 marketCap
    '0', // $7 change24h
    '', // $8 lifetime
    '$0', // $9 tvl
    0, // $10 holdersCount
    
    // 状态信息
    '$0', // $11 volume24h
    'TBA', // $12 status
    '近日公開', // $13 statusJA
    '출시 예정', // $14 statusKO
    '即将公布', // $15 statusZH
    
    // 描述信息
    description, // $16 description
    translationResults.ja || `${description} (Japanese)`, // $17 descriptionJA
    translationResults.ko || `${description} (Korean)`, // $18 descriptionKO
    translationResults.zh || `${description} (Chinese)`, // $19 descriptionZH
    
    // 元信息
    new Date(), // $20 createdAt
    '', // $21 creatorAddress
    5000000000, // $22 totalSupply
    
    // 用例信息
    useCaseResults.english, // $23 useCases
    useCaseResults.ja, // $24 useCasesJA
    useCaseResults.ko, // $25 useCasesKO
    useCaseResults.zh, // $26 useCasesZH
    
    // 其他
    '', // $27 socialLinks
    formData.chat ? { // $28 chatEntry
      userFirst: formData.chat.userFirst || '',
      agentFirst: formData.chat.agentFirst || '',
      userSecond: formData.chat.userSecond || '',
      agentSecond: formData.chat.agentSecond || '',
      userThird: formData.chat.userThird || '',
      agentThird: formData.chat.agentThird || ''
    } : null,
    formData.tokenSupply || 5000000000, // $29 iaoTokenAmount
    new Date() // $30 updatedAt
  ];

  try {
    const client = await pool.connect();
    try {
      const response = await client.query(queryString, values);
      const ApiData = {
        // 基本信息
        id: response.rows[0].id,
        name: formData.name,
        description: description,
        imageUrl: formData.imageUrl || '',
        tokenSupply: formData.tokenSupply || 5000000000,
        chat: formData.chat || null,
        
        // 翻译结果
        descriptionJA: translationResults.ja || `${description} (Japanese)`,
        descriptionKO: translationResults.ko || `${description} (Korean)`,
        descriptionZH: translationResults.zh || `${description} (Chinese)`,
        
        // 用例信息
        useCases: useCaseResults.english,
        useCasesJA: useCaseResults.ja,
        useCasesKO: useCaseResults.ko,
        useCasesZH: useCaseResults.zh,
        
        // 状态信息
        status: 'TBA',
        statusJA: '近日公開',
        statusKO: '출시 예정',
        statusZH: '即将公布',
        
        // 金融数据
        marketCap: '$0',
        change24h: '0',
        lifetime: '',
        tvl: '$0',
        holdersCount: 0,
        volume24h: '$0',
        
        // 元信息
        createdAt: new Date().toISOString(),
        creatorAddress: '',
        totalSupply: 5000000000,
        socialLinks: '',
        iaoTokenAmount: formData.tokenSupply || 5000000000,
        updatedAt: new Date().toISOString(),
        
        // 其他可能需要的字段
        tokenAddress: '',
        symbol: formData.name,
        type: 'AI Agent'
      };
      // 在这里调用nonce接口
      try {
        const secondApiResponse = await fetch(`http://localhost:3000/api/create/nonce`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ApiData)
        });

        if (!secondApiResponse.ok) {
          throw new Error(`nonce接口调用失败: ${secondApiResponse.status}`);
        }

        const secondApiData = await secondApiResponse.json();
        console.log('nonce接口调用成功:', secondApiData);
      } catch (secondApiError) {
        console.error('调用nonce接口失败:', secondApiError);
        throw secondApiError; // 将错误向上抛出，让外层catch捕获
      }
      
      // 重构useCaseResults为前端友好的格式
      const formattedUseCases = {
        zh: useCaseResults.zh,
        ja: useCaseResults.ja,
        ko: useCaseResults.ko,
        en: useCaseResults.english  // 注意这里改成了'en'而不是'english'，保持一致性
      };
      
      return NextResponse.json({ 
        success: true, 
        data: {
          id: response.rows[0].id,
          name: formData.name,
          description: description,
          useCases: formattedUseCases
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("数据库或接口调用错误:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}