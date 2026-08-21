'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  Globe,
  Heart,
  HelpCircle,
  Info,
  LayoutGrid,
  Link2,
  LogIn,
  LogOut,
  Menu,
  PackageSearch,
  PhoneCall,
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
import { CurrencySelector } from '@/components/ui/currency-selector'
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
    { label: t('navigation.marketplace'), href: '/marketplace', icon: LayoutGrid },
    { label: t('navigation.sourceProduct'), href: '/sourcing/request', icon: PackageSearch },
    { label: t('navigation.trackOrder'), href: '/track-freight', icon: Truck },
    { label: t('navigation.suppliers'), href: '/supplier', icon: Boxes },
    { label: t('navigation.aboutUs'), href: '/about', icon: Info },
    { label: t('navigation.contactUs'), href: '/contact', icon: PhoneCall },
    { label: t('navigation.help'), href: '/help', icon: HelpCircle },
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
  const [mounted, setMounted] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const prevCartCount = useRef(0)

  useEffect(() => {
    setMounted(true)
  }, [])

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
            {/* Currency Selector Pill */}
            <CurrencySelector />

            {/* Language & Theme Controls */}
            <div className="hidden xl:flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            {/* Cart Control with Red/Orange Circular Badge */}
            <Link href="/cart">
              <div
                className="relative flex items-center justify-center p-2 rounded-xl text-[#0B1F3A] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label={`Cart with ${cartCount} items`}
              >
                <ShoppingCart className="size-6 text-[#0B4385] dark:text-sky-400" aria-hidden="true" />
                {mounted && cartCount > 0 ? (
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-[10px] font-extrabold text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-[#0B1F3A]">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                ) : null}
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
              <SheetContent side="right" className="fixed inset-y-0 top-0 bottom-0 right-0 z-50 h-screen max-h-screen w-[82vw] max-w-[300px] p-4 flex flex-col justify-between bg-gradient-to-b from-[#1a0c02] via-[#0f172a] to-[#1a0c02] border-l border-orange-500/30 text-slate-100 shadow-2xl overflow-hidden">
                {/* Background Ambient Orange Glows - clipped by overflow-hidden */}
                <div className="absolute -top-24 -right-24 size-64 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-orange-600/15 blur-3xl pointer-events-none" />

                {/* Top Section - Header & Scrollable Nav */}
                <div className="flex flex-col gap-3 relative z-10 min-h-0 flex-1 overflow-hidden">
                  {/* Top Header Logo */}
                  <SheetHeader className="p-0 border-b border-orange-500/25 pb-3 text-left shrink-0">
                    <SheetTitle className="flex items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white font-black text-base shadow-md shadow-orange-500/30">
                        L
                      </span>
                      <span className="text-xl font-black tracking-tight text-white">
                        Lumo
                      </span>
                    </SheetTitle>
                  </SheetHeader>

                  {/* Navigation Links - Scrollable if screen is short */}
                  <nav className="flex flex-col gap-1.5 text-sm font-semibold overflow-y-auto pr-1 flex-1">
                    {mainNavItems.map((item) => {
                      const active = isNavActive(item.href)
                      const IconComp = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setMobileOpen(false)}
                          className={
                            active
                              ? 'group flex items-center justify-between p-2.5 rounded-xl bg-orange-500 text-white font-extrabold shadow-md shadow-orange-500/25 border border-orange-400 shrink-0'
                              : 'group flex items-center justify-between p-2 rounded-xl hover:bg-slate-900 transition-all text-slate-100 hover:text-white font-semibold shrink-0'
                          }
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={
                                active
                                  ? 'flex size-7 items-center justify-center rounded-lg bg-white/20 text-white'
                                  : 'flex size-7 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-colors'
                              }
                            >
                              {IconComp && <IconComp className="size-3.5" />}
                            </span>
                            <span className={active ? 'text-white font-black text-sm' : 'text-slate-100 font-bold group-hover:text-white text-sm'}>
                              {item.label}
                            </span>
                          </div>
                          <ChevronRight
                            className={
                              active
                                ? 'size-3.5 text-white opacity-90'
                                : 'size-3.5 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all'
                            }
                          />
                        </Link>
                      )
                    })}
                  </nav>
                </div>

                {/* Bottom Section - Pinned Static (Not Scrollable) */}
                <div className="border-t border-orange-500/25 pt-3 flex flex-col gap-2.5 relative z-10 shrink-0 mt-2">
                  {!authUser ? (
                    <div className="flex flex-col gap-2">
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        <Button variant="outline" className="w-full font-bold text-xs h-9 border-orange-500/30 bg-slate-900/90 text-slate-100 hover:bg-slate-800 hover:text-white rounded-xl">
                          <LogIn className="size-3.5 mr-2 text-orange-400" aria-hidden="true" />
                          {t('navigation.signIn')}
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full font-bold text-xs h-9 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md shadow-orange-500/25">
                          <UserPlus className="size-3.5 mr-2" aria-hidden="true" />
                          {t('navigation.createAccount')}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {/* User Profile Info Card - Vibrant Orange */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 flex items-center justify-between border border-orange-400">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="size-8 ring-2 ring-white/40 shrink-0">
                            <AvatarFallback className="bg-white text-orange-600 font-black text-[11px]">
                              {getInitials(authUser.fullName || authUser.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-black text-xs text-white truncate drop-shadow-xs">
                              {authUser.fullName || authUser.name}
                            </span>
                            <span className="text-[10px] text-orange-100 font-medium truncate opacity-90">
                              {authUser.email}
                            </span>
                          </div>
                        </div>
                        {roleConfig ? (
                          <span className="text-[9px] font-black bg-slate-950/80 text-white px-2 py-0.5 rounded-full shrink-0 border border-white/20 shadow-xs">
                            {roleConfig.label}
                          </span>
                        ) : null}
                      </div>

                      {/* Account Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Link href="/account" onClick={() => setMobileOpen(false)}>
                          <Button
                            size="sm"
                            className="w-full font-black text-xs h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-950 shadow-md border-0 cursor-pointer"
                          >
                            <User className="size-3.5 mr-1 text-slate-900" />
                            {t('account.myAccount')}
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => {
                            setMobileOpen(false)
                            handleSignOut()
                          }}
                          className="w-full font-extrabold text-xs h-9 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white border border-red-500/30 cursor-pointer"
                        >
                          <LogOut className="size-3.5 mr-1" aria-hidden="true" />
                          {t('navigation.signOut')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Preferences Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-orange-500/20">
                    <span className="text-[11px] text-slate-400 font-semibold">{t('navigation.preferences')}</span>
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
