import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'

export const metadata: Metadata = {
  title: 'Sales Department | Lumo',
}

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="sales">{children}</AppShell>
}
