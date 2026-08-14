import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'

const AddToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  selectedVariant: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: auth.user.id },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          imageUrl: true,
          priceTZS: true,
          priceUSD: true,
          stock: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const formatted = cartItems.map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    selectedVariant: item.selectedVariant,
    title: item.product.title,
    slug: item.product.slug,
    imageUrl: item.product.imageUrl,
    priceTZS: Number(item.product.priceTZS),
    priceUSD: Number(item.product.priceUSD),
    stock: item.product.stock,
  }))

  return NextResponse.json(formatted)
}

export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  try {
    const body = await req.json()
    const result = AddToCartSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid cart payload' }, { status: 400 })
    }

    const { productId, quantity, selectedVariant } = result.data

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId_selectedVariant: {
          userId: auth.user.id,
          productId,
          selectedVariant: selectedVariant || '',
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        userId: auth.user.id,
        productId,
        quantity,
        selectedVariant: selectedVariant || '',
      },
    })

    return NextResponse.json(cartItem, { status: 200 })
  } catch (error: any) {
    console.error('[API CART POST ERROR]', error)
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  try {
    const { searchParams } = new URL(req.url)
    const cartItemId = searchParams.get('id')

    if (cartItemId) {
      await prisma.cartItem.deleteMany({
        where: { id: cartItemId, userId: auth.user.id },
      })
    } else {
      // Clear entire cart for user
      await prisma.cartItem.deleteMany({
        where: { userId: auth.user.id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API CART DELETE ERROR]', error)
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
  }
}
