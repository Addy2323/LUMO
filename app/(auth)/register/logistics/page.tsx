import type { Metadata } from 'next'
import { SplitRegisterCard } from '@/components/auth/split-register-card'

export const metadata: Metadata = {
  title: 'Logistics Partner Application — Lumo Commerce',
  description: 'Apply as a logistics partner for customs clearance, warehousing, and freight delivery.',
}

export default function LogisticsRegisterPage() {
  return <SplitRegisterCard initialRole="LOGISTICS" />
}
