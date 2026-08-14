'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/shell/app-sidebar'
import { AppTopbar } from '@/components/shell/app-topbar'
import { DevRoleSwitcher } from '@/components/dev/dev-role-switcher'
import { useSessionStore } from '@/lib/stores/session-store'
import type { Role } from '@/lib/roles'

/**
 * Shared chrome for every authenticated surface.
 */
export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useSessionStore((state) => state.user)

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [user, router, pathname])

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar role={role} />
      <SidebarInset className="min-w-0">
        <AppTopbar />
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">{children}</div>
      </SidebarInset>
      <DevRoleSwitcher />
    </SidebarProvider>
  )
}
