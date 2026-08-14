'use client'

import React from 'react'
import { GlobalHeader } from '@/components/layout/global-header'
import { FlyingCartContainer } from '@/components/cart/flying-cart-item'
import { LocaleTransitionProvider } from '@/components/i18n/locale-transition-provider'
import { ScrollToTop } from '@/components/ui/scroll-to-top'

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-[#FFF9F2] dark:bg-[#061326] text-[#0B1F3A] dark:text-slate-100 antialiased relative w-full max-w-full overflow-x-hidden">
      <FlyingCartContainer />
      <GlobalHeader />
      {/* Main Content — wrapped in locale transition for smooth language switching */}
      <LocaleTransitionProvider>
        <main className="flex-1 mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </LocaleTransitionProvider>
      <ScrollToTop />
    </div>
  )
}
