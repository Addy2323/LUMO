import { prisma } from '@/lib/db'

export interface CreateInAppParams {
  userId: string
  eventType: string
  title: string
  body?: string
  resourceType?: string
  resourceId?: string
}

/**
 * Creates an in-app notification record for a user.
 */
export async function createInAppNotification(params: CreateInAppParams, tx?: any) {
  const db = tx || prisma
  try {
    return await db.inAppNotification.create({
      data: {
        userId: params.userId,
        eventType: params.eventType,
        title: params.title,
        body: params.body || null,
        resourceType: params.resourceType || 'ORDER',
        resourceId: params.resourceId || null,
        isRead: false,
      },
    })
  } catch (error) {
    console.error('[IN-APP NOTIFICATION ERROR]', error)
    return null
  }
}

/**
 * Fetch unread in-app notifications for a user.
 */
export async function getUnreadNotifications(userId: string, limit: number = 20) {
  try {
    return await prisma.inAppNotification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  } catch (error) {
    console.error('[GET IN-APP NOTIFICATIONS ERROR]', error)
    return []
  }
}
