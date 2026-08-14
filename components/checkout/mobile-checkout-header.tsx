'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Menu, ShoppingCart } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useCartStore } from '@/lib/stores/cart-store'

export function MobileCheckoutHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const cartLines = useCartStore((s) => s.lines) ?? []
  const activeCount = mounted
    ? cartLines.filter((l) => !l.savedForLater).reduce((sum, l) => sum + l.quantity, 0)
    : 0

  return (
    <header
      className="lg:hidden sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-2xs px-4 py-3"
      suppressHydrationWarning
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Lumo Wordmark */}
        <Link href="/" aria-label="Lumo Home" className="flex items-center">
          <Logo />
        </Link>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2.5">
          {/* TZS Currency Selector */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF9F5] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] shadow-2xs"
            aria-label="Currency: TZS"
          >
            <svg className="size-4 rounded-full overflow-hidden shrink-0 border border-slate-200" viewBox="0 0 36 24" aria-hidden="true">
              <rect width="36" height="24" fill="#1EB53A" />
              <path d="M0,24 L36,0 L36,24 Z" fill="#00A3E0" />
              <path d="M0,24 L36,0" stroke="#FCD116" strokeWidth="7" />
              <path d="M0,24 L36,0" stroke="#000000" strokeWidth="4.5" />
            </svg>
            <span className="text-xs font-extrabold">TZS</span>
            <ChevronDown className="size-3 text-slate-500" aria-hidden="true" />
          </div>

          {/* Cart Icon with Orange Badge */}
          <Link href="/cart" aria-label={`Shopping cart with ${activeCount} items`}>
            <div className="relative flex items-center justify-center p-1.5 rounded-lg text-[#0F172A] hover:bg-slate-100 transition-colors">
              <ShoppingCart className="size-5 text-[#0F172A]" aria-hidden="true" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4.5 rounded-full bg-[#F95700] text-[10px] font-extrabold text-white flex items-center justify-center border-2 border-white shadow-2xs">
                  {activeCount}
                </span>
              )}
            </div>
          </Link>

          {/* Hamburger Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-[#0F172A] hover:bg-slate-100 p-0"
                  aria-label="Open Navigation Menu"
                >
                  <Menu className="size-5 text-[#0F172A]" />
                </Button>
              }
            />
            <SheetContent side="right" className="w-[85vw] max-w-xs p-5 flex flex-col gap-6 bg-slate-900 text-slate-100">
              <SheetHeader className="p-0 border-b border-slate-800 pb-4">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-3 text-sm font-semibold">
                <Link href="/" onClick={() => setMobileOpen(false)} className="p-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-200">
                  Home
                </Link>
                <Link href="/marketplace" onClick={() => setMobileOpen(false)} className="p-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-200">
                  Marketplace
                </Link>
                <Link href="/track-freight" onClick={() => setMobileOpen(false)} className="p-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-200">
                  Track Order
                </Link>
                <Link href="/supplier" onClick={() => setMobileOpen(false)} className="p-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-200">
                  Suppliers
                </Link>
                <Link href="/account" onClick={() => setMobileOpen(false)} className="p-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-200">
                  Account
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
