import { NextRequest, NextResponse } from "next/server";

const defaultParams = {
  steps: 20,
  negative_prompt: "small text, small print, small footnote, small caption",
  guidance_scale: 30,
  width: 512,
  height: 512,
  seed: -1,
};
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    body.prompt = `生成一个logo，${ body.prompt}`
    const params = {...defaultParams, ...body}
    // 调用生图接口
    const apiResponse = await fetch("http://122.99.183.50:30000/generate/", {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "content-type": "application/json",
      },
    });
    // 处理错误响应
    if (!apiResponse.ok) {
      const error = await apiResponse.text();
      return NextResponse.json(
        { error: `生成失败: ${error}` },
        { status: apiResponse.status }
      );
    }
    // 获取生成的图片
    const imageBlob = await apiResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // 返回图片数据
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'inline; filename="generated-image.png"',
      },
    });
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
