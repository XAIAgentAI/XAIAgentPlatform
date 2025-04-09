import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // 验证是否包含人脸图片且是否为File类型
    const faceImage = formData.get('face_image');

    if (!faceImage || !(faceImage instanceof File) || faceImage.size === 0) {
      return NextResponse.json(
        { error: '未提供有效的人脸图片' },
        { status: 400 }
      );
    }
 
    console.log(formData);
    // 调用图像生成API
    const apiResponse = await fetch('http://122.99.183.50:8000/generate-image/', {
      method: 'POST',
      body: formData,
      headers: {
        accept: 'image/jpeg',
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
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'inline; filename="generated-image.jpg"',
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: `服务器内部错误: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}