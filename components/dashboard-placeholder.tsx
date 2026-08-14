import Link from 'next/link'
import { ConstructionIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ROLE_CONFIG, type Role } from '@/lib/roles'

/**
 * Redirect target for each role until the dashboards are built
 * (build order steps 4–8).
 */
export function DashboardPlaceholder({ role }: { role: Role }) {
  const config = ROLE_CONFIG[role]

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between border-b bg-card px-5 py-3 sm:px-8">
        <Link href="/">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <Empty className="max-w-md">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ConstructionIcon />
            </EmptyMedia>
            <EmptyTitle>{config.label} dashboard</EmptyTitle>
            <EmptyDescription>
              {config.description} This surface is next in the build order — the scaffold, design
              system and authentication screens are complete.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/">Back to overview</Link>}
            />
          </EmptyContent>
        </Empty>
      </main>
    </div>
  )
}
