import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { prisma } from '@/lib/db'

/**
 * GET /api/notifications — returns in-app notifications for authenticated user
 */
export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user } = auth
  const { searchParams } = req.nextUrl
  const unreadOnly = searchParams.get('unreadOnly') === 'true'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit

  const where: any = { userId: user.id }
  if (unreadOnly) where.isRead = false

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.inAppNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.inAppNotification.count({ where }),
    prisma.inAppNotification.count({ where: { userId: user.id, isRead: false } }),
  ])

  return NextResponse.json({
    notifications,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

/**
 * POST /api/notifications/read-all — mark all notifications read
 */
export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  await prisma.inAppNotification.updateMany({
    where: { userId: auth.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
