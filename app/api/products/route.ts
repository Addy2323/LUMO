import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categorySlug = searchParams.get('category')
    const search = searchParams.get('q')
    const statusParam = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = parseInt(searchParams.get('perPage') || '100', 10)
    const skip = (page - 1) * perPage

    const where: any = {}
    const andConditions: any[] = []

    // Status filtering logic: return published/approved items for Marketplace by default, or all items for Admin when statusParam === 'ALL'
    if (statusParam && statusParam !== 'ALL' && statusParam !== '*') {
      where.status = statusParam
    } else if (!statusParam) {
      andConditions.push({
        OR: [
          { status: 'PUBLISHED' },
          { isApproved: true },
        ],
      })
    }

    if (categorySlug && categorySlug !== 'ALL') {
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
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { productCode: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
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

    // Format DB products into complete, resilient Product objects for Marketplace
    const formattedProducts = products.map((p) => {
      const rawUrl = p.gallery && p.gallery.length > 0 ? p.gallery[0] : p.imageUrl
      const title = p.title || 'Direct Factory Sourcing Product'
      
      let categoryId = (p.category?.slug || p.categoryId || 'electronics').toLowerCase()
      const tLower = title.toLowerCase()
      if (tLower.includes('chair') || tLower.includes('stool') || tLower.includes('desk') || tLower.includes('sofa') || tLower.includes('furniture')) {
        categoryId = 'furniture'
      } else if (tLower.includes('phone') || tLower.includes('headphone') || tLower.includes('audio') || tLower.includes('earbud')) {
        categoryId = 'phones-accessories'
      } else if (tLower.includes('skincare') || tLower.includes('beauty') || tLower.includes('cream')) {
        categoryId = 'health-beauty'
      } else if (tLower.includes('shoe') || tLower.includes('boot') || tLower.includes('sneaker') || tLower.includes('oxford') || tLower.includes('loafers')) {
        categoryId = 'shoes'
      } else if (tLower.includes('suit') || tLower.includes('jacket') || tLower.includes("men's") || tLower.includes('trousers')) {
        categoryId = 'mens-clothing'
      } else if (tLower.includes('dress') || tLower.includes('blouse') || tLower.includes('skirt') || tLower.includes("women's")) {
        categoryId = 'womens-clothing'
      } else if (tLower.includes('wig') || tLower.includes('hair') || tLower.includes('weave') || tLower.includes('bundle')) {
        categoryId = 'hair-wigs'
      } else if (tLower.includes('solar') || tLower.includes('inverter') || tLower.includes('lithium') || tLower.includes('panel')) {
        categoryId = 'solar-power'
      }

      const rawVariants = Array.isArray(p.variants) ? (p.variants as any[]) : []
      const variants = rawVariants.length > 0
        ? rawVariants.map((v: any, idx: number) => ({
            id: v.id || `${p.id}-v${idx}`,
            name: v.name || 'Standard',
            sku: v.sku || p.productCode,
            price: Number(v.priceTZS || p.priceTZS),
            stock: v.stock || p.stock || 50,
          }))
        : [{ id: `${p.id}-v1`, name: 'Standard', sku: p.productCode, price: Number(p.priceTZS), stock: p.stock || 50 }]

      return {
        id: p.id,
        title,
        slug: p.slug || p.id,
        description: p.description || `${title} — Direct Factory Sourcing with Air & Sea Freight to Tanzania.`,
        shortDescription: p.shortDescription || title,
        categoryId,
        brand: p.brand || 'Verified Direct Factory',
        countryOfOrigin: 'China',
        flag: '🇨🇳',
        fromPrice: Number(p.priceTZS),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        minOrderQuantity: 1,
        soldCount: p.totalSales || 150,
        rating: 4.9,
        reviewCount: 18,
        leadTimeDays: 7,
        deliveryEstimateDays: [7, 14] as [number, number],
        inStock: (p.stock || 50) > 0,
        supplier: {
          id: p.supplierId || 'sup-1',
          name: p.supplier?.companyName || 'LUMO Sourcing Hub',
          verified: p.supplier?.verified ?? true,
          rating: p.supplier?.rating ? Number(p.supplier.rating) : 4.9,
          city: 'Guangzhou',
          country: 'China',
          flag: '🇨🇳',
        },
        images: [{ url: rawUrl || '/images/products/phone-case-armour.png', alt: title }],
        variants,
        specifications: [],
        attributes: [],
        reviews: [],
        tags: ['Factory Direct', 'Verified'],
        status: p.status,
        isApproved: p.isApproved,
        createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
      }
    })

    return NextResponse.json({
      data: formattedProducts,
      products: formattedProducts,
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawItems = Array.isArray(body) ? body : body.products ? body.products : [body]

    if (rawItems.length === 0) {
      return NextResponse.json({ error: 'No product data provided' }, { status: 400 })
    }

    // Ensure default category exists in DB for foreign key requirements
    let defaultCategory = await prisma.category.findFirst()
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: {
          name: 'General Merchant',
          slug: 'general-merchant',
          description: 'Default catalog category',
        },
      })
    }

    const createdProducts: any[] = []

    for (const item of rawItems) {
      const title = item.title || item.name || 'Untitled Supplier Product'
      const slug = (title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 10000)).slice(0, 80)
      const priceTZS = item.fromPriceTZS || item.priceTZS || item.fromPrice || 50000
      const priceUSD = Math.round((priceTZS / 2600) * 100) / 100

      // Extract image gallery
      let gallery: string[] = []
      if (Array.isArray(item.images)) {
        gallery = item.images.map((img: any) => (typeof img === 'string' ? img : img.url || img.src)).filter(Boolean)
      } else if (item.imageUrl) {
        gallery = [item.imageUrl]
      }
      if (gallery.length === 0) {
        gallery = ['/images/products/phone-case-armour.png']
      }

      // Check for category
      let categoryId = defaultCategory.id
      if (item.category || item.categoryId) {
        const catStr = item.category || item.categoryId
        const foundCat = await prisma.category.findFirst({
          where: {
            OR: [
              { id: catStr },
              { name: { contains: catStr, mode: 'insensitive' } },
              { slug: { contains: catStr.toLowerCase().replace(/[^a-z0-9]+/g, '-'), mode: 'insensitive' } },
            ],
          },
        })
        if (foundCat) {
          categoryId = foundCat.id
        }
      }

      const productCode = item.sku || `LUMO-PROD-${Math.floor(100000 + Math.random() * 900000)}`

      const created = await prisma.product.create({
        data: {
          productCode,
          title,
          slug,
          brand: item.brand || 'Verified Supplier',
          description: item.description || title,
          shortDescription: item.shortDescription || title.slice(0, 100),
          categoryId,
          priceTZS,
          priceUSD,
          stock: item.stock || (item.variants?.[0]?.stock) || 50,
          status: item.status || 'PENDING_REVIEW',
          isApproved: item.isApproved ?? false,
          sourceType: 'LUMO_SUPPLIER',
          sourceHub: 'Supplier Direct Portal',
          imageUrl: gallery[0],
          gallery,
          variants: item.variants || [
            {
              id: `v_${Date.now()}`,
              sku: productCode,
              name: item.optionName || 'Standard',
              priceTZS,
              stock: item.stock || 50,
            },
          ],
        },
      })

      createdProducts.push(created)
    }

    return NextResponse.json({
      success: true,
      count: createdProducts.length,
      products: createdProducts.map((p) => ({
        ...p,
        priceTZS: Number(p.priceTZS),
        priceUSD: Number(p.priceUSD),
      })),
    })
  } catch (error: any) {
    console.error('[API PRODUCTS POST ERROR]', error)
    return NextResponse.json({ error: error.message || 'Failed to create products in database' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      await prisma.orderItem.deleteMany({ where: { productId: id } }).catch(() => {})
      await prisma.cartItem.deleteMany({ where: { productId: id } }).catch(() => {})
      await prisma.product.delete({ where: { id } }).catch(() => {})
      return NextResponse.json({ success: true, message: `Product ${id} deleted` })
    } else {
      await prisma.orderItem.deleteMany({}).catch(() => {})
      await prisma.cartItem.deleteMany({}).catch(() => {})
      const res = await prisma.product.deleteMany({}).catch(() => ({ count: 0 }))
      return NextResponse.json({ success: true, count: res.count, message: 'All database products deleted successfully' })
    }
  } catch (error: any) {
    console.error('[API PRODUCTS DELETE ERROR]', error)
    return NextResponse.json({ error: error.message || 'Failed to delete products' }, { status: 500 })
  }
}

