import type { Metadata } from 'next'
import { SplitRegisterCard } from '@/components/auth/split-register-card'

export const metadata: Metadata = {
  title: 'Join Lumo — Buyer Registration, Supplier & Logistics Application',
  description: 'Choose how you want to use the Lumo Commerce platform: Shop, Sell, or Deliver.',
}

export default function RegisterPage() {
  return <SplitRegisterCard initialRole="CUSTOMER" />
}
