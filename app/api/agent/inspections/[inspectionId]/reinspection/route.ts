import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma'
import { calculateAqlSamplingPlan } from '@/lib/aql-engine'

// POST /api/agent/inspections/[inspectionId]/reinspection
// Create a new inspection linked to the original failed inspection
export async function POST(req: NextRequest, { params }: { params: Promise<{ inspectionId: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!
  const { user } = auth

  const { inspectionId } = await params

  try {
    const parent = await (prisma as any).qualityInspection?.findFirst({
      where: {
        OR: [{ id: inspectionId }, { inspectionRef: inspectionId }],
      },
    })

    if (!parent) {
      return NextResponse.json({ success: false, error: 'Parent inspection not found' }, { status: 404 })
    }

    const reinspectionRef = `RE-${parent.inspectionRef.replace('INS-', '')}`
    const plan = calculateAqlSamplingPlan(parent.lotSize || 100)

    const reinspection = await (prisma as any).qualityInspection?.create({
      data: {
        inspectionRef: reinspectionRef,
        orderId: parent.orderId,
        supplierId: parent.supplierId,
        agentId: user?.id || parent.agentId,
        hub: parent.hub,
        inspectionType: 'Reinspection',
        lotSize: parent.lotSize,
        orderedQty: parent.orderedQty,
        receivedQty: parent.receivedQty,
        sampleSize: plan.suggestedSampleSize,
        inspectedQty: plan.suggestedSampleSize,
        passedQty: plan.suggestedSampleSize,
        inspectionLevel: parent.inspectionLevel,
        aqlConfig: plan,
        status: 'Draft',
        result: 'Pending',
        parentInspectionId: parent.id,
        checklist: parent.checklist,
        notes: `Reinspection following failed inspection ${parent.inspectionRef}`,
        auditLogs: {
          create: {
            actorId: user?.id || 'agent',
            actorName: user?.name || 'Agent',
            role: user?.role || 'AGENT',
            action: 'REINSPECTION_CREATED',
            newStatus: 'Draft',
            reason: `Initialized Reinspection ${reinspectionRef} linked to failed audit ${parent.inspectionRef}`,
          },
        },
      },
    })

    // Update parent reinspectionRef
    await (prisma as any).qualityInspection?.update({
      where: { id: parent.id },
      data: { reinspectionRef },
    })

    return NextResponse.json({ success: true, reinspection })
  } catch (err: any) {
    console.error(`POST /api/agent/inspections/${inspectionId}/reinspection error:`, err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to create reinspection' }, { status: 500 })
  }
}
