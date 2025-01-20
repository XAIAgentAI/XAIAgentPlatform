import { headers } from 'next/headers';
import { prisma } from './prisma';

export async function getCurrentUser() {
  const headersList = headers();
  const userId = headersList.get('x-user-id');

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user;
}

export function getUserId(): string | null {
  const headersList = headers();
  return headersList.get('x-user-id');
}

export function getUserAddress(): string | null {
  const headersList = headers();
  return headersList.get('x-user-address');
} 