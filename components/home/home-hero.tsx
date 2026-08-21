'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, ClipboardList, Search, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SourcingJourney } from '@/components/home/sourcing-journey'
import { useT } from '@/lib/i18n/use-locale'

export function HomeHero() {
  const t = useT()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    router.push(`/marketplace?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <section className="w-full bg-[#F6F9FC] px-3 sm:px-6 pt-3 sm:pt-4 pb-4">
      {/* Top Capsule Banner: Buyer Support • Secure Payments • Reliable Delivery */}
      <div className="mx-auto max-w-[1600px] flex justify-center mb-3">
        <Link
          href="/help"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary hover:bg-primary/80 text-white text-[11px] sm:text-xs font-semibold shadow-xs transition-colors max-w-full"
        >
          <span className="flex items-center gap-1.5">
            <span>🛡️</span>
            <span>Buyer Support</span>
            <span className="opacity-40">•</span>
            <span>Secure Payments</span>
            <span className="opacity-40">•</span>
            <span>Reliable Delivery</span>
          </span>
          <ChevronRight className="size-3.5 text-white/70" />
        </Link>
      </div>

      {/* Orange Hero Panel with Radial + Linear Gradient */}
      <div
        className="mx-auto max-w-[1600px] rounded-3xl overflow-hidden shadow-xl mb-4"
        style={{
          background:
            'radial-gradient(circle at 72% 35%, rgba(255, 205, 150, 0.40), transparent 42%), linear-gradient(135deg, #E65100 0%, #FF6B00 50%, #C23B00 100%)',
        }}
      >
        <div className="relative z-10 px-4 sm:px-10 lg:px-12 py-7 sm:py-12 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
            
            {/* Left Hero Content Column */}
            <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-4 sm:gap-5 text-left min-w-0">
              {/* Title */}
              <h1 className="text-[26px] sm:text-[38px] lg:text-[48px] font-extrabold text-white leading-[1.15] tracking-tight">
                Your trusted path
                <br />
                to global products.
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-base text-white/90 font-normal leading-snug max-w-md">
                Source, pay and track — all in one place.
              </p>

              {/* Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center bg-white rounded-2xl shadow-lg p-1 w-full min-h-[48px] sm:min-h-[58px]"
              >
                <div className="flex items-center flex-1 px-2.5 sm:px-3 gap-2 min-w-0">
                  <Search className="size-4 sm:size-5 text-[#94A3B8] shrink-0" />
                  <input
                    type="text"
                    placeholder="What product are you looking for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-[#0B1F3A] text-xs sm:text-sm font-medium outline-none placeholder:text-[#94A3B8] truncate"
                    aria-label="What product are you looking for?"
                  />
                </div>
                <Button
                  type="submit"
                  className="shrink-0 bg-[#0B1F3A] hover:bg-[#071324] text-white font-bold text-xs sm:text-sm px-3 sm:px-6 h-[40px] sm:h-[50px] rounded-xl transition-colors shadow-sm"
                >
                  Search Products
                </Button>
              </form>

              {/* CTA Pill Buttons (Side-by-Side 2-column grid on Mobile matching target mockup) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1">
                <Link href="/marketplace" className="w-full">
                  <Button className="w-full bg-white hover:bg-slate-100 text-[#0B1F3A] font-extrabold text-[11px] sm:text-xs lg:text-sm px-2 sm:px-4 h-11 sm:h-12 rounded-2xl shadow-md gap-1.5 transition-transform hover:-translate-y-px">
                    <ShoppingBag className="size-3.5 sm:size-4 text-primary shrink-0" />
                    <span className="truncate">Explore Marketplace</span>
                    <ChevronRight className="size-3.5 sm:size-4 text-primary shrink-0" />
                  </Button>
                </Link>
                <Link href="/sourcing/paste-link" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full bg-white/15 hover:bg-white/25 text-white border-white/40 hover:border-white/60 font-bold text-[11px] sm:text-xs lg:text-sm px-2 sm:px-4 h-11 sm:h-12 rounded-2xl gap-1.5 shadow-sm backdrop-blur-md transition-transform hover:-translate-y-px"
                  >
                    <ClipboardList className="size-3.5 sm:size-4 text-white shrink-0" />
                    <span className="truncate">Request Product Sourcing</span>
                    <ChevronRight className="size-3.5 sm:size-4 text-white/80 shrink-0" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Desktop Right Column Sourcing Journey */}
            <div className="hidden lg:block lg:col-span-6 xl:col-span-7 w-full min-w-0">
              <SourcingJourney />
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Sourcing Journey Card (Placed directly below blue hero card matching target mockup) */}
      <div className="block lg:hidden mx-auto max-w-[1600px]">
        <SourcingJourney />
      </div>
    </section>
  )
}
