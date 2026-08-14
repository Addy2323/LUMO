import type { Metadata } from 'next'
import { SplitRegisterCard } from '@/components/auth/split-register-card'

export const metadata: Metadata = {
  title: 'Supplier Application — Lumo Commerce',
  description: 'Apply as a supplier to sell products, manage catalog, and reach buyers.',
}

export default function SupplierRegisterPage() {
  return <SplitRegisterCard initialRole="SUPPLIER" />
}
