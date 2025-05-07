import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LLM_URL = process.env.LLM_URL || "";

// Default fallback use cases
const DEFAULT_USE_CASES = {
  "en": [
    "Help me brainstorm creative ideas for my project",
    "Assist me in analyzing market trends for my business",
    "Guide me through setting up a new productivity system"
  ],
  "ja": [
    "プロジェクトの創造的なアイデアをブレインストーミングするのを手伝ってください",
    "ビジネスのための市場動向を分析するのを支援してください",
    "新しい生産性システムの設定を案内してください"
  ],
  "ko": [
    "프로젝트를 위한 창의적인 아이디어를 브레인스토밍하는 것을 도와주세요",
    "비즈니스를 위한 시장 동향 분석을 지원해 주세요",
    "새로운 생산성 시스템 설정을 안내해 주세요"
  ],
  "zh": [
    "帮我为项目进行创意头脑风暴",
    "协助我分析业务的市场趋势",
    "指导我建立新的效率系统"
  ]
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { description } = body;

        if (!description) {
            return NextResponse.json({ error: '缺少必要参数 description' }, { status: 400 });
        }

        const prompt = `你是一名产品专家，请基于以下AI代理描述生成3个典型使用场景。严格按照JSON格式返回：

{
  "en": ["Use case 1", "Use case 2", "Use case 3"],
  "ja": ["日本語用例1", "日本語用例2", "日本語用例3"],
  "ko": ["한국어 사용 사례1", "한국어 사용 사례2", "한국어 사용 사례3"],
  "zh": ["中文用例1", "中文用例2", "中文用例3"]
}

要求：
1. 每个用例用一句话描述，以用户人称开头（如"帮我..."）
2. 英文首字母大写
3. 不要包含任何额外解释

AI代理描述: ${description}`;

        let finalResult = DEFAULT_USE_CASES; // Initialize with default values

        try {
            const response = await fetch(LLM_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "Qwen3-235B-A22B-FP8",
                    messages: [{ role: "user", content: prompt }],
                    project: "DecentralGPT",
                    stream: false
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const rawText = data.choices?.[0]?.message?.content || "";

                // Safely extract JSON portion
                try {
                    const jsonStart = Math.max(0, rawText.indexOf("{"));
                    const jsonEnd = Math.max(0, rawText.lastIndexOf("}") + 1);
                    const jsonString = rawText.slice(jsonStart, jsonEnd);

                    const result = JSON.parse(jsonString);

                    // Merge the successful response with defaults (fallback for missing languages)
                    finalResult = {
                        en: result.en || result.english || DEFAULT_USE_CASES.en,
                        ja: result.ja || DEFAULT_USE_CASES.ja,
                        ko: result.ko || DEFAULT_USE_CASES.ko,
                        zh: result.zh || DEFAULT_USE_CASES.zh
                    };
                } catch (parseError) {
                    console.error("解析LLM响应失败:", parseError);
                    // Keep the default values if parsing fails
                }
            } else {
                console.error(`LLM请求失败: ${response.status}`);
                // Keep the default values if request fails
            }
        } catch (llmError) {
            console.error("调用LLM服务失败:", llmError);
            // Keep the default values if LLM call fails
        }

        return NextResponse.json(finalResult, { status: 200 });
    } catch (error) {
        console.error("处理请求失败:", error);
        // Even if everything fails, return the default use cases
        return NextResponse.json(DEFAULT_USE_CASES, { status: 200 });
    }
}