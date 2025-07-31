import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LLM_URL = process.env.LLM_URL || '';
const LLM_AUTH = process.env.LLM_AUTH || '';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, targetLanguages } = body;
        if (!text || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
            return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
        }

        // 构造json格式示例
        const jsonExample = targetLanguages.map(lang => `\"${lang}\":\"\"`).join(', ');
        const formatExample = `{${jsonExample}}`;

        // 动态构造prompt
        const langList = targetLanguages.join('、');
        const prompt = `请将下列内容分别翻译为${langList}，并以如下JSON格式返回：${formatExample}。只返回JSON，不要多余解释。\n\n“${text}”`;

        // 请求LLM
        const llmRes = await fetch(LLM_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': LLM_AUTH, 
            },
            body: JSON.stringify({
                model: 'qwen3-235b-a22b',
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                project: 'DecentralGPT',
                max_tokens: 2000,
                enable_thinking: false
            })
        });

        console.log("llmRes", llmRes);
        

        if (!llmRes.ok) {
            return NextResponse.json({ error: '翻译失败' }, { status: 400 });
        }

        const llmData = await llmRes.json();
        const rawText = llmData.choices?.[0]?.message?.content || '';
        let result: Record<string, string> = {};
        try {
            // 提取JSON部分
            const jsonStart = rawText.indexOf('{');
            const jsonEnd = rawText.lastIndexOf('}') + 1;
            const jsonString = rawText.slice(jsonStart, jsonEnd);
            result = JSON.parse(jsonString);
        } catch {
            return NextResponse.json({ error: 'AI返回内容解析失败' }, { status: 400 });
        }

        // 检查所有目标语言都返回了
        for (const lang of targetLanguages) {
            if (!result[lang]) {
                return NextResponse.json({ error: `缺少${lang}翻译` }, { status: 400 });
            }
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: '翻译失败' }, { status: 400 });
    }
}