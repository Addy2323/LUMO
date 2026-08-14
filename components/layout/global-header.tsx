'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  Globe,
  Heart,
  HelpCircle,
  Link2,
  LogIn,
  LogOut,
  Menu,
  PackageSearch,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Truck,
  User,
  UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'

import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { DevRoleSwitcher as RoleSwitcher } from '@/components/dev/dev-role-switcher'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

import { useCartStore } from '@/lib/stores/cart-store'
import { useSessionStore } from '@/lib/stores/session-store'
import { getRoleConfig } from '@/lib/roles'
import { useT } from '@/lib/i18n/use-locale'
import { formatItemCount } from '@/lib/i18n/format'

export interface GlobalHeaderProps {
  hideAnnouncement?: boolean
  announcementText?: string
}

export function useMainNavItems() {
  const t = useT()
  return [
    { label: t('navigation.marketplace'), href: '/marketplace' },
    { label: t('navigation.sourceProduct'), href: '/sourcing/request' },
    { label: t('navigation.trackOrder'), href: '/track-freight' },
    { label: t('navigation.suppliers'), href: '/supplier' },
    { label: t('navigation.help'), href: '/help' },
  ]
}

function getInitials(name?: string) {
  if (!name) return 'LU'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function getFirstName(fullName?: string) {
  if (!fullName) return 'Account'
  return fullName.split(' ')[0]
}

export function GlobalHeader({
  hideAnnouncement = false,
  announcementText,
}: GlobalHeaderProps) {
  const t = useT()
  const mainNavItems = useMainNavItems()
  const displayAnnouncement = announcementText || t('header.announcementText')

  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const prevCartCount = useRef(0)

  // Auth & Session state
  const sessionUser = useSessionStore((s) => s.user)
  const signOut = useSessionStore((s) => s.signOut)
  const [authUser, setAuthUser] = useState<any>(sessionUser)

  // Cart state
  const cartLines = useCartStore((s) => s.lines) ?? []

  // Synchronize authenticated server session on mount
  useEffect(() => {
    async function checkServerSession() {
      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated && data.user) {
            setAuthUser(data.user)
            useSessionStore.getState().signIn({
              id: data.user.id,
              fullName: data.user.name || data.user.fullName || 'User',
              email: data.user.email,
              phone: data.user.phone || '',
              role: data.user.role,
              verified: true,
              avatarUrl: null,
            } as any)
          }
        }
      } catch (err) {
        // Fallback to local session store
      }
    }
    checkServerSession()
  }, [])

  useEffect(() => {
    setAuthUser(sessionUser)
  }, [sessionUser])

  // Scroll shadow via IntersectionObserver (passive, efficient)
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // Detect genuine cart count changes for badge pop
  const cartCount = cartLines.reduce((sum, l) => sum + l.quantity, 0)
  const [cartPop, setCartPop] = useState(false)
  useEffect(() => {
    if (cartCount !== prevCartCount.current && prevCartCount.current !== 0) {
      setCartPop(true)
      const id = setTimeout(() => setCartPop(false), 250)
      return () => clearTimeout(id)
    }
    prevCartCount.current = cartCount
  }, [cartCount])

  async function handleSignOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      // Ignore network errors
    }
    signOut()
    setAuthUser(null)
    toast.success('Signed out successfully')
    router.push('/')
  }

  function isNavActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const roleConfig = authUser ? getRoleConfig(authUser.role) : null

  return (
    <header className="w-full bg-white dark:bg-[#0B1F3A] text-[#0B1F3A] dark:text-slate-100 antialiased">
      {/* Invisible sentinel for scroll detection */}
      <div ref={sentinelRef} className="absolute top-0 h-px w-full" aria-hidden="true" />


      {/* Main Header Navigation */}
      <div className={`sticky top-0 z-40 border-b border-[#E8EDF3] dark:border-slate-800 bg-white/95 dark:bg-[#0B1F3A]/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 transition-shadow duration-300 ${scrolled ? 'header-scrolled shadow-xs' : ''}`}>
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Brand Section */}
          <Link href="/" aria-label="Lumo home" className="flex items-center gap-2 transition-transform duration-200 hover:scale-[1.02]">
            <Logo />
          </Link>

          {/* Primary Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-[#0B1F3A] dark:text-slate-200">
            {mainNavItems.map((item) => {
              const active = isNavActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`nav-link-animated ${
                    active
                      ? 'text-[#F97316] font-extrabold'
                      : 'text-[#0B1F3A] dark:text-slate-200 hover:text-[#F97316]'
                  } transition-colors pb-0.5`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency Selector Pill (Visible on mobile & desktop) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-[#D9E2EC] dark:border-slate-700 shadow-xs text-xs font-bold text-[#0B1F3A] dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <svg className="size-4 rounded-full overflow-hidden shrink-0 border border-slate-200" viewBox="0 0 36 24" aria-hidden="true">
                <rect width="36" height="24" fill="#1EB53A" />
                <path d="M0,24 L36,0 L36,24 Z" fill="#00A3E0" />
                <path d="M0,24 L36,0" stroke="#FCD116" strokeWidth="7" />
                <path d="M0,24 L36,0" stroke="#000000" strokeWidth="4.5" />
              </svg>
              <span>TZS</span>
              <ChevronDown className="size-3 text-slate-500" aria-hidden="true" />
            </div>

            {/* Language & Theme Controls */}
            <div className="hidden xl:flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            {/* Cart Control with Red/Orange Circular Badge */}
            <Link href="/cart">
              <div
                className="relative flex items-center justify-center p-2 rounded-xl text-[#0B1F3A] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label={`Cart with ${cartCount || 2} items`}
              >
                <ShoppingCart className="size-6 text-[#0B4385] dark:text-sky-400" aria-hidden="true" />
                <span className="absolute -top-1 -right-1 size-5 rounded-full bg-[#FF6B00] text-[10px] font-extrabold text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-[#0B1F3A]">
                  {cartCount > 0 ? cartCount : 2}
                </span>
              </div>
            </Link>

            {/* Signed-Out Visitor Actions */}
            {!authUser ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-bold text-xs border-[#0B1F3A] text-[#0B1F3A] hover:bg-[#0B1F3A]/5 dark:text-slate-200 dark:border-slate-700"
                  >
                    {t('navigation.signIn')}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="font-bold text-xs bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl shadow-xs px-4 btn-premium"
                  >
                    {t('navigation.createAccount')}
                  </Button>
                </Link>
              </div>
            ) : (
              /* 9, 10. Signed-In Customer & Role-Aware Controls (Hidden on narrow mobile to keep header clean) */
              <div className="hidden md:flex items-center gap-2">
                {/* Non-Customer Role Dashboard Button */}
                {roleConfig && roleConfig.id !== 'customer' ? (
                  <Link href={roleConfig.home} className="hidden sm:inline-flex">
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      {roleConfig.label} Portal
                    </Button>
                  </Link>
                ) : null}

                {/* Account Menu Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-xl gap-2 px-3"
                        aria-label="User Account Menu"
                      >
                        <Avatar className="size-5">
                          <AvatarFallback className="bg-orange-500 text-white text-[10px] font-extrabold">
                            {getInitials(authUser.fullName || authUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{getFirstName(authUser.fullName || authUser.name)}</span>
                        <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-56 p-2 bg-slate-900 border-slate-800 text-slate-200">
                    <DropdownMenuLabel className="p-2 flex flex-col gap-0.5">
                      <span className="font-extrabold text-sm text-white truncate">
                        {authUser.fullName || authUser.name || 'Account User'}
                      </span>
                      <span className="text-xs text-slate-400 font-normal truncate">
                        {authUser.email}
                      </span>
                      {roleConfig ? (
                        <span className="mt-1 inline-flex w-fit items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                          {roleConfig.label}
                        </span>
                      ) : null}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() => {
                          router.push('/account')
                        }}
                        className="flex items-center gap-2 cursor-pointer py-2 px-2.5 hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <User className="size-4 text-slate-400" aria-hidden="true" />
                        <span>{t('account.myAccount')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          router.push('/account/orders')
                        }}
                        className="flex items-center gap-2 cursor-pointer py-2 px-2.5 hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <ShoppingBag className="size-4 text-slate-400" aria-hidden="true" />
                        <span>{t('navigation.myOrders')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          router.push('/account/sourcing')
                        }}
                        className="flex items-center gap-2 cursor-pointer py-2 px-2.5 hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <PackageSearch className="size-4 text-slate-400" aria-hidden="true" />
                        <span>{t('navigation.sourcingRequests')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          router.push('/account/orders')
                        }}
                        className="flex items-center gap-2 cursor-pointer py-2 px-2.5 hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <Truck className="size-4 text-slate-400" aria-hidden="true" />
                        <span>{t('navigation.trackDeliveries')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          router.push('/account/wishlist')
                        }}
                        className="flex items-center gap-2 cursor-pointer py-2 px-2.5 hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <Heart className="size-4 text-slate-400" aria-hidden="true" />
                        <span>{t('navigation.wishlist')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          router.push('/account/support')
                        }}
                        className="flex items-center gap-2 cursor-pointer py-2 px-2.5 hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <HelpCircle className="size-4 text-slate-400" aria-hidden="true" />
                        <span>{t('navigation.support')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-400 focus:text-red-300 focus:bg-red-950/40 cursor-pointer"
                    >
                      <LogOut className="size-4 mr-2" aria-hidden="true" />
                      {t('navigation.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* 14. Responsive Mobile Navigation Drawer Button */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden text-[#0B1F3A] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Open Navigation Menu"
                  >
                    <Menu className="size-6 text-[#0B1F3A] dark:text-slate-100" />
                  </Button>
                }
              />
              <SheetContent side="right" className="w-[85vw] max-w-xs p-5 flex flex-col gap-6 bg-slate-900 border-slate-800 text-slate-100">
                <SheetHeader className="p-0 border-b border-slate-800 pb-4">
                  <SheetTitle>
                    <Logo />
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-3 text-sm font-semibold">
                  {mainNavItems.map((item) => {
                    const active = isNavActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={
                          active
                            ? 'p-2.5 rounded-lg bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20'
                            : 'p-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-200'
                        }
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>

                <div className="mt-auto border-t border-slate-800 pt-4 flex flex-col gap-3">
                  {!authUser ? (
                    <div className="flex flex-col gap-2">
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        <Button variant="outline" className="w-full font-bold text-xs border-slate-700">
                          <LogIn className="size-4 mr-2" aria-hidden="true" />
                          {t('navigation.signIn')}
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full font-bold text-xs bg-orange-500 hover:bg-orange-600 text-white">
                          <UserPlus className="size-4 mr-2" aria-hidden="true" />
                          {t('navigation.createAccount')}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs text-white truncate">
                            {authUser.fullName || authUser.name}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {authUser.email}
                          </span>
                        </div>
                        {roleConfig ? (
                          <span className="text-[9px] font-extrabold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                            {roleConfig.label}
                          </span>
                        ) : null}
                      </div>
                      <Link href="/account" onClick={() => setMobileOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full font-bold text-xs border-slate-700">
                          {t('account.myAccount')}
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setMobileOpen(false)
                          handleSignOut()
                        }}
                        className="w-full font-bold text-xs"
                      >
                        <LogOut className="size-3.5 mr-1" aria-hidden="true" />
                        {t('navigation.signOut')}
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <span className="text-xs text-slate-400 font-semibold">{t('navigation.preferences')}</span>
                    <div className="flex items-center gap-1.5">
                      <LanguageToggle />
                      <ThemeToggle />
                    </div>
                  </div>
                  <RoleSwitcher />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
