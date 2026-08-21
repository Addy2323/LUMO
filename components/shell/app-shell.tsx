'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/shell/app-sidebar'
import { AppTopbar } from '@/components/shell/app-topbar'
import { DevRoleSwitcher } from '@/components/dev/dev-role-switcher'
import { useSessionStore } from '@/lib/stores/session-store'
import type { Role } from '@/lib/roles'

/**
 * Shared chrome for every authenticated surface.
 * Verifies both client session store and HTTP server session cookie before rendering or redirecting.
 */
export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useSessionStore((state) => state.user)
  const signIn = useSessionStore((state) => state.signIn)
  const [loading, setLoading] = useState(!user)

  useEffect(() => {
    let isMounted = true

    async function syncSession() {
      if (user) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated && data.user) {
            if (isMounted) {
              const rawRole = (data.user.role || 'customer').toLowerCase() as Role
              signIn({
                id: data.user.id,
                fullName: data.user.name || data.user.fullName || 'User',
                email: data.user.email,
                phone: data.user.phone || '',
                role: rawRole,
                activeRole: rawRole,
                verified: true,
                avatarUrl: null,
                companyName: data.user.companyName || null,
                kycStatus: data.user.kycStatus || null,
              })
              setLoading(false)
            }
            return
          }
        }
      } catch (err) {
        console.error('[APP SHELL AUTH ERROR]', err)
      }

      if (isMounted) {
        setLoading(false)
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      }
    }

    syncSession()

    return () => {
      isMounted = false
    }
  }, [user, router, pathname, signIn])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-muted-foreground">Authenticating session...</span>
        </div>
      </div>
    )
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
