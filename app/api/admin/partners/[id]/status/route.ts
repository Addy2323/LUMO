import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PartnerStatus, Role } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'

const PartnerStatusSchema = z.object({
  partnerType: z.enum(['SUPPLIER', 'LOGISTICS']),
  status: z.enum(['PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'TERMINATED']),
  reason: z.string().optional(),
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
    const result = PartnerStatusSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    const { partnerType, status, reason } = result.data
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || undefined

    const updated = await prisma.$transaction(async (tx) => {
      let profile
      if (partnerType === 'SUPPLIER') {
        profile = await tx.supplierProfile.update({
          where: { id },
          data: { partnerStatus: status as PartnerStatus },
        })
      } else {
        profile = await tx.logisticsProfile.update({
          where: { id },
          data: { partnerStatus: status as PartnerStatus },
        })
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          userRole: user.role,
          action: 'PARTNER_OPERATIONAL_STATUS_CHANGED',
          targetResource: `${partnerType.toLowerCase()}_profile:${id}`,
          details: `Admin ${user.name} changed partner status to ${status}. Reason: ${reason || 'N/A'}`,
          ipAddress,
        },
      })

      return profile
    })

    return NextResponse.json({ success: true, profile: updated })
  } catch (error: unknown) {
    console.error('[API PARTNER STATUS CHANGE ERROR]', error)
    return NextResponse.json({ error: 'Failed to update partner status.' }, { status: 500 })
  }
}
