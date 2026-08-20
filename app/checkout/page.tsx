import type { Metadata } from 'next'
import { PublicShell } from '@/components/shell/public-shell'
import { CheckoutFlow } from '@/components/checkout/checkout-flow'

export const metadata: Metadata = {
  title: 'Secure Checkout — Lumoo Global Sourcing',
  description: 'Confirm delivery, pay with mobile money, card or bank transfer under LUMO Trade Protection.',
}

export default function CheckoutPage() {
  return (
    <PublicShell>
      <div className="w-full max-w-5xl mx-auto overflow-x-hidden">
        <CheckoutFlow />
      </div>
    </PublicShell>
  )
}
