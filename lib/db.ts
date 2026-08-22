import { PrismaClient } from '@prisma/client'

export type ExtendedPrismaClient = PrismaClient & {
  promotion: any
  promotionInteraction: any
}

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined
}

export const db: ExtendedPrismaClient =
  (globalForPrisma.prisma as ExtendedPrismaClient) ??
  (new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }) as ExtendedPrismaClient)

export const prisma = db

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db


