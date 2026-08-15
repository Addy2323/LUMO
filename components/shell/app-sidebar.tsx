'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LifeBuoy, LogOut, ShieldCheck, Sparkles } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Logo } from '@/components/brand/logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { activeHref, navForRole } from '@/lib/navigation'
import { getRoleConfig, ROLE_CONFIG, type Role } from '@/lib/roles'
import { useSessionStore } from '@/lib/stores/session-store'
import { useCartStore, activeCartCount } from '@/lib/stores/cart-store'
import { useAgentStore } from '@/lib/stores/agent-store'

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname()
  const router = useRouter()
  const roleConfig = getRoleConfig(role)
  const groups = navForRole(roleConfig.id)
  const current = activeHref(groups, pathname)
  const user = useSessionStore((state) => state.user)
  const signOut = useSessionStore((state) => state.signOut)

  const cartLines = useCartStore((state) => state.lines)
  const cartCount = activeCartCount(cartLines)
  const agentOrders = useAgentStore((state) => state.orders)
  const sourcingCount = agentOrders.length

  // Live Multi-Role Database Badges State
  const [dynamicBadges, setDynamicBadges] = useState<Record<string, string | number>>({})
  // Track dismissed badge hrefs per session
  const [dismissedBadges, setDismissedBadges] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchBadges() {
      try {
        const res = await fetch('/api/navigation/badges')
        if (res.ok) {
          const data = await res.json()
          if (data.badges) {
            setDynamicBadges(data.badges)
          }
        }
      } catch (err) {
        console.error('[SIDEBAR BADGES ERROR]', err)
      }
    }
    fetchBadges()
  }, [])

  function handleItemClick(href: string) {
    // Automatically dismiss/clear notification badge for this route when clicked
    setDismissedBadges((prev) => {
      const next = new Set(prev)
      next.add(href)
      return next
    })
  }

  function getDynamicBadge(itemHref: string, staticBadge?: string) {
    if (dismissedBadges.has(itemHref)) {
      return undefined
    }

    if (itemHref === '/cart') {
      return cartCount > 0 ? String(cartCount) : undefined
    }
    if (itemHref === '/account/sourcing') {
      return sourcingCount > 0 ? String(sourcingCount) : undefined
    }
    if (itemHref === '/account/returns') {
      return undefined
    }

    // Dynamic Database Badges from /api/navigation/badges
    if (dynamicBadges[itemHref] !== undefined && Number(dynamicBadges[itemHref]) > 0) {
      return String(dynamicBadges[itemHref])
    }

    return undefined
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border/80 px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Lumo Global Sourcing"
              className="hover:bg-sidebar-accent/50 transition-colors"
              render={
                <Link href={roleConfig.home} className="flex items-center gap-3">
                  <Logo markOnly tone="onPrimary" className="size-8 shrink-0" />
                  <div className="flex min-w-0 flex-col leading-none">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-extrabold text-sidebar-foreground text-sm tracking-tight">
                        Lumo
                      </span>
                      <span className="inline-flex items-center rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-bold text-brand-500 uppercase tracking-widest border border-brand-500/30">
                        B2B
                      </span>
                    </div>
                    <span className="truncate text-[11px] font-medium text-sidebar-foreground/70 mt-0.5">
                      {roleConfig.label}
                    </span>
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel className="text-[10px] font-bold tracking-widest text-sidebar-foreground/60 uppercase px-2 mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = current === item.href
                  const badgeText = getDynamicBadge(item.href, item.badge)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        className={`transition-all duration-150 rounded-lg px-2.5 py-2 ${
                          isActive
                            ? 'bg-sidebar-primary/15 text-sidebar-primary font-semibold shadow-sm border-l-2 border-sidebar-primary'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                        }`}
                        render={
                          <Link
                            href={item.href}
                            onClick={() => handleItemClick(item.href)}
                            className="flex items-center gap-2.5"
                          >
                            <item.icon className={`size-4 shrink-0 ${isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/70'}`} strokeWidth={isActive ? 2.2 : 1.75} />
                            <span className="text-xs">{item.label}</span>
                          </Link>
                        }
                      />
                      {badgeText ? (
                        <SidebarMenuBadge className="bg-brand-500/20 text-brand-500 font-bold text-[10px] px-1.5 rounded-full border border-brand-500/30">
                          {badgeText}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/80 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Help Centre & Sourcing Guides"
              className="text-sidebar-foreground/75 hover:bg-sidebar-accent"
              render={
                <Link href="/help" className="flex items-center gap-2.5">
                  <LifeBuoy className="size-4 shrink-0 text-sidebar-foreground/70" strokeWidth={1.75} />
                  <span className="text-xs">Help Centre</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>

        {user ? (
          <div className="mt-2 rounded-xl bg-sidebar-accent/50 p-2.5 border border-sidebar-border/60 flex items-center justify-between gap-2 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="size-7 ring-1 ring-brand-500/30">
                <AvatarFallback className="text-[11px] font-extrabold bg-brand-500 text-white">
                  {initials((user as any).fullName || (user as any).name || 'User')}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-xs font-semibold text-sidebar-foreground truncate">
                  {(user as any).fullName || (user as any).name || 'User'}
                </span>
                <span className="text-[10px] text-sidebar-foreground/60 truncate flex items-center gap-1">
                  <ShieldCheck className="size-3 text-brand-500 inline" />
                  {roleConfig.label}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                signOut()
                toast.success('Signed out successfully')
                router.push('/login')
              }}
              title="Sign out"
              className="p-1 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-border/60 transition-colors"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        ) : null}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
