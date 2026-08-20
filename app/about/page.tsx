'use client'

import Link from 'next/link'
import {
  Globe,
  ShieldCheck,
  Truck,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  PackageSearch,
  Sparkles,
  MapPin,
  CreditCard,
  Phone,
  BarChart3,
  Award,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/brand/logo'

const CORE_PILLARS = [
  {
    icon: CreditCard,
    title: 'Zero Forex Risk & TZS Price Guarantee',
    description:
      'Tanzanian buyers pay strictly in Tanzanian Shillings (TZS) using LUMO Pay, M-Pesa, TigoPesa, or local bank transfers. Lumo absorbs all international currency exchange volatility with guaranteed quotes.',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: ShieldCheck,
    title: '10-Point Field Hub QC Inspection',
    description:
      'Our dedicated ground agents in Shenzhen, Yiwu, Dubai Dragon Mart, and Istanbul inspect every product batch, upload 10 high-resolution photos and video proof before international dispatch.',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Truck,
    title: 'Consolidated Landed Freight',
    description:
      'Seamless door-to-door Air (5-7 days) and Sea (24-30 days) freight directly to Dar es Salaam, Arusha, Mwanza, and Dodoma, with complete customs clearance handled by Lumo logistics partners.',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Building2,
    title: 'Direct Factory Relationships',
    description:
      'We bypass middlemen, connecting African merchants, retailers, and wholesalers directly with verified OEM manufacturers, eliminating inflated trading markups.',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
]

const GLOBAL_HUBS = [
  {
    country: 'Tanzania (East Africa Gateway)',
    city: 'Dar es Salaam HQ',
    role: 'Central Order Desk & Customer Logistics',
    specs: 'Victoria Place, Bagamoyo Road',
    badge: 'HQ',
    flag: '🇹🇿',
  },
  {
    country: 'China Hub',
    city: 'Shenzhen & Yiwu',
    role: 'Electronics, Hardware & General Merchandise QC Hub',
    specs: 'Huaqiangbei & Yiwu Trade City Hubs',
    badge: 'Field Ops',
    flag: '🇨🇳',
  },
  {
    country: 'Dubai (UAE) Hub',
    city: 'Dubai Dragon Mart',
    role: 'Lighting, Building Materials & Luxury Goods',
    specs: 'Dragon Mart 1, International City',
    badge: 'Field Ops',
    flag: '🇦🇪',
  },
  {
    country: 'Turkey Hub',
    city: 'Istanbul',
    role: 'Textiles, Fashion Apparel & Home Goods',
    specs: 'Laleli Commercial Plaza, Fatih',
    badge: 'Field Ops',
    flag: '🇹🇷',
  },
  {
    country: 'India Hub',
    city: 'Mumbai & Surat',
    role: 'Textile Manufacturing & Industrial Spares',
    specs: 'Surat Textile Park Hub',
    badge: 'Field Ops',
    flag: '🇮🇳',
  },
]

const STATS = [
  { value: '5+', label: 'Global Sourcing Hubs' },
  { value: '10,000+', label: 'Verified Factory Suppliers' },
  { value: '100%', label: 'TZS Price Guarantee' },
  { value: '0%', label: 'Forex Loss for Buyers' },
]

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-12 max-w-6xl mx-auto py-6 px-4">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#ea580c] p-8 sm:p-14 text-white overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
          <Badge className="bg-brand-500/20 text-brand-400 border border-brand-500/40 px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest backdrop-blur-xs">
            Direct Cross-Border Factory Trade Platform
          </Badge>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-heading leading-tight">
            Connecting East Africa Directly to Global Factories.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-sans">
            LUMO is East Africa&apos;s premier B2B and B2C direct factory sourcing platform. We empower African businesses and buyers to order directly from manufacturers in China, Dubai, Turkey, and India with zero forex risk, 10-point ground inspection proof, and door-to-door landed freight.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              size="lg"
              className="bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs sm:text-sm px-6 rounded-xl shadow-lg transition-transform hover:scale-105"
              render={<Link href="/marketplace" />}
            >
              Explore Global Marketplace
              <ArrowRight className="size-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-6 rounded-xl backdrop-blur-xs"
              render={<Link href="/contact" />}
            >
              <Phone className="size-4 mr-2" />
              Contact Sourcing Team
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <Card key={i} className="text-center p-6 border-border bg-card shadow-xs">
            <span className="text-2xl sm:text-4xl font-black text-brand-500 font-heading">{stat.value}</span>
            <span className="text-xs text-muted-foreground font-semibold mt-1 block">{stat.label}</span>
          </Card>
        ))}
      </div>

      {/* Mission & Vision Section */}
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <Badge className="bg-brand-500/10 text-brand-500 border border-brand-500/20 px-3 py-0.5 text-xs font-bold uppercase">
            Our Core Mission
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
            Eliminating Trade Barriers Between African Buyers &amp; Global Manufacturers
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Traditionally, sourcing goods from international markets like China or Dubai required expensive travel, unpredictable currency exchange rates, high risk of fake products, and complicated customs clearance.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            LUMO solves this end-to-end. Through our network of field agent hubs in Shenzhen, Yiwu, Dubai, and Istanbul, we inspect products at the factory floor, verify supplier legitimacy, provide full video and photo proof, and deliver landed goods to your doorstep in Tanzania.
          </p>
          <ul className="space-y-2 pt-2 text-xs font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-brand-500 shrink-0" />
              <span>Full buyer protection with LUMO Pay mobile payment protection integration.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-brand-500 shrink-0" />
              <span>Paste-link sourcing from 1688, Taobao, Alibaba, or Dragon Mart.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-brand-500 shrink-0" />
              <span>Consolidated customs clearance with fixed TZS landed shipping rates.</span>
            </li>
          </ul>
        </div>

        <Card className="p-6 border-brand-500/20 bg-gradient-to-br from-card via-muted/30 to-brand-500/5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Award className="size-5 text-brand-500" />
              Why Businesses Choose LUMO
            </CardTitle>
            <CardDescription className="text-xs">
              Built specifically for the Tanzanian &amp; East African commercial landscape.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-3 text-xs leading-relaxed text-muted-foreground">
            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="font-bold text-foreground block mb-0.5">1. Guaranteed Local TZS Quotations</span>
              <span>No unexpected bank forex markup fees or credit card dollar limits.</span>
            </div>
            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="font-bold text-foreground block mb-0.5">2. Dedicated Field Agent Network</span>
              <span>Human verification agents physically present in key manufacturing hubs.</span>
            </div>
            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="font-bold text-foreground block mb-0.5">3. Door-to-Door Landed Delivery</span>
              <span>Complete freight tracking from factory departure to Dar es Salaam HQ.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core Platform Pillars */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight font-heading">The Four Pillars of LUMO</h2>
          <p className="text-xs text-muted-foreground">
            How we ensure every sourcing order is safe, transparent, and profitable for you.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {CORE_PILLARS.map((pillar, i) => {
            const Icon = pillar.icon
            return (
              <Card key={i} className="p-6 border-border hover:border-brand-500/40 transition-all">
                <div className={`size-10 rounded-xl flex items-center justify-center border mb-4 ${pillar.color}`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="text-base font-bold mb-2 font-heading">{pillar.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">{pillar.description}</p>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Global Field Hub Network */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <Badge className="bg-brand-500/10 text-brand-500 border border-brand-500/20 px-3 py-0.5 text-xs font-bold uppercase">
            Global Infrastructure
          </Badge>
          <h2 className="text-2xl font-extrabold tracking-tight font-heading">Our Global Field Agent Network</h2>
          <p className="text-xs text-muted-foreground">
            Physical hubs stationed in the world&apos;s largest manufacturing centers.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GLOBAL_HUBS.map((hub, i) => (
            <Card key={i} className="p-5 border-border hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{hub.flag}</span>
                <Badge variant="outline" className="text-[10px] font-extrabold uppercase">
                  {hub.badge}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-foreground font-heading">{hub.country}</h3>
              <p className="text-xs font-semibold text-brand-500 mt-0.5">{hub.city}</p>
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{hub.role}</p>
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <MapPin className="size-3 text-brand-500 shrink-0" />
                <span className="truncate">{hub.specs}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action Banner */}
      <Card className="border-brand-500/30 bg-gradient-to-r from-brand-500/15 via-background to-amber-500/10 p-8 sm:p-10 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
            Ready to Start Direct Sourcing?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Whether you want to browse our verified catalog or paste a product link for custom factory quotation, LUMO makes international trade seamless.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Button size="lg" className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm px-8" render={<Link href="/sourcing/paste-link" />}>
              <PackageSearch className="size-4 mr-2" />
              Submit Sourcing Request
            </Button>
            <Button size="lg" variant="outline" className="font-bold text-xs sm:text-sm px-8" render={<Link href="/contact" />}>
              Talk to Sales Team
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
