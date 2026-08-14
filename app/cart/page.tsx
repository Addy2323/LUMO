import type { Metadata } from 'next'
import { PublicShell } from '@/components/shell/public-shell'
import { PageHeader } from '@/components/shell/page-header'
import { CartView } from '@/components/cart/cart-view'

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Review the items in your Lumo cart before checkout.',
}

export default function CartPage() {
  return (
    <PublicShell>
      <PageHeader
        title="Your cart"
        description="Quantities are capped by live supplier stock. Delivery is free over TZS 250,000."
      />
      <CartView />
    </PublicShell>
  )
}
