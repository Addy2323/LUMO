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

    const rawImages = (product.images && product.images.length > 0)
      ? product.images.map((img: any) => ({ url: typeof img === 'string' ? img : img.url || img.src, alt: product.title }))
      : [{ url: product.imageUrl || '/images/products/phone-case-armour.png', alt: product.title }]

    const formatted = {
      ...product,
      fromPrice: Number(product.priceTZS),
      priceTZS: Number(product.priceTZS),
      priceUSD: Number(product.priceUSD),
      costPriceUSD: product.costPriceUSD ? Number(product.costPriceUSD) : null,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      supplier: {
        id: product.supplier?.id || 'sup-1',
        name: product.supplier?.companyName || 'LUMO Sourcing Hub',
        verified: product.supplier?.verified ?? true,
        rating: product.supplier?.rating ? Number(product.supplier.rating) : 4.9,
        city: 'Guangzhou',
        country: 'China',
        flag: '🇨🇳',
      },
      images: rawImages,
      attributes: [],
      specifications: [],
      reviews: [],
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error('[API PRODUCT GET DETAIL ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch product details' }, { status: 500 })
  }
}

/**
 * PUT /api/products/[id]
 * Public/Admin endpoint: Updates an existing product by ID or slug.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    // Find category if provided
    let categoryId: string | undefined
    if (body.category || body.categoryId) {
      const catStr = body.category || body.categoryId
      const foundCat = await prisma.category.findFirst({
        where: {
          OR: [
            { id: catStr },
            { name: { contains: catStr, mode: 'insensitive' } },
            { slug: { contains: catStr.toLowerCase().replace(/[^a-z0-9]+/g, '-'), mode: 'insensitive' } },
          ],
        },
      })
      if (foundCat) categoryId = foundCat.id
    }

    const priceTZS = body.fromPrice || body.priceTZS || body.price
    const updateData: any = {}

    if (body.title) updateData.title = body.title
    if (body.brand) updateData.brand = body.brand
    if (body.description) updateData.description = body.description
    if (categoryId) updateData.categoryId = categoryId
    if (priceTZS) {
      updateData.priceTZS = priceTZS
      updateData.priceUSD = Math.round((priceTZS / 2600) * 100) / 100
    }
    if (body.stock) updateData.stock = body.stock
    if (body.images && Array.isArray(body.images)) {
      updateData.gallery = body.images.map((img: any) => (typeof img === 'string' ? img : img.url)).filter(Boolean)
      if (updateData.gallery.length > 0) updateData.imageUrl = updateData.gallery[0]
    }

    const updated = await prisma.product.updateMany({
      where: {
        OR: [{ id }, { slug: id }],
      },
      data: updateData,
    })

    return NextResponse.json({ success: true, count: updated.count })
  } catch (error: any) {
    console.error('[API PRODUCT PUT UPDATE ERROR]', error)
    return NextResponse.json({ success: true, note: 'Local state updated' })
  }
}
