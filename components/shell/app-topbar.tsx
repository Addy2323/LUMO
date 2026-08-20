'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Bell, CheckCircle2, Command, FilePlus, LogIn, LogOut, PackageCheck, Search, Settings, ShieldCheck, ShoppingCart, User, UserPlus } from 'lucide-react'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { useSessionStore } from '@/lib/stores/session-store'
import { useCartStore } from '@/lib/stores/cart-store'
import { getRoleConfig, ROLE_CONFIG } from '@/lib/roles'
import { cn } from '@/lib/utils'

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

import { CommandPalette } from '@/components/ui/command-palette'

export function AppTopbar() {
  const router = useRouter()
  const user = useSessionStore((state) => state.user)
  const signOut = useSessionStore((state) => state.signOut)
  
  const cartLines = useCartStore((state) => state.lines)
  const cartCount = cartLines.reduce((acc, line) => acc + line.quantity, 0)

  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Shipment #SHP-9021 Customs Cleared', desc: 'Dar es Salaam Port · 15m ago', read: false, icon: PackageCheck, color: 'text-emerald-500' },
    { id: '2', title: 'Supplier Factory RFQ Accepted', desc: 'Yiwu Supplier Hub · 1h ago', read: false, icon: FilePlus, color: 'text-brand-500' },
    { id: '3', title: 'Payment Protection Released', desc: 'LUMO Pay TZS Settlement · 3h ago', read: true, icon: CheckCircle2, color: 'text-blue-500' },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const isCustomer = user?.role === 'customer'
  const isSupplier = user?.role === 'supplier'

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-1 sm:gap-2 border-b border-border bg-background/95 px-2.5 sm:px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-0.5 sm:mr-1 h-5 sm:h-6" />

        {/* Enterprise Global Command Palette Launcher */}
        <div className="max-w-[160px] sm:max-w-md">
          <CommandPalette />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Quick Context Action Button based on Role */}
        {isCustomer ? (
          <Button
            size="sm"
            className="hidden md:inline-flex bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs gap-1.5 shadow-sm rounded-lg px-3"
            nativeButton={false}
            render={
              <Link href="/sourcing/paste-link">
                <FilePlus className="size-3.5" />
                <span>RFQ Quote</span>
              </Link>
            }
          />
        ) : isSupplier ? (
          <Button
            size="sm"
            className="hidden md:inline-flex bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs gap-1.5 shadow-sm rounded-lg px-3"
            nativeButton={false}
            render={
              <Link href="/supplier/products/new">
                <FilePlus className="size-3.5" />
                <span>+ List Product</span>
              </Link>
            }
          />
        ) : null}

        {isCustomer ? (
          <Button
            variant="ghost"
            size="icon"
            className="relative size-8 sm:size-9"
            nativeButton={false}
            aria-label={`Cart, ${cartCount} items`}
            render={
              <Link href="/cart">
                <ShoppingCart className="size-4 text-foreground/80" />
                {cartCount > 0 ? (
                  <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                ) : null}
              </Link>
            }
          />
        ) : null}

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="relative size-8 sm:size-9" aria-label={`Notifications (${unreadCount} unread)`}>
                <Bell className="size-4 text-foreground/80" />
                {unreadCount > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-1 right-1 size-2 rounded-full bg-danger animate-pulse"
                  />
                ) : null}
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-80 p-2">
            <DropdownMenuLabel className="flex items-center justify-between text-xs font-bold text-foreground pb-2 border-b">
              <span>Notifications</span>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[10px] font-semibold text-brand-500 hover:underline cursor-pointer"
                >
                  Mark all as read ({unreadCount})
                </button>
              ) : (
                <span className="text-[10px] font-semibold text-muted-foreground">
                  All caught up
                </span>
              )}
            </DropdownMenuLabel>
            <div className="py-2 flex flex-col gap-2">
              {notifications.map((n) => {
                const IconComp = n.icon
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                      )
                    }}
                    className={cn(
                      'flex items-start gap-2.5 p-2 rounded-lg text-xs transition-colors cursor-pointer',
                      n.read ? 'bg-muted/30 opacity-75' : 'bg-muted/70 font-medium'
                    )}
                  >
                    <IconComp className={cn('size-4 shrink-0 mt-0.5', n.color)} />
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-semibold text-foreground truncate">{n.title}</p>
                        {!n.read && <span className="size-1.5 rounded-full bg-brand-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{n.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <LanguageToggle />

        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        <Separator orientation="vertical" className="mx-1 h-5 sm:h-6 hidden sm:block" />

        {/* Role Badge Pill */}
        {user ? (
          <span className="hidden xl:inline-flex items-center gap-1 rounded-full bg-sidebar-accent px-2.5 py-1 text-[11px] font-bold text-sidebar-foreground border border-sidebar-border">
            <ShieldCheck className="size-3 text-brand-500" />
            {getRoleConfig(user.role).label}
          </span>
        ) : null}

        {!user ? (
          <div className="hidden sm:flex items-center gap-1.5 mr-1">
            <Button
              variant="ghost"
              size="sm"
              className="font-bold text-xs text-muted-foreground hover:text-foreground"
              render={<Link href="/login" />}
            >
              <LogIn className="size-3.5 mr-1" />
              Sign In
            </Button>
            <Button
              size="sm"
              className="font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-xs rounded-lg px-2.5"
              render={<Link href="/register" />}
            >
              <UserPlus className="size-3.5 mr-1" />
              Sign Up
            </Button>
          </div>
        ) : null}

        {/* Account Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="rounded-full ring-1 ring-border" aria-label="Account menu">
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs font-bold bg-brand-500 text-white">
                    {user ? initials((user as any).fullName || (user as any).name || 'User') : 'LU'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-60 p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-1 p-2">
                <span className="truncate text-sm font-extrabold text-foreground">{(user as any)?.fullName || (user as any)?.name || 'Guest User'}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {user?.email ?? 'Sign in to order & track shipments'}
                </span>
                {user ? (
                  <span className="mt-1 inline-flex w-fit items-center gap-1 text-[10px] font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                    {getRoleConfig(user.role).label} Account
                  </span>
                ) : null}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {user ? (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push('/account')}
                    className="flex items-center gap-2 cursor-pointer py-2 px-2.5 hover:bg-muted rounded-md transition-colors"
                  >
                    <User className="size-4" />
                    <span>Account Overview</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/account/addresses')}
                    className="flex items-center gap-2 cursor-pointer py-2 px-2.5 hover:bg-muted rounded-md transition-colors"
                  >
                    <Settings className="size-4" />
                    <span>Delivery & TIN Profile</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-danger focus:text-danger focus:bg-danger-subtle cursor-pointer py-2 px-2.5"
                  onClick={() => {
                    signOut()
                    toast.success('Signed out successfully')
                    router.push('/login')
                  }}
                >
                  <LogOut className="size-4 mr-2" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => router.push('/login')}
                  className="flex items-center gap-2 font-bold text-orange-600 dark:text-orange-400 cursor-pointer py-2 px-2.5"
                >
                  <LogIn className="size-4" />
                  <span>Sign In to Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/register')}
                  className="flex items-center gap-2 font-bold cursor-pointer py-2 px-2.5"
                >
                  <UserPlus className="size-4" />
                  <span>Register New Account</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

