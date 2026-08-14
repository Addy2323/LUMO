import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'

const WishlistSchema = z.object({
  productId: z.string().min(1),
})

export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const items = await prisma.wishlistItem.findMany({
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
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const formatted = items.map((i) => ({
    id: i.id,
    productId: i.productId,
    title: i.product.title,
    slug: i.product.slug,
    imageUrl: i.product.imageUrl,
    priceTZS: Number(i.product.priceTZS),
    priceUSD: Number(i.product.priceUSD),
    addedAt: i.createdAt,
  }))

  return NextResponse.json(formatted)
}

export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  try {
    const body = await req.json()
    const result = WishlistSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: auth.user.id,
          productId: result.data.productId,
        },
      },
      update: {},
      create: {
        userId: auth.user.id,
        productId: result.data.productId,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    console.error('[API WISHLIST POST ERROR]', error)
    return NextResponse.json({ error: 'Failed to add item to wishlist' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        userId: auth.user.id,
        productId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API WISHLIST DELETE ERROR]', error)
    return NextResponse.json({ error: 'Failed to remove wishlist item' }, { status: 500 })
  }
}
