import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'

const MessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const result = MessageSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    const application = await prisma.partnerApplication.findUnique({
      where: { id },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.userId !== user.id && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const msg = await prisma.applicationMessage.create({
      data: {
        applicationId: id,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        message: result.data.message,
      },
    })

    return NextResponse.json({ success: true, message: msg })
  } catch (error: unknown) {
    console.error('[API APPLICATION MESSAGE ERROR]', error)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}
