import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { prisma } from '@/lib/db'

/**
 * POST /api/notifications/[id]/read — mark single notification as read
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { id } = await params

  const notification = await prisma.inAppNotification.findUnique({
    where: { id },
  })

  if (!notification || notification.userId !== auth.user.id) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
  }

  const updated = await prisma.inAppNotification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  })

  return NextResponse.json({ success: true, notification: updated })
}
