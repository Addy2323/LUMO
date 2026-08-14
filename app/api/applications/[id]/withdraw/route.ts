import { NextRequest, NextResponse } from 'next/server'
import { ApplicationStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'

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

    const application = await prisma.partnerApplication.findFirst({
      where: { id, userId: user.id },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    }

    if (
      application.status !== ApplicationStatus.DRAFT &&
      application.status !== ApplicationStatus.SUBMITTED
    ) {
      return NextResponse.json(
        { error: `Cannot withdraw application in ${application.status} status.` },
        { status: 400 }
      )
    }

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.partnerApplication.update({
        where: { id },
        data: { status: ApplicationStatus.WITHDRAWN },
      })

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          previousStatus: application.status,
          newStatus: ApplicationStatus.WITHDRAWN,
          changedById: user.id,
          changedByName: user.name,
          reason: 'Applicant voluntarily withdrew application.',
        },
      })

      return app
    })

    return NextResponse.json({
      success: true,
      message: 'Application has been withdrawn successfully.',
      status: updated.status,
    })
  } catch (error: unknown) {
    console.error('[API WITHDRAW APPLICATION ERROR]', error)
    return NextResponse.json({ error: 'Failed to withdraw application.' }, { status: 500 })
  }
}
