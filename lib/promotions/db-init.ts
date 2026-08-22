import { prisma } from '@/lib/db'

let isInitialized = false

/**
 * Automatically creates the promotions and promotion_interactions tables in PostgreSQL
 * if they do not already exist, preventing 500 errors on databases where prisma db push hasn't been run yet.
 */
export async function ensurePromotionsTable(): Promise<void> {
  if (isInitialized) return

  try {
    // 1. Create Enums if they don't exist
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `).catch(() => {})

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "PromotionPlacement" AS ENUM ('ENTRY_POPUP', 'HOMEPAGE_BANNER', 'MARKETPLACE_BANNER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `).catch(() => {})

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "PromotionAudience" AS ENUM ('ALL_VISITORS', 'GUESTS_ONLY', 'LOGGED_IN_CUSTOMERS', 'NEW_CUSTOMERS', 'RETURNING_CUSTOMERS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `).catch(() => {})

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "DisplayFrequency" AS ENUM ('EVERY_VISIT', 'ONCE_PER_SESSION', 'ONCE_PER_DAY', 'ONCE_PER_WEEK', 'ONCE_PER_PROMOTION');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `).catch(() => {})

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "PromotionInteractionEvent" AS ENUM ('IMPRESSION', 'CLICK', 'DISMISS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `).catch(() => {})

    // 2. Create Promotions Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "promotions" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "subtitle" TEXT,
        "description" TEXT NOT NULL,
        "desktopImageUrl" TEXT NOT NULL,
        "mobileImageUrl" TEXT,
        "imageAltText" TEXT,
        "buttonText" TEXT NOT NULL DEFAULT 'Explore the Offer',
        "buttonUrl" TEXT NOT NULL DEFAULT '/marketplace',
        "secondaryButtonText" TEXT,
        "secondaryButtonUrl" TEXT,
        "backgroundColor" TEXT NOT NULL DEFAULT '#FFF8F2',
        "textColor" TEXT NOT NULL DEFAULT '#0B1F3A',
        "buttonColor" TEXT NOT NULL DEFAULT '#FF6B00',
        "placement" "PromotionPlacement" NOT NULL DEFAULT 'ENTRY_POPUP',
        "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
        "priority" INTEGER NOT NULL DEFAULT 0,
        "audience" "PromotionAudience" NOT NULL DEFAULT 'ALL_VISITORS',
        "displayFrequency" "DisplayFrequency" NOT NULL DEFAULT 'EVERY_VISIT',
        "delaySeconds" INTEGER NOT NULL DEFAULT 2,
        "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "endAt" TIMESTAMP(3) NOT NULL,
        "timezone" TEXT NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
        "dismissible" BOOLEAN NOT NULL DEFAULT true,
        "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
        "impressions" INTEGER NOT NULL DEFAULT 0,
        "clicks" INTEGER NOT NULL DEFAULT 0,
        "dismissals" INTEGER NOT NULL DEFAULT 0,
        "createdById" TEXT,
        "publishedById" TEXT,
        "publishedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 3. Create Interactions Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "promotion_interactions" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "promotionId" TEXT NOT NULL,
        "userId" TEXT,
        "anonymousSessionId" TEXT,
        "event" "PromotionInteractionEvent" NOT NULL,
        "deviceType" TEXT DEFAULT 'DESKTOP',
        "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "metadata" JSONB,
        CONSTRAINT "promotion_interactions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `).catch(() => {})

    // 4. Create Indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "promotions_status_placement_startAt_endAt_priority_idx" ON "promotions"("status", "placement", "startAt", "endAt", "priority");
    `).catch(() => {})

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "promotions_startAt_endAt_idx" ON "promotions"("startAt", "endAt");
    `).catch(() => {})

    isInitialized = true
  } catch (err) {
    console.warn('[PROMOTIONS DB INIT WARNING]', err)
  }
}
