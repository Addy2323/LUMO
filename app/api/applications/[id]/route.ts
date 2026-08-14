import { NextRequest, NextResponse } from 'next/server'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const application = await prisma.partnerApplication.findUnique({
      where: { id },
      include: {
        documents: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        supplierProfile: true,
        logisticsProfile: true,
        verificationChecks: user.role === Role.ADMIN ? true : false,
        reviewNotes: user.role === Role.ADMIN ? true : false,
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Ownership check (unless user is ADMIN)
    if (application.userId !== user.id && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ application })
  } catch (error: unknown) {
    console.error('[API APPLICATION DETAIL GET ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch application detail.' }, { status: 500 })
  }
}
