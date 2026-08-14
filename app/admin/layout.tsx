import type { Metadata } from 'next'
import { AppShell } from '@/components/shell/app-shell'

export const metadata: Metadata = {
  title: 'Admin Operations Center | Lumo',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="admin">{children}</AppShell>
}
