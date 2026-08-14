'use client'

import type * as React from 'react'
import Link from 'next/link'
import {
  Globe,
  Lock,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { Badge } from '@/components/ui/badge'
import { AuthLogisticsIllustration } from '@/components/auth/auth-logistics-illustration'

const HIGHLIGHTS = [
  {
    icon: Globe,
    title: 'Direct Factory Sourcing Hubs',
    body: 'Guangzhou & Yiwu (China 🇨🇳), Dubai Dragon Mart (UAE 🇦🇪), & Istanbul (Turkey 🇹🇷).',
  },
  {
    icon: ShieldCheck,
    title: 'Guaranteed TZS Pricing & Buyer Protection',
    body: 'Zero forex risk. Payments protected until goods pass Tanzanian port inspection.',
  },
  {
    icon: Truck,
    title: 'Integrated Air & Sea Logistics',
    body: 'Door-to-door shipping to Dar es Salaam, Arusha, Dodoma & Mwanza with live container tracking.',
  },
]

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh min-h-svh flex-col lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(480px,1fr)] xl:grid-cols-[minmax(0,1.25fr)_minmax(540px,1fr)] antialiased bg-background overflow-x-hidden selection:bg-[#F95700] selection:text-white">
      {/* Left Brand / Global Trade Highlight Panel in Structural Dark Navy */}
      <aside className="hidden bg-navy-900 text-white px-10 py-10 lg:flex lg:flex-col lg:justify-between relative overflow-hidden border-r border-navy-700/80">
        {/* Ambient radial glow background */}
        <div className="absolute top-1/4 -left-20 size-96 bg-brand-500/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-0 size-80 bg-info-400/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="w-fit rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
          >
            <Logo tone="onPrimary" />
          </Link>
          <Badge className="bg-navy-700/80 text-brand-500 border border-brand-500/30 px-3 py-1 text-xs font-bold backdrop-blur gap-1.5 shadow-sm">
            <Sparkles className="size-3.5 text-brand-500" />
            Managed B2B &amp; B2C Platform
          </Badge>
        </div>

        <div className="relative z-10 flex max-w-lg flex-col gap-8 my-auto py-8">
          <div className="flex flex-col gap-3 font-heading">
            <h2 className="text-3xl lg:text-4xl leading-tight font-extrabold font-heading tracking-tight text-white">
              Empowering Direct Global Sourcing to East Africa.
            </h2>
            <p className="text-sm leading-relaxed text-navy-200 font-sans">
              A unified procurement ecosystem for Tanzanian buyers, global suppliers in China &amp; Dubai, sales desks, and logistics fleets.
            </p>
          </div>

          <div className="grid gap-3.5">
            {HIGHLIGHTS.map((item) => (
              <div key={item.title} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-navy-700/50 border border-navy-700/80 backdrop-blur card-hover-lift">
                <div className="rounded-lg bg-brand-500/20 p-2 text-brand-500 shrink-0 mt-0.5 border border-brand-500/30">
                  <item.icon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-bold text-white">{item.title}</p>
                  <p className="text-[11px] leading-relaxed text-navy-200">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Key Platform Stats Pill Bar */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-navy-700/80 text-center">
            <div className="p-2.5 rounded-lg bg-navy-700/40 border border-navy-700">
              <span className="block text-lg font-extrabold text-white tnum">12,000+</span>
              <span className="text-[10px] text-navy-200 uppercase font-semibold">Verified Suppliers</span>
            </div>
            <div className="p-2.5 rounded-lg bg-navy-700/40 border border-navy-700">
              <span className="block text-lg font-extrabold text-brand-500 tnum">0%</span>
              <span className="text-[10px] text-navy-200 uppercase font-semibold">Forex Surcharge</span>
            </div>
            <div className="p-2.5 rounded-lg bg-navy-700/40 border border-navy-700">
              <span className="block text-lg font-extrabold text-white tnum">48 hrs</span>
              <span className="text-[10px] text-navy-200 uppercase font-semibold">RFQ Quotation</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-navy-200 border-t border-navy-700/80 pt-4">
          <p>&copy; {new Date().getFullYear()} Lumo Commerce Platform.</p>
          <span className="flex items-center gap-1 font-semibold text-white">
            <Lock className="size-3.5 text-brand-500" /> Enterprise Buyer Protection
          </span>
        </div>
      </aside>

      {/* Right Form Panel */}
      <main className="relative flex flex-1 flex-col justify-between bg-background overflow-hidden min-h-dvh min-h-svh pb-[env(safe-area-inset-bottom)]">
        {/* Background Logistics Line Art Pattern */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-orange-100/70 via-orange-50/30 to-transparent dark:from-orange-950/30 dark:via-transparent" />
          <AuthLogisticsIllustration className="relative h-[140px] sm:h-[180px] lg:h-[220px] w-full text-[#FF9A5C]/40 dark:text-orange-400/25" />
        </div>

        <div className="relative z-10 flex items-center justify-between gap-2 px-6 py-5 sm:px-10">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-12 sm:px-10">
          <div className="flex w-full max-w-md flex-col gap-6">
            <header className="flex flex-col gap-2 text-center sm:text-left font-heading">
              <h1 className="text-2xl font-extrabold font-heading tracking-tight text-foreground">{title}</h1>
              {description && (
                <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
              )}
            </header>

            {children}

            {footer && (
              <div className="text-center text-xs text-muted-foreground pt-3 border-t border-border">
                {footer}
              </div>
            )}
          </div>
        </div>

        {/* Security Badge Below Form */}
        <div className="relative z-10 flex items-center justify-center gap-2.5 pb-6 text-xs text-[#64748B] dark:text-slate-400 font-semibold">
          <div className="size-7 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Lock className="size-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
          </div>
          <span>Secure authentication • Protected by Lumo</span>
        </div>
      </main>
    </div>
  )
}
