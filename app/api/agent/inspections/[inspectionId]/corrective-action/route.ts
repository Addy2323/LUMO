import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma'

// POST /api/agent/inspections/[inspectionId]/corrective-action
export async function POST(req: NextRequest, { params }: { params: Promise<{ inspectionId: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!
  const { user } = auth

    const { inspectionId } = await params

  try {
    const body = await req.json()
    const { supplierName, defectSummary, requiredAction, deadline, replacementQty } = body

    const inspection = await (prisma as any).qualityInspection?.findFirst({
      where: {
        OR: [{ id: inspectionId }, { inspectionRef: inspectionId }],
      },
    })

    if (!inspection) {
      return NextResponse.json({ success: false, error: 'Inspection not found' }, { status: 404 })
    }

    const actionRef = `CAR-${Date.now().toString().slice(-6)}`

    const action = await (prisma as any).inspectionCorrectiveAction?.create({
      data: {
        inspectionId: inspection.id,
        actionRef,
        supplierName: supplierName || 'Supplier',
        defectSummary: defectSummary || 'Quality Audit Defect Correction Request',
        requiredAction: requiredAction || 'Rework or Replace Defective Items',
        deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        replacementQty: Number(replacementQty || 0),
        status: 'Sent to Supplier',
      },
    })

    // Update inspection status to Reinspection Required or Supplier Rework Requested
    await (prisma as any).qualityInspection?.update({
      where: { id: inspection.id },
      data: {
        status: 'Reinspection Required',
        auditLogs: {
          create: {
            actorId: user?.id || 'agent',
            actorName: user?.name || 'Agent',
            role: user?.role || 'AGENT',
            action: 'CORRECTIVE_ACTION_CREATED',
            previousStatus: inspection.status,
            newStatus: 'Reinspection Required',
            reason: `Issued Corrective Action Request ${actionRef} to ${supplierName}`,
          },
        },
      },
    })

    return NextResponse.json({ success: true, correctiveAction: action })
  } catch (err: any) {
    console.error(`POST /api/agent/inspections/${inspectionId}/corrective-action error:`, err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to create corrective action' }, { status: 500 })
  }
}
