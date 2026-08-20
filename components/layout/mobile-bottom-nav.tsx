'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, Package, ShoppingCart, User } from 'lucide-react'
import { useT } from '@/lib/i18n/use-locale'
import { useCartStore } from '@/lib/stores/cart-store'

export function MobileBottomNav() {
  const t = useT()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  const cartLines = useCartStore((s) => s.lines) ?? []
  const cartCount = mounted ? cartLines.reduce((sum, l) => sum + l.quantity, 0) : 0

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    { label: t('navigation.home') || 'Home', href: '/', icon: Home },
    { label: t('navigation.marketplace') || 'Marketplace', href: '/marketplace', icon: LayoutGrid },
    { label: t('navigation.trackOrder') || 'Track Order', href: '/track-freight', icon: Package },
    { label: t('navigation.cart') || 'Cart', href: '/cart', icon: ShoppingCart, badge: cartCount },
    { label: t('navigation.account') || 'Account', href: '/account', icon: User },
  ]

  function isActive(href: string) {
    if (!mounted || !pathname) return href === '/'
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0B1F3A] border-t border-[#E2E8F0] dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]"
      aria-label="Mobile Navigation Bar"
      suppressHydrationWarning
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 min-w-[60px] rounded-lg transition-colors ${
                active
                  ? 'text-[#0B4385] dark:text-sky-400 font-bold'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#0B1F3A] dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div
                className={`relative flex items-center justify-center p-1 rounded-full transition-transform ${
                  active ? 'scale-110' : ''
                }`}
              >
                <Icon className={`size-5 ${active ? 'text-[#0B4385] dark:text-sky-400' : 'text-[#64748B] dark:text-slate-400'}`} />
                {item.badge !== undefined && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-extrabold text-white flex items-center justify-center border-2 border-white dark:border-[#0B1F3A] leading-none shadow-xs">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] leading-tight tracking-tight mt-0.5 ${active ? 'font-bold text-[#0B4385] dark:text-sky-400' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

