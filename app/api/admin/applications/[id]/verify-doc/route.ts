import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'

const DocVerifySchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
  verifiedStatus: z.boolean(),
  rejectionReason: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Administrator access required.' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const result = DocVerifySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    const { documentId, verifiedStatus, rejectionReason } = result.data

    const document = await prisma.applicationDocument.update({
      where: { id: documentId, applicationId: id },
      data: {
        verifiedStatus,
        rejectionReason: verifiedStatus ? null : rejectionReason,
      },
    })

    return NextResponse.json({ success: true, document })
  } catch (error: unknown) {
    console.error('[API ADMIN VERIFY DOC ERROR]', error)
    return NextResponse.json({ error: 'Failed to update document verification status.' }, { status: 500 })
  }
}
