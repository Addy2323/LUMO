import type { Metadata } from 'next'
import { SplitRegisterCard } from '@/components/auth/split-register-card'

export const metadata: Metadata = {
  title: 'Buyer Account Registration — Lumo Commerce',
  description: 'Create a buyer account to shop globally, request product sourcing and track deliveries.',
}

export default function BuyerRegisterPage() {
  return <SplitRegisterCard initialRole="CUSTOMER" />
}
