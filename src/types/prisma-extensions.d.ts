import { Prisma, PrismaClient } from '@prisma/client';

declare module '@prisma/client' {
  export interface PrismaClient {
    task: Prisma.TaskDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation, any>;
  }

  namespace Prisma {
    export interface HistoryCreateInput {
      taskId?: string;
    }

    export interface HistoryUncheckedCreateInput {
      taskId?: string;
    }
  }
} 