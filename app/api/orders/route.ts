import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma, OrderStatus, PaymentStatus, EscrowStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'

const CreateOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  selectedVariant: z.string().optional(),
})

const CreateOrderSchema = z.object({
  items: z.array(CreateOrderItemSchema).min(1, 'Order must contain at least 1 item'),
  shippingAddress: z.object({
    fullName: z.string(),
    phone: z.string(),
    street: z.string(),
    city: z.string(),
  }),
  paymentMethod: z.string().default('AzamPay Escrow'),
})

export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user } = auth
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const perPage = parseInt(searchParams.get('perPage') || '20', 10)
  const skip = (page - 1) * perPage

  const where: Prisma.OrderWhereInput = {}
  if (user.role !== 'ADMIN' && user.role !== 'SALES') {
    where.buyerId = user.id
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      take: perPage,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: { title: true, imageUrl: true, slug: true },
            },
          },
        },
        shipments: true,
        payments: true,
      },
    }),
    prisma.order.count({ where }),
  ])

  const formatted = orders.map((o) => ({
    ...o,
    subtotalTZS: Number(o.subtotalTZS),
    shippingFeeTZS: Number(o.shippingFeeTZS),
    taxAmountTZS: Number(o.taxAmountTZS),
    discountTZS: Number(o.discountTZS),
    totalAmountTZS: Number(o.totalAmountTZS),
    items: o.items
      ? o.items.map((i) => ({
          ...i,
          unitPriceTZS: Number(i.unitPriceTZS),
          totalPriceTZS: Number(i.totalPriceTZS),
        }))
      : [],
  }))

  return NextResponse.json({
    data: formatted,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  })
}

export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  try {
    const body = await req.json()
    const result = CreateOrderSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid order request', details: result.error.flatten() }, { status: 400 })
    }

    const { items: inputItems, shippingAddress, paymentMethod } = result.data

    const productIds = inputItems.map((i) => i.productId)
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    const productMap = new Map(dbProducts.map((p) => [p.id, p]))

    let subtotalTZS = new Prisma.Decimal(0)
    const preparedItems: Prisma.OrderItemCreateWithoutOrderInput[] = []

    for (const item of inputItems) {
      const product = productMap.get(item.productId)
      if (!product || product.status !== 'PUBLISHED') {
        return NextResponse.json({ error: `Product ${item.productId} is unavailable.` }, { status: 400 })
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product "${product.title}". Requested: ${item.quantity}, Available: ${product.stock}` },
          { status: 400 }
        )
      }

      const unitPriceTZS = new Prisma.Decimal(product.priceTZS.toString())
      const itemTotalTZS = unitPriceTZS.mul(item.quantity)
      subtotalTZS = subtotalTZS.add(itemTotalTZS)

      preparedItems.push({
        quantity: item.quantity,
        unitPriceTZS,
        totalPriceTZS: itemTotalTZS,
        selectedVariant: item.selectedVariant,
        product: { connect: { id: product.id } },
      })
    }

    const shippingFeeTZS = new Prisma.Decimal(15000.0)
    const taxAmountTZS = subtotalTZS.mul(0.18)
    const totalAmountTZS = subtotalTZS.add(shippingFeeTZS).add(taxAmountTZS)

    const orderNumber = `LUMO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`

    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          buyer: { connect: { id: auth.user.id } },
          subtotalTZS,
          shippingFeeTZS,
          taxAmountTZS,
          totalAmountTZS,
          status: OrderStatus.PENDING_PAYMENT,
          paymentMethod,
          shippingAddress: shippingAddress as Prisma.InputJsonValue,
          items: {
            create: preparedItems,
          },
        },
      })

      for (const item of inputItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            totalSales: { increment: item.quantity },
          },
        })
      }

      await tx.cartItem.deleteMany({
        where: { userId: auth.user.id },
      })

      const transactionRef = `AZM-${Date.now()}`
      await tx.paymentRecord.create({
        data: {
          orderId: order.id,
          provider: 'AzamPay',
          transactionRef,
          amountTZS: totalAmountTZS,
          status: PaymentStatus.PENDING,
        },
      })

      await tx.escrowLedger.create({
        data: {
          orderId: order.id,
          buyerId: auth.user.id,
          amountTZS: totalAmountTZS,
          status: EscrowStatus.INITIATED,
        },
      })

      return order
    })

    return NextResponse.json(
      {
        success: true,
        order: {
          id: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          totalAmountTZS: Number(createdOrder.totalAmountTZS),
          status: createdOrder.status,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[API ORDERS POST ERROR]', error)
    return NextResponse.json({ error: 'Failed to create transactional order' }, { status: 500 })
  }
}
