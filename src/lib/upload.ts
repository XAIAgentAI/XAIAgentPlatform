// File upload functionality temporarily disabled
export async function uploadFile(file: File): Promise<string> {
  return '';
}

/*
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { ApiError } from './error';

const UPLOAD_DIR = join(process.cwd(), 'public/uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export async function uploadFile(file: File): Promise<string> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError(400, 'File size cannot exceed 5MB');
  }

  // Validate file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new ApiError(400, 'Unsupported file type');
  }

  // Generate file name
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = join(UPLOAD_DIR, fileName);

  try {
    // Ensure upload directory exists
    await ensureDir(UPLOAD_DIR);

    // Write file
    const buffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(buffer));

    // Return file URL
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error('File upload failed:', error);
    throw new ApiError(500, 'File upload failed');
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
*/ 