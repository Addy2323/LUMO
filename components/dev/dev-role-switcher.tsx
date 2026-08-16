'use client'

/**
 * Development helper: switch between role dashboards using the server-authoritative
 * POST /api/session/active-role endpoint. In production, this component is hidden.
 */

import { useRouter } from 'next/navigation'
import { WrenchIcon, LogOutIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ROLE_LIST, roleHome } from '@/lib/roles'
import { useSessionStore } from '@/lib/stores/session-store'
import { useRoles, useSwitchRole } from '@/lib/auth/use-auth'

export function DevRoleSwitcher() {
  const router = useRouter()
  const user = useSessionStore((s) => s.user)
  const signOut = useSessionStore((s) => s.signOut)
  const { data: rolesData } = useRoles()
  const switchRoleMutation = useSwitchRole()

  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="hidden sm:block fixed right-4 bottom-4 z-50 print:hidden opacity-80 hover:opacity-100 transition-opacity">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="bg-card shadow-sm">
              <WrenchIcon data-icon="inline-start" />
              {user ? ROLE_LIST.find((r) => r.id === (user.activeRole || user.role))?.label : 'Dev tools'}
              {switchRoleMutation.isPending && <Loader2 className="ml-1 size-3 animate-spin" />}
            </Button>
          }
        />
        <DropdownMenuContent side="top" align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Switch role (server-validated)</DropdownMenuLabel>
            {ROLE_LIST.map((role) => {
              const isActive = user?.activeRole === role.id || (!user?.activeRole && user?.role === role.id)
              return (
                <DropdownMenuItem
                  key={role.id}
                  disabled={switchRoleMutation.isPending}
                  onClick={() => {
                    switchRoleMutation.mutate(role.id.toUpperCase())
                  }}
                  className={isActive ? 'font-bold text-brand-500' : ''}
                >
                  {role.label}
                  {isActive && ' ✓'}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => {
                signOut()
                router.push('/login')
              }}
            >
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
