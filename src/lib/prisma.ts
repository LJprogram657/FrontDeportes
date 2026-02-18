import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const isProd = process.env.NODE_ENV === 'production';
if (isProd && !process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en producción');
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
