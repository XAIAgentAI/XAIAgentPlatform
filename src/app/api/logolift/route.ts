import { NextRequest, NextResponse } from "next/server";



const translateToEnglish = async (text: string) => {
  console.log('logolift 用户输入:', text);
  
  const url = "https://www.degpt.ai/api/v1/chat/completion/proxy"
  let headers = {
        "content-type": "application/json",
        "Authorization": `Bearer ${process.env.Translate_TOKEN}`,
        "sec-ch-ua": "Google Chrome;v=135, Not-A.Brand;v=8, Chromium;v=135",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "macOS"
    }
  let prompt = (
        `Please translate the following sentence into English, only give me the translated sentence, 
        please, you can not say anything else besides the translated sentence. For example, if I say 
        "你好", you just response me one word---"hello". Ok, here is the sentence that I want you "
        to translate, follow the rule I described. My sentence is : ${text} `
    )

  let payload = {
        "model": "qwen3-235b-a22b",
        "messages": [{"role": "user", "content": prompt}],
        "project": "DecentralGPT",
        "stream": false,
        "enable_thinking": false,
    }
   let res =  await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })
    const data = await res.json();
    const translatedText = data?.choices?.[0]?.message?.content;
    console.log('logolift 用户输入翻译后:', translatedText);
    return translatedText
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    body.prompt = `生成一个logo，${ body.prompt}`
    const prompt = await translateToEnglish(body.prompt)
    const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
    // 
    if (!WAVESPEED_API_KEY) {
      console.error("Your API_KEY is not set, you can check it in Access Keys");
      return;
    }
    const url = "https://api.wavespeed.ai/api/v3/wavespeed-ai/flux-dev";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${WAVESPEED_API_KEY}`
    };
    const payload = {
      "strength": 0.8,
      "size": "1024*1024",
      "num_inference_steps": 28,
      "seed": -1,
      "guidance_scale": 5,
      "num_images": 1,
      "output_format": "jpeg",
      "enable_base64_output": true,
      "enable_sync_mode": false,
      "prompt": prompt
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const result = await response.json();
        const requestId = result.data.id;
        console.log(`Task submitted successfully. Request ID: ${requestId}`);
        while (true) {  
          const response = await fetch(
            `https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`, 
            { 
              headers: {
              "Authorization": `Bearer ${WAVESPEED_API_KEY}`
            } 
          });
          const result = await response.json();
          
          if (response.ok) {
            const data = result.data;
            const status = data.status;
            if (status === "completed") {
              const resultUrl = data.outputs[0];
              const imageRes = await fetch(resultUrl);
              const imageBuffer = await imageRes.arrayBuffer()
              return new NextResponse(imageBuffer, {
                status: 200,
                headers: {
                  "Content-Type": "image/jpeg",
                  "Content-Disposition": 'inline; filename="generated-image.jpg"',
                },
              });
            } else if (status === "failed") {
              console.error("Task failed:", data.error);
              return NextResponse.json(
                { error: `生成失败: ${data.error}` },
                { status: response.status }
              );
            } else {
              console.log("Task still processing. Status:", status);
            }
          } else {
            return NextResponse.json(
              { error: `生成失败: ${result}` },
              { status: response.status }
            );
          }

          await new Promise(resolve => setTimeout(resolve, 0.1 * 1000));
        }
      } else {
        const error = await response.text();
        return NextResponse.json(
          { error: `大模型调用失败: ${error}` },
          { status: response.status }
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: `服务器内部错误: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: `服务器内部错误: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
