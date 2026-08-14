import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'

export const metadata: Metadata = {
  title: 'Logistics Courier Portal | Lumo',
}

export default function LogisticsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="logistics">{children}</AppShell>
}
