'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GlobalHeader } from '@/components/layout/global-header'
import { LocaleTransitionProvider } from '@/components/i18n/locale-transition-provider'
import { HomeHero } from '@/components/home/home-hero'
import { TrustHighlights } from '@/components/home/trust-highlights'
import { CategoryGrid } from '@/components/home/category-grid'
import { HomeProducts } from '@/components/home/home-products'
import { HomeValueStrip } from '@/components/home/home-value-strip'
import { Logo } from '@/components/brand/logo'
import { useT } from '@/lib/i18n/use-locale'
import { useSessionStore } from '@/lib/stores/session-store'

export default function HomePage() {
  const t = useT()

  // Auth & Session state — synchronize server session on mount
  const sessionUser = useSessionStore((s) => s.user)
  const [authUser, setAuthUser] = useState<any>(sessionUser)

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

  return (
    <div className="flex min-h-svh flex-col bg-[#F4F8FC] text-[#0B1F3A] antialiased selection:bg-[#FF6B00] selection:text-white">
      {/* Unified Global Header */}
      <GlobalHeader />

      {/* Main Content */}
      <LocaleTransitionProvider>
        <main className="flex-1">
          {/* Hero Section */}
          <HomeHero />

          {/* Trust Highlights Strip */}
          <TrustHighlights />

          {/* Shop by Category */}
          <CategoryGrid />

          {/* Trending & Featured Direct Factory Products */}
          <HomeProducts />

          {/* Bottom Value Strip */}
          <HomeValueStrip />
        </main>
      </LocaleTransitionProvider>

      {/* Modern High-Contrast Footer */}
      <footer className="border-t border-slate-800 bg-gradient-to-b from-[#0F172A] via-[#0B132B] to-[#070A14] text-slate-300 text-xs">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Brand & Summary */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-orange-500 font-extrabold text-white text-sm shadow-md shadow-orange-500/30">
                  L
                </span>
                <span className="text-lg font-black text-white tracking-tight">Lumo</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct factory sourcing from verified suppliers in China, Turkey, and Dubai—delivered across Tanzania with transparent TZS pricing.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Quick Navigation</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                <li>
                  <Link href="/marketplace" className="hover:text-orange-400 transition-colors">
                    {t('navigation.marketplace')}
                  </Link>
                </li>
                <li>
                  <Link href="/sourcing/request" className="hover:text-orange-400 transition-colors">
                    {t('navigation.sourceProduct')}
                  </Link>
                </li>
                <li>
                  <Link href="/track-freight" className="hover:text-orange-400 transition-colors">
                    {t('navigation.trackOrder')}
                  </Link>
                </li>
                <li>
                  <Link href="/supplier" className="hover:text-orange-400 transition-colors">
                    {t('navigation.suppliers')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Company & Contact */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Company & Support</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                <li>
                  <Link href="/about" className="hover:text-orange-400 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-orange-400 transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-orange-400 transition-colors">
                    Help Center &amp; FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Sourcing Hubs */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Active Sourcing Hubs</h4>
              <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                  Guangzhou / Yiwu, China
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                  Istanbul / Bursa, Turkey
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                  Dragon Mart, Dubai
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-slate-400 font-medium">
            <span>© {new Date().getFullYear()} Lumo Commerce Platform. All rights reserved.</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
                Trade Protection Protected Payments
              </span>
              <span>Secure TZS Settlement</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
