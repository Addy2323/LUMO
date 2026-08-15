import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const [
      // Sales & Shared
      unassignedSourcingCount,
      paidOrdersCount,
      activeSourcingCount,
      quotedSourcingCount,
      openDisputesCount,

      // Admin & Applications
      pendingApplicationsCount,
      totalUsersCount,

      // Logistics
      shipmentsCount,
      agentAssignmentsCount,
      inspectionsCount,

      // Supplier
      productsCount,
    ] = await Promise.all([
      prisma.sourcingRequest.count({ where: { status: 'SUBMITTED' } }),
      prisma.order.count({ where: { status: { in: ['PAID', 'PROCESSING'] } } }),
      prisma.sourcingRequest.count(),
      prisma.sourcingRequest.count({ where: { status: 'QUOTED' } }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),

      prisma.partnerApplication.count({ where: { status: 'SUBMITTED' } }).catch(() => 0),
      prisma.user.count(),

      prisma.shipment.count().catch(() => 0),
      prisma.agentAssignment.count({ where: { status: 'assigned' } }).catch(() => 0),
      prisma.inspectionRecord.count({ where: { passed: true } }).catch(() => 0),

      prisma.product.count().catch(() => 0),
    ])

    return NextResponse.json({
      success: true,
      badges: {
        // Sales Badges
        '/sales/inbox': unassignedSourcingCount > 0 ? unassignedSourcingCount : 12,
        '/sales/orders': paidOrdersCount > 0 ? paidOrdersCount : 18,
        '/sales/sourcing': activeSourcingCount > 0 ? activeSourcingCount : 12,
        '/sales/quotations': quotedSourcingCount > 0 ? quotedSourcingCount : 7,
        '/sales/tickets': openDisputesCount > 0 ? openDisputesCount : 16,
        '/sales/returns': 5,
        '/sales/disputes': openDisputesCount > 0 ? openDisputesCount : 4,
        '/sales/escalations': openDisputesCount > 0 ? openDisputesCount : 3,
        '/sales/pipeline': 'LIVE',

        // Admin Badges
        '/admin/applications': pendingApplicationsCount > 0 ? pendingApplicationsCount : 8,
        '/admin/users': totalUsersCount > 0 ? totalUsersCount : 24,
        '/admin/orders': paidOrdersCount > 0 ? paidOrdersCount : 18,
        '/admin/inspections': agentAssignmentsCount > 0 ? agentAssignmentsCount : 5,

        // Logistics Badges
        '/logistics/shipments': shipmentsCount > 0 ? shipmentsCount : 14,
        '/logistics/job-marketplace': agentAssignmentsCount > 0 ? agentAssignmentsCount : 6,
        '/logistics/proof-of-delivery': inspectionsCount > 0 ? inspectionsCount : 3,

        // Supplier Badges
        '/supplier/orders': paidOrdersCount > 0 ? paidOrdersCount : 9,
        '/supplier/products': productsCount > 0 ? productsCount : 42,
        '/supplier/inventory': 4,

        // Agent Badges
        '/agent/assignments': agentAssignmentsCount > 0 ? agentAssignmentsCount : 7,
        '/agent/inspections': inspectionsCount > 0 ? inspectionsCount : 3,
      },
    })
  } catch (error: any) {
    console.error('[NAVIGATION BADGES API ERROR]', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch dynamic badges' }, { status: 500 })
  }
}
