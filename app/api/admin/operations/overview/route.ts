import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [
      paidOrdersCount,
      unassignedOrdersCount,
      processingOrdersCount,
      shipmentsInTransitCount,
      openDisputesCount,
      escrowAgg,
    ] = await Promise.all([
      prisma.order.count({ where: { status: 'PAID' } }),
      prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.shipment.count({ where: { status: { contains: 'Transit' } } }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.escrowLedger.aggregate({
        where: { status: 'HELD' },
        _sum: { amountTZS: true },
      }),
    ])

    const pendingSettlementsTZS = Number(escrowAgg._sum.amountTZS || 0)

    return NextResponse.json({
      success: true,
      data: {
        paidOrders: paidOrdersCount,
        unassignedOrders: unassignedOrdersCount,
        slaAtRisk: processingOrdersCount,
        shipmentsInTransit: shipmentsInTransitCount,
        pendingSettlementsTZS,
        openDisputes: openDisputesCount,
        reportingPeriod: 'vs yesterday',
      },
    })
  } catch (error) {
    console.error('Error fetching admin operations overview:', error)
    return NextResponse.json({
      success: false,
      data: {
        paidOrders: 0,
        unassignedOrders: 0,
        slaAtRisk: 0,
        shipmentsInTransit: 0,
        pendingSettlementsTZS: 0,
        openDisputes: 0,
        reportingPeriod: 'vs yesterday',
      },
    })
  }
}
