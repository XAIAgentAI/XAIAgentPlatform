import { writeFile } from 'fs/promises';
import { join } from 'path';
import { ApiError } from './error';

const UPLOAD_DIR = join(process.cwd(), 'public/uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export async function uploadFile(file: File): Promise<string> {
  // 验证文件大小
  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError(400, '文件大小不能超过5MB');
  }

  // 验证文件类型
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new ApiError(400, '不支持的文件类型');
  }

  // 生成文件名
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = join(UPLOAD_DIR, fileName);

  try {
    // 确保上传目录存在
    await ensureDir(UPLOAD_DIR);

    // 写入文件
    const buffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(buffer));

    // 返回文件URL
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error('文件上传失败:', error);
    throw new ApiError(500, '文件上传失败');
  }
}

async function ensureDir(dir: string) {
  try {
    await import('fs/promises').then(fs => fs.mkdir(dir, { recursive: true }));
  } catch (error) {
    if ((error as any).code !== 'EEXIST') {
      throw error;
    }
  }
} 