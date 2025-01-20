import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { ApiError } from './error';

const JWT_SECRET = 'xaiagent-jwt-secret-2024';

export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, '未授权');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new ApiError(401, '未授权');
  }
} 