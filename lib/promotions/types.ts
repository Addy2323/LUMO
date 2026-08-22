/**
 * Promotional System Types & Enums
 * Standalone constant objects & types compatible with Prisma Client and Zod.
 */

export const PromotionStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  EXPIRED: 'EXPIRED',
  ARCHIVED: 'ARCHIVED',
} as const

export type PromotionStatus = (typeof PromotionStatus)[keyof typeof PromotionStatus]

export const PromotionPlacement = {
  ENTRY_POPUP: 'ENTRY_POPUP',
  HOMEPAGE_BANNER: 'HOMEPAGE_BANNER',
  MARKETPLACE_BANNER: 'MARKETPLACE_BANNER',
} as const

export type PromotionPlacement = (typeof PromotionPlacement)[keyof typeof PromotionPlacement]

export const PromotionAudience = {
  ALL_VISITORS: 'ALL_VISITORS',
  GUESTS_ONLY: 'GUESTS_ONLY',
  LOGGED_IN_CUSTOMERS: 'LOGGED_IN_CUSTOMERS',
  NEW_CUSTOMERS: 'NEW_CUSTOMERS',
  RETURNING_CUSTOMERS: 'RETURNING_CUSTOMERS',
} as const

export type PromotionAudience = (typeof PromotionAudience)[keyof typeof PromotionAudience]

export const DisplayFrequency = {
  EVERY_VISIT: 'EVERY_VISIT',
  ONCE_PER_SESSION: 'ONCE_PER_SESSION',
  ONCE_PER_DAY: 'ONCE_PER_DAY',
  ONCE_PER_WEEK: 'ONCE_PER_WEEK',
  ONCE_PER_PROMOTION: 'ONCE_PER_PROMOTION',
} as const

export type DisplayFrequency = (typeof DisplayFrequency)[keyof typeof DisplayFrequency]

export const PromotionInteractionEvent = {
  IMPRESSION: 'IMPRESSION',
  CLICK: 'CLICK',
  DISMISS: 'DISMISS',
} as const

export type PromotionInteractionEvent = (typeof PromotionInteractionEvent)[keyof typeof PromotionInteractionEvent]

export interface PromotionRecord {
  id: string
  title: string
  subtitle?: string | null
  description: string
  desktopImageUrl: string
  mobileImageUrl?: string | null
  imageAltText?: string | null
  buttonText: string
  buttonUrl: string
  secondaryButtonText?: string | null
  secondaryButtonUrl?: string | null
  backgroundColor: string
  textColor: string
  buttonColor: string
  placement: PromotionPlacement
  status: PromotionStatus
  priority: number
  audience: PromotionAudience
  displayFrequency: DisplayFrequency
  delaySeconds: number
  startAt: Date | string
  endAt: Date | string
  timezone: string
  dismissible: boolean
  openInNewTab: boolean
  impressions: number
  clicks: number
  dismissals: number
  createdById?: string | null
  publishedById?: string | null
  publishedAt?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}
