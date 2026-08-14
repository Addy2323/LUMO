import { NextRequest, NextResponse } from 'next/server'
import { ApplicationStatus, ApplicationType, Role } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Administrator access required.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get('status') as ApplicationStatus | null
    const typeParam = searchParams.get('type') as ApplicationType | null

    const applications = await prisma.partnerApplication.findMany({
      where: {
        ...(statusParam ? { status: statusParam } : {}),
        ...(typeParam ? { applicationType: typeParam } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        assignedReviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        documents: true,
        supplierProfile: true,
        logisticsProfile: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ applications })
  } catch (error: unknown) {
    console.error('[API ADMIN APPLICATIONS LIST ERROR]', error)
    return NextResponse.json({ error: 'Failed to list applications.' }, { status: 500 })
  }
}
