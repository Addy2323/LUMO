import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categorySlug = searchParams.get('category')
    const search = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = parseInt(searchParams.get('perPage') || '20', 10)
    const skip = (page - 1) * perPage

    const where: any = {
      status: 'PUBLISHED',
    }

    if (categorySlug) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
        include: { children: true },
      })

      if (category) {
        const categoryIds = [category.id, ...category.children.map((c) => c.id)]
        where.categoryId = { in: categoryIds }
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        take: perPage,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true, slug: true } },
          supplier: { select: { companyName: true, rating: true, verified: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    // Convert Prisma Decimal values to numeric floats for JSON output
    const formattedProducts = products.map((p) => ({
      ...p,
      priceTZS: Number(p.priceTZS),
      priceUSD: Number(p.priceUSD),
      costPriceUSD: p.costPriceUSD ? Number(p.costPriceUSD) : null,
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    }))

    return NextResponse.json({
      data: formattedProducts,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    })
  } catch (error: any) {
    console.error('[API PRODUCTS GET ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
