import type { Metadata } from 'next'
import { PublicShell } from '@/components/shell/public-shell'
import { ProductDetail } from '@/components/marketplace/product-detail'
import { PRODUCTS } from '@/lib/mock/products'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = PRODUCTS.find((item) => item.slug === slug)

  return {
    title: product?.title ?? 'Product Details',
    description: product?.shortDescription ?? 'Direct factory product details on Lumo.',
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <PublicShell>
      <ProductDetail slug={slug} />
    </PublicShell>
  )
}
