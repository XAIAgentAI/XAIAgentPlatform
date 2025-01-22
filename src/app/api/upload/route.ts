import { NextResponse } from 'next/server';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
// import { uploadFile } from '@/lib/upload';
import { getUserId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new ApiError(401, '未授权');
    }

    // 临时返回成功响应，上传功能暂时禁用
    return createSuccessResponse({ url: '' }, '上传功能暂时禁用');

    // const formData = await request.formData();
    // const file = formData.get('file') as File;

    // if (!file) {
    //   throw new ApiError(400, '请选择要上传的文件');
    // }

    // const fileUrl = await uploadFile(file);

    // return createSuccessResponse({ url: fileUrl }, '上传成功');
  } catch (error) {
    return handleError(error);
  }
} 