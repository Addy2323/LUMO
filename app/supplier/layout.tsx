import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'

export const metadata: Metadata = {
  title: 'Supplier Portal | Lumo',
}

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="supplier">{children}</AppShell>
}
