import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const verifiedOnly = searchParams.get('verified') === 'true'

    const where: any = {}
    if (verifiedOnly) {
      where.verified = true
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true, phone: true, kycStatus: true },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { rating: 'desc' },
    })

    return NextResponse.json(suppliers)
  } catch (error: any) {
    console.error('[API SUPPLIERS GET ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}
