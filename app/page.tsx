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

      {/* Footer */}
      <footer className="border-t border-[#DCE6F0] bg-[#0B1F3A] text-slate-400 text-xs">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo />
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 font-medium">
              <Link href="/marketplace" className="hover:text-white transition-colors">
                {t('navigation.marketplace')}
              </Link>
              <Link href="/about" className="hover:text-white transition-colors">
                About Us
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact Us
              </Link>
              <Link href="/track-freight" className="hover:text-white transition-colors">
                {t('navigation.trackOrder')}
              </Link>
              <Link href="/help" className="hover:text-white transition-colors">
                {t('navigation.help')}
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-700/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-slate-500">
            <span>© {new Date().getFullYear()} Lumo Commerce Platform. Global Sourcing for East Africa.</span>
            <span>Secure TZS Payment Integration</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
