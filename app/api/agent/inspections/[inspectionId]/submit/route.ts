import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma'
import { evaluateAqlResult } from '@/lib/aql-engine'

// POST /api/agent/inspections/[inspectionId]/submit
export async function POST(req: NextRequest, { params }: { params: { inspectionId: string } }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!
  const { user } = auth

  const { inspectionId } = params

  try {
    const inspection = await (prisma as any).qualityInspection?.findFirst({
      where: {
        OR: [{ id: inspectionId }, { inspectionRef: inspectionId }],
      },
      include: {
        defects: true,
        evidences: true,
      },
    })

    if (!inspection) {
      return NextResponse.json({ success: false, error: 'Inspection not found' }, { status: 404 })
    }

    // Check completeness validation: 10 photo slots
    const photos = Array.isArray(inspection.evidencePhotos) ? inspection.evidencePhotos : []
    const uploadedPhotosCount = photos.filter((p: any) => Boolean(p.url || p.fileUrl)).length

    const aqlEval = evaluateAqlResult({
      lotSize: inspection.lotSize || 100,
      inspectedQty: inspection.inspectedQty || 80,
      criticalDefects: inspection.criticalDefects || 0,
      majorDefects: inspection.majorDefects || 0,
      minorDefects: inspection.minorDefects || 0,
      uploadedPhotosCount,
      requiredPhotosCount: 10,
    })

    if (aqlEval.decision === 'Incomplete') {
      return NextResponse.json({
        success: false,
        error: aqlEval.reason,
        aqlEvaluation: aqlEval,
      }, { status: 400 })
    }

    const finalStatus = 'Submitted'
    const finalResult = aqlEval.decision // Passed, Conditionally Passed, Failed

    // Update Quality Inspection
    const updatedInspection = await (prisma as any).qualityInspection?.update({
      where: { id: inspection.id },
      data: {
        status: finalStatus,
        result: finalResult,
        aqlConfig: aqlEval.plan,
        updatedAt: new Date(),
        auditLogs: {
          create: {
            actorId: user?.id || 'agent',
            actorName: user?.name || 'Agent',
            role: user?.role || 'AGENT',
            action: 'SUBMITTED',
            previousStatus: inspection.status,
            newStatus: finalStatus,
            reason: `Inspection submitted to LUMO HQ with AQL decision: ${finalResult}. ${aqlEval.reason}`,
          },
        },
      },
      include: {
        defects: true,
        evidences: true,
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })

    // Update associated Order status
    if (inspection.orderId) {
      const newOrderStatus = finalResult === 'Failed' ? 'INSPECTION_FAILED' : 'UNDER_INSPECTION'
      try {
        await (prisma as any).order?.update({
          where: { id: inspection.orderId },
          data: { status: newOrderStatus },
        })
      } catch (e) {
        console.warn('Failed to update order status during inspection submit:', e)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Quality Inspection ${inspection.inspectionRef} submitted successfully! Result: ${finalResult}`,
      inspection: updatedInspection,
      aqlEvaluation: aqlEval,
    })
  } catch (err: any) {
    console.error(`POST /api/agent/inspections/${inspectionId}/submit error:`, err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to submit inspection' }, { status: 500 })
  }
}
