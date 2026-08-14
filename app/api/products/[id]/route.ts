import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/products/[id]
 * Public endpoint: Retrieves detailed product info by ID, slug, or product code.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { productCode: id }],
      },
      include: {
        category: true,
        supplier: true,
        images: true,
        productVariants: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const formatted = {
      ...product,
      priceTZS: Number(product.priceTZS),
      priceUSD: Number(product.priceUSD),
      costPriceUSD: product.costPriceUSD ? Number(product.costPriceUSD) : null,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error('[API PRODUCT GET DETAIL ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch product details' }, { status: 500 })
  }
}
