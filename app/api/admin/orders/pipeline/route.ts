import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { name: true, companyName: true } },
        shipments: { select: { status: true, trackingNumber: true } },
      },
    })

    const formattedOrders = orders.map((o) => {
      let stage = 'New'
      if (o.status === 'PAID') stage = 'Paid'
      else if (o.status === 'PENDING_PAYMENT') stage = 'Sales Review'
      else if (o.status === 'PROCESSING') stage = 'Supplier Processing'
      else if (o.status === 'SHIPPED') stage = 'Logistics'
      else if (o.status === 'DELIVERED' || o.status === 'COMPLETED') stage = 'Delivered'

      return {
        id: o.id,
        ref: o.orderNumber,
        customer: o.buyer?.companyName || o.buyer?.name || 'Customer',
        amountTZS: Number(o.totalAmountTZS),
        location: (o.shippingAddress as any)?.city || 'Dar es Salaam',
        stage,
        priority: o.status === 'PAID' ? 'Normal' : 'High',
        assigned: o.shipments[0]?.trackingNumber ? `Waybill: ${o.shipments[0].trackingNumber}` : undefined,
      }
    })

    const stagesCount = {
      New: formattedOrders.filter((o) => o.stage === 'New').length,
      Paid: formattedOrders.filter((o) => o.stage === 'Paid').length,
      'Sales Review': formattedOrders.filter((o) => o.stage === 'Sales Review').length,
      'Agent Assigned': 0,
      'Supplier Processing': formattedOrders.filter((o) => o.stage === 'Supplier Processing').length,
      Inspection: 0,
      Logistics: formattedOrders.filter((o) => o.stage === 'Logistics').length,
      Delivered: formattedOrders.filter((o) => o.stage === 'Delivered').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        stages: stagesCount,
        orders: formattedOrders,
      },
    })
  } catch (error) {
    console.error('Error fetching admin order pipeline:', error)
    return NextResponse.json({
      success: false,
      data: {
        stages: {
          New: 0,
          Paid: 0,
          'Sales Review': 0,
          'Agent Assigned': 0,
          'Supplier Processing': 0,
          Inspection: 0,
          Logistics: 0,
          Delivered: 0,
        },
        orders: [],
      },
    })
  }
}
