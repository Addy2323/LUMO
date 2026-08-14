import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { validateOrderTransition } from '@/lib/orders/state-machine'

const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { id } = await params
  const { user } = auth

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id }, { orderNumber: id }],
    },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, title: true, imageUrl: true, slug: true, supplierId: true },
          },
        },
      },
      shipments: true,
      payments: true,
      disputes: true,
      escrowRecords: true,
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Ownership verification against IDOR vulnerabilities
  if (user.role !== 'ADMIN' && user.role !== 'SALES' && order.buyerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden: You do not own this order' }, { status: 403 })
  }

  const formatted = {
    ...order,
    subtotalTZS: Number(order.subtotalTZS),
    shippingFeeTZS: Number(order.shippingFeeTZS),
    taxAmountTZS: Number(order.taxAmountTZS),
    discountTZS: Number(order.discountTZS),
    totalAmountTZS: Number(order.totalAmountTZS),
    items: order.items
      ? order.items.map((i) => ({
          ...i,
          unitPriceTZS: Number(i.unitPriceTZS),
          totalPriceTZS: Number(i.totalPriceTZS),
        }))
      : [],
  }

  return NextResponse.json(formatted)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  try {
    const { id } = await params
    const { user } = auth
    const body = await req.json()

    const result = UpdateOrderStatusSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid order status payload' }, { status: 400 })
    }

    const targetStatus = result.data.status

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Validate state machine transition & RBAC permissions
    const check = validateOrderTransition(order.status, targetStatus, user.role)
    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: targetStatus },
      })

      // Create Audit Log entry for status transition
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userRole: user.role,
          action: 'ORDER_STATUS_TRANSITION',
          targetResource: `Order:${order.orderNumber}`,
          details: `Transitioned from ${order.status} to ${targetStatus}`,
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
        },
      })

      return updatedOrder
    })

    return NextResponse.json({
      success: true,
      order: {
        id: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.status,
      },
    })
  } catch (error: unknown) {
    console.error('[API ORDER PATCH STATUS ERROR]', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
