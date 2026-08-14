import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applications = await prisma.partnerApplication.findMany({
      where: { userId: user.id },
      include: {
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

    return NextResponse.json({
      applications: applications.map((app) => ({
        id: app.id,
        applicationType: app.applicationType,
        status: app.status,
        currentStep: app.currentStep,
        submissionDate: app.submissionDate?.toISOString(),
        decisionDate: app.decisionDate?.toISOString(),
        decisionReason: app.decisionReason,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
        documentCount: app.documents.length,
        supplierProfile: app.supplierProfile,
        logisticsProfile: app.logisticsProfile,
      })),
    })
  } catch (error: unknown) {
    console.error('[API APPLICATIONS LIST ERROR]', error)
    return NextResponse.json({ error: 'Failed to list applications.' }, { status: 500 })
  }
}
