'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  Headphones,
  Laptop,
  Link2,
  Lock,
  Package,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { CommandPalette } from '@/components/ui/command-palette'
import { DevRoleSwitcher as RoleSwitcher } from '@/components/dev/dev-role-switcher'

const PORTAL_ROLES = [
  {
    id: 'customer',
    title: 'Customer & Importer Portal',
    subtitle: 'Global Marketplace Storefront',
    description: 'Browse factory items, estimate landed costs in TZS, track live air/sea freight & manage orders.',
    icon: ShoppingBag,
    href: '/marketplace',
    badge: 'Popular',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
    actionText: 'Enter Marketplace',
  },
  {
    id: 'supplier',
    title: 'Global Supplier Dashboard',
    subtitle: 'Factory & Merchant Desk',
    description: 'List China, Dubai & Turkey wholesale products, manage order dispatches & request TZS payouts.',
    icon: Building2,
    href: '/supplier',
    badge: 'Verified Manufacturers',
    badgeColor: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    color: 'from-orange-500/20 to-amber-500/10 border-orange-500/30',
    actionText: 'Supplier Portal',
  },
  {
    id: 'sales',
    title: 'Sales & Sourcing Desk',
    subtitle: '1688 / Taobao Mediation',
    description: 'Review product link quote requests, negotiate factory pricing & mediate customer disputes.',
    icon: Headphones,
    href: '/sales',
    badge: 'Sales Operations',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
    actionText: 'Sales Desk',
  },
  {
    id: 'logistics',
    title: 'Logistics & Fleet Console',
    subtitle: 'Baraka Freight Dispatch',
    description: 'Manage air cargo waybills, sea container manifests & Dar es Salaam doorstep courier routes.',
    icon: Truck,
    href: '/logistics',
    badge: 'Air & Sea Freight',
    badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30',
    actionText: 'Fleet Management',
  },
  {
    id: 'admin',
    title: 'Executive Admin Portal',
    subtitle: 'System & Audit Control',
    description: 'Full oversight of platform GMV, product catalog approvals, user roles, KYC & escrow settlements.',
    icon: ShieldCheck,
    href: '/admin',
    badge: 'System Admin',
    badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30',
    actionText: 'Admin Console',
  },
]

const FACTORY_NODES = [
  { city: 'Yiwu & Guangzhou', country: 'China 🇨🇳', status: 'Online · 9,420 Manufacturers', ping: '12ms' },
  { city: 'Dubai Dragon Mart', country: 'UAE 🇦🇪', status: 'Online · 3,180 Distributors', ping: '28ms' },
  { city: 'Istanbul Exporters', country: 'Turkey 🇹🇷', status: 'Online · 1,850 Mills', ping: '45ms' },
  { city: 'Dar es Salaam Hub', country: 'Tanzania 🇹🇿', status: 'Online · Local Customs Clearing', ping: '2ms' },
]

export default function StartupPage() {
  const [selectedRole, setSelectedRole] = useState<string>('customer')

  return (
    <div className="flex min-h-svh flex-col bg-[#090d16] text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
      {/* Top Startup Bar */}
      <div className="bg-[#0f172a] text-xs font-semibold py-2 px-4 border-b border-slate-800 flex items-center justify-between text-slate-300 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="size-3.5 text-amber-400 animate-pulse shrink-0" />
          <span className="truncate text-[11px] sm:text-xs">LUMO Startup Platform &amp; Global B2B Sourcing Portal</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline text-slate-400">Environment: Production Build</span>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">
            System Operational
          </Badge>
        </div>
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0b1120]/90 backdrop-blur-md overflow-hidden">
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-2 sm:gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Logo tone="onPrimary" />

          <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <CommandPalette />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/login" />}
                className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                render={<Link href="/register" />}
                className="bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Create Account
              </Button>
            </div>

            {/* Mobile Auth Quick Action */}
            <div className="flex md:hidden items-center gap-1.5">
              <Button
                size="sm"
                render={<Link href="/login" />}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-lg px-3 py-1 h-8"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Banner Section */}
        <section className="relative border-b border-slate-800 bg-gradient-to-b from-[#0f172a] via-[#090d16] to-[#090d16] py-12 sm:py-20 overflow-hidden">
          {/* Ambient Glow Effects */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 size-[600px] bg-brand-500/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="absolute top-10 right-10 size-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center gap-6">
            <div className="flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1 text-xs font-bold text-brand-400">
              <Zap className="size-4 text-brand-400" />
              <span>Lumo Commerce Startup Launchpad</span>
            </div>

            <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white leading-tight">
              Cross-Border Trade Ecosystem <br />
              <span className="bg-gradient-to-r from-brand-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                Built for Tanzanian &amp; East African Enterprise
              </span>
            </h1>

            <p className="max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
              Select your portal below to launch into the Lumo Commerce Platform. Direct factory trade, landed TZS cost calculator, AzamPay payment protection, and air/sea logistics dispatch.
            </p>
          </div>
        </section>

        {/* Live Factory Network Status Ribbon */}
        <section className="border-b border-slate-800 bg-[#0c1322] py-4">
          <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {FACTORY_NODES.map((node) => (
                <div
                  key={node.city}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-xs"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                      {node.city} ({node.country})
                    </span>
                    <span className="text-[11px] text-slate-400">{node.status}</span>
                  </div>
                  <Badge variant="outline" className="border-slate-700 text-slate-300 font-mono text-[10px]">
                    {node.ping}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portal Selection Cards Section */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Select Your Access Portal</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Choose a dedicated dashboard role to enter the interactive Lumo platform.
              </p>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {PORTAL_ROLES.map((role) => {
                const IconComp = role.icon
                const isSelected = selectedRole === role.id

                return (
                  <Card
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`relative border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between bg-[#0f172a]/90 backdrop-blur-xl ${
                      isSelected
                        ? 'border-brand-500 ring-2 ring-brand-500 shadow-xl shadow-brand-500/10 -translate-y-1'
                        : 'border-slate-800 hover:border-slate-700 hover:-translate-y-0.5'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-3 rounded-xl border bg-gradient-to-br ${role.color}`}>
                          <IconComp className="size-6 text-white" />
                        </div>
                        <Badge className={`text-[10px] font-bold ${role.badgeColor}`}>
                          {role.badge}
                        </Badge>
                      </div>

                      <CardTitle className="text-base font-extrabold text-white mt-1">
                        {role.title}
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-400 font-semibold">
                        {role.subtitle}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-4 text-xs text-slate-300 leading-relaxed">
                      {role.description}
                    </CardContent>

                    <CardFooter className="pt-0">
                      <Button
                        size="sm"
                        className={`w-full font-bold text-xs h-9 rounded-xl transition-colors ${
                          isSelected
                            ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                        render={<Link href={role.href} />}
                      >
                        {role.actionText}
                        <ArrowRight className="size-3.5 ml-1.5" />
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Quick Sourcing & Links Tools Banner */}
        <section className="border-t border-slate-800 bg-[#0c1322] py-14">
          <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
              {/* Tool 1 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0f172a] space-y-4">
                <div className="size-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Link2 className="size-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Paste 1688 / Taobao Link</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Paste any Chinese product link from 1688, Taobao or Alibaba to generate an instant landed cost quotation in TZS.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700 bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
                  render={<Link href="/sourcing/paste-link" />}
                >
                  Launch Link Sourcer
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Button>
              </div>

              {/* Tool 2 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0f172a] space-y-4">
                <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Plane className="size-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Track Air &amp; Sea Cargo</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Real-time container manifest tracking from Guangzhou &amp; Dubai ports directly to Kariakoo logistics hub.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700 bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
                  render={<Link href="/account/orders" />}
                >
                  Track Shipments
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Button>
              </div>

              {/* Tool 3 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0f172a] space-y-4">
                <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Building2 className="size-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Supplier Onboarding</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Are you a factory in China, UAE or Turkey? Register as a verified Lumo seller to reach East African buyers.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700 bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
                  render={<Link href="/register?role=supplier" />}
                >
                  Become a Seller
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0b1120] text-slate-400 text-xs py-8">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo tone="onPrimary" />
          <span>© {new Date().getFullYear()} Lumo B2B Platform Startup. Guaranteed TZS Cross-Border Settlement.</span>
          <div className="flex items-center gap-4 text-slate-300 font-semibold">
            <Link href="/marketplace" className="hover:text-white transition-colors">
              Marketplace
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>

      {/* Floating Developer Role Switcher */}
      <RoleSwitcher />
    </div>
  )
}
