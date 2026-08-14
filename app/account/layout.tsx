import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'

export const metadata: Metadata = {
  title: 'Customer Portal | Lumo',
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="customer">{children}</AppShell>
}
