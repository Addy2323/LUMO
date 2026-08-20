import { NextRequest, NextResponse } from 'next/server'
import { OrderStatus, AssignmentRole, AssignmentStatus } from '@prisma/client'
import { prisma } from '@/lib/db'

type PipelineStage =
  | 'New'
  | 'Paid'
  | 'Sales Review'
  | 'Agent Assigned'
  | 'Supplier Processing'
  | 'Inspection'
  | 'Logistics'
  | 'Delivered'

export async function GET() {
  try {
    let dbOrders: any[] = []
    try {
      dbOrders = await prisma.order.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { name: true, companyName: true } },
          shipments: { select: { status: true, trackingNumber: true } },
          items: { include: { product: { select: { title: true, imageUrl: true, slug: true } } } },
        },
      })
    } catch (dbErr) {
      console.warn('PostgreSQL order query failed:', dbErr)
    }

    const formattedDbOrders = dbOrders.map((o) => {
      const addrObj = (typeof o.shippingAddress === 'object' && o.shippingAddress) ? (o.shippingAddress as any) : {}

      let stage: PipelineStage = addrObj.stage || 'Paid'
      if (!addrObj.stage) {
        if (o.status === 'PAID') stage = 'Paid'
        else if (o.status === 'PENDING_PAYMENT') stage = 'Sales Review'
        else if (o.status === 'PROCESSING') stage = 'Supplier Processing'
        else if (o.status === 'SHIPPED') stage = 'Logistics'
        else if (o.status === 'DELIVERED' || o.status === 'COMPLETED') stage = 'Delivered'
        else stage = 'New'
      }

      const firstItem = o.items?.[0]
      let rawImg = firstItem?.product?.imageUrl || ''
      if (rawImg.includes('unsplash.com')) rawImg = ''
      const sanitizedImg = rawImg.startsWith('//') ? `https:${rawImg}` : rawImg

      const itemTitle = firstItem?.product?.title || 'Wholesale B2B Goods'

      const items = o.items
        ? o.items.map((i: any) => {
            let itemImg = i.product?.imageUrl || ''
            if (itemImg.includes('unsplash.com')) itemImg = ''
            if (itemImg.startsWith('//')) itemImg = `https:${itemImg}`
            return {
              id: i.id,
              title: i.product?.title || 'Wholesale B2B Goods',
              imageUrl: itemImg,
              quantity: i.quantity,
              variant: i.selectedVariant || '',
              unitPriceTZS: Number(i.unitPriceTZS),
              totalPriceTZS: Number(i.totalPriceTZS),
            }
          })
        : []

      const assignedLabel = addrObj.assignedTo || (o.shipments[0]?.trackingNumber ? `Waybill: ${o.shipments[0].trackingNumber}` : undefined)

      return {
        id: o.id,
        ref: o.orderNumber,
        customer: o.buyer?.companyName || o.buyer?.name || 'Customer',
        amountTZS: Number(o.totalAmountTZS),
        subtotalTZS: Number(o.subtotalTZS),
        shippingFeeTZS: Number(o.shippingFeeTZS),
        taxAmountTZS: Number(o.taxAmountTZS),
        paymentMethod: o.paymentMethod || 'LUMO Payment Protection',
        paymentStatus: o.status,
        createdAt: o.createdAt,
        location: addrObj.city || 'Dar es Salaam',
        shippingAddress: o.shippingAddress,
        stage: stage as PipelineStage,
        priority: o.status === 'PAID' ? ('Normal' as const) : ('High' as const),
        assigned: assignedLabel,
        image: sanitizedImg,
        itemTitle,
        items,
      }
    })

    const stagesCount = {
      New: formattedDbOrders.filter((o) => o.stage === 'New').length,
      Paid: formattedDbOrders.filter((o) => o.stage === 'Paid').length,
      'Sales Review': formattedDbOrders.filter((o) => o.stage === 'Sales Review').length,
      'Agent Assigned': formattedDbOrders.filter((o) => o.stage === 'Agent Assigned').length,
      'Supplier Processing': formattedDbOrders.filter((o) => o.stage === 'Supplier Processing').length,
      Inspection: formattedDbOrders.filter((o) => o.stage === 'Inspection').length,
      Logistics: formattedDbOrders.filter((o) => o.stage === 'Logistics').length,
      Delivered: formattedDbOrders.filter((o) => o.stage === 'Delivered').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        stages: stagesCount,
        orders: formattedDbOrders,
      },
    })
  } catch (error) {
    console.error('Error fetching admin order pipeline:', error)
    return NextResponse.json({
      success: true,
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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, stage, assigneeId, assigneeName, assignmentRole } = body

    if (!orderId || !stage) {
      return NextResponse.json({ error: 'orderId and stage are required' }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found in database' }, { status: 404 })
    }

    // Map pipeline stage to Prisma OrderStatus
    let targetStatus: OrderStatus = order.status
    if (stage === 'New') targetStatus = OrderStatus.PENDING_PAYMENT
    else if (stage === 'Paid' || stage === 'Sales Review' || stage === 'Agent Assigned') targetStatus = OrderStatus.PAID
    else if (stage === 'Supplier Processing' || stage === 'Inspection') targetStatus = OrderStatus.PROCESSING
    else if (stage === 'Logistics') targetStatus = OrderStatus.SHIPPED
    else if (stage === 'Delivered') targetStatus = OrderStatus.DELIVERED

    const existingAddr = (typeof order.shippingAddress === 'object' && order.shippingAddress) ? (order.shippingAddress as any) : {}
    const assignedText = assigneeName
      ? `${assignmentRole || 'Assigned'}: ${assigneeName}`
      : existingAddr.assignedTo || (stage === 'Agent Assigned' ? 'Agent: Sourcing Agent' : undefined)

    const updatedAddr = {
      ...existingAddr,
      stage,
      ...(assignedText ? { assignedTo: assignedText } : {}),
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: targetStatus,
        shippingAddress: updatedAddr,
      },
    })

    // Create OrderAssignment record if assignee or role is provided
    if (assigneeId || assignmentRole) {
      const roleStr = String(assignmentRole || '').toUpperCase()
      let enumRole: AssignmentRole = AssignmentRole.SALES
      if (roleStr.includes('AGENT')) enumRole = AssignmentRole.AGENT
      else if (roleStr.includes('SUPPLIER')) enumRole = AssignmentRole.SUPPLIER
      else if (roleStr.includes('INSPECT')) enumRole = AssignmentRole.INSPECTOR
      else if (roleStr.includes('LOGISTIC')) enumRole = AssignmentRole.LOGISTICS

      await prisma.orderAssignment.create({
        data: {
          orderId: order.id,
          assignmentRole: enumRole,
          assigneeId: assigneeId || undefined,
          status: AssignmentStatus.ACCEPTED,
          priority: 'NORMAL',
          reason: `Assigned via Admin Pipeline (${stage})`,
          acceptedAt: new Date(),
        },
      }).catch((err) => console.warn('OrderAssignment record creation warning:', err))
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        stage,
        assignedTo: assignedText,
      },
    })
  } catch (error: any) {
    console.error('Failed to update pipeline order stage:', error)
    return NextResponse.json({ error: error.message || 'Failed to update order stage' }, { status: 500 })
  }
}
