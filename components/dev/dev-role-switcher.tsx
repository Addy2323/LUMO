'use client'

/** Development-only helper: jump between role dashboards without real auth. */

import { useRouter } from 'next/navigation'
import { WrenchIcon, LogOutIcon } from 'lucide-react'
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

export function DevRoleSwitcher() {
  const router = useRouter()
  const user = useSessionStore((s) => s.user)
  const switchRole = useSessionStore((s) => s.switchRole)
  const signOut = useSessionStore((s) => s.signOut)

  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="hidden sm:block fixed right-4 bottom-4 z-50 print:hidden opacity-80 hover:opacity-100 transition-opacity">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="bg-card shadow-sm">
              <WrenchIcon data-icon="inline-start" />
              {user ? ROLE_LIST.find((r) => r.id === user.role)?.label : 'Dev tools'}
            </Button>
          }
        />
        <DropdownMenuContent side="top" align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Switch role (mock session)</DropdownMenuLabel>
            {ROLE_LIST.map((role) => (
              <DropdownMenuItem
                key={role.id}
                onClick={async () => {
                  switchRole(role.id)
                  try {
                    await fetch('/api/dev/session', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ role: role.id }),
                    })
                  } catch (e) {
                    console.warn('[DEV ROLE SWITCHER WARN]', e)
                  }
                  router.push(roleHome(role.id))
                  router.refresh()
                }}
              >
                {role.label}
              </DropdownMenuItem>
            ))}
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
