import { NextResponse } from 'next/server';
import OSS from 'ali-oss';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // 验证文件类型（仅允许图片）
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // 初始化 OSS 客户端
    const client = new OSS({
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
      bucket: process.env.OSS_BUCKET,
      secure: true
    });

    // 转换为 Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 上传到 OSS（路径：chat/时间戳_随机ID.扩展名）
    const fileName = `chat/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${file.name.split('.').pop()}`;
    const result = await client.put(fileName, buffer);
    console.log("Success:",result.url)
    // 返回图片 URL
    return NextResponse.json({ imageUrl: result.url });
  } catch (error) {
    console.error('OSS upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

// 不允许 GET 请求
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}