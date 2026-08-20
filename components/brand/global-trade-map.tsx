'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Anchor,
  CheckCircle2,
  Clock,
  Globe2,
  Plane,
  ShieldCheck,
  Ship,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TradeHub {
  id: string
  name: string
  country: string
  flag: string
  type: 'Factory' | 'Port' | 'Marketplace' | 'Destination'
  status: string
  eta: string
  activeRoutes: number
}

const TRADE_HUBS: TradeHub[] = [
  {
    id: 'cn',
    name: 'Yiwu & Guangzhou Hub',
    country: 'China',
    flag: '🇨🇳',
    type: 'Factory',
    status: 'Air & Sea Freight Active',
    eta: '5-7 Days Air / 21 Days Sea',
    activeRoutes: 42,
  },
  {
    id: 'ae',
    name: 'Dubai Dragon Mart',
    country: 'UAE',
    flag: '🇦🇪',
    type: 'Marketplace',
    status: 'Express Clearance',
    eta: '3-5 Days Air',
    activeRoutes: 28,
  },
  {
    id: 'tr',
    name: 'Istanbul Textile Center',
    country: 'Turkey',
    flag: '🇹🇷',
    type: 'Factory',
    status: 'Direct Cargo',
    eta: '4-6 Days Air',
    activeRoutes: 19,
  },
  {
    id: 'in',
    name: 'Mumbai Tech & Chemical',
    country: 'India',
    flag: '🇮🇳',
    type: 'Factory',
    status: 'Sea Cargo Active',
    eta: '14 Days Sea',
    activeRoutes: 15,
  },
  {
    id: 'tz',
    name: 'Dar es Salaam Gateway',
    country: 'Tanzania',
    flag: '🇹🇿',
    type: 'Destination',
    status: 'Door-to-Door Delivery',
    eta: 'Guaranteed TZS Quote',
    activeRoutes: 104,
  },
]

export function GlobalTradeMap() {
  const [activeHubIndex, setActiveHubIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHubIndex((prev) => (prev + 1) % TRADE_HUBS.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-slate-800 bg-[#0f172a] p-6 text-white shadow-2xl">
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 bg-[radial-[#1e293b]_1px,transparent_1px] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600/20 p-2.5 text-blue-400 border border-blue-500/30">
            <Globe2 className="size-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold tracking-tight text-white">
                Live Global Trade Corridor Visualizer
              </h3>
              <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border-emerald-500/30">
                100% Guaranteed TZS
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct factory sourcing from Yiwu, Guangzhou, Dubai, Istanbul &amp; Mumbai with tracked freight to East Africa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 border border-slate-700">
            <Plane className="size-3.5 text-blue-400" />
            <span>Air Freight (3-7 Days)</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 border border-slate-700">
            <Ship className="size-3.5 text-emerald-400" />
            <span>Sea Freight (14-25 Days)</span>
          </div>
        </div>
      </div>

      {/* Trade Route Corridor Cards */}
      <div className="relative z-10 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 pt-6">
        {TRADE_HUBS.map((hub, idx) => {
          const isActive = idx === activeHubIndex
          return (
            <div
              key={hub.id}
              className={`relative flex flex-col justify-between rounded-2xl p-4 transition-all duration-300 border ${
                isActive
                  ? 'border-blue-500 bg-slate-800/90 shadow-lg shadow-blue-500/10 scale-[1.02]'
                  : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{hub.flag}</span>
                    <span className="text-xs font-bold text-slate-200">{hub.country}</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                    {hub.type}
                  </span>
                </div>

                <h4 className="text-xs font-extrabold text-white leading-tight">{hub.name}</h4>

                <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="size-3 text-blue-400 shrink-0" />
                  <span className="truncate">{hub.eta}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  {hub.status}
                </span>
                <span className="text-slate-500 font-mono">{hub.activeRoutes} routes</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Live Financial & Trade Metrics Bar */}
      <div className="relative z-10 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-slate-900/80 p-4 border border-slate-800">
        <div className="flex items-center gap-6 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-amber-400" />
            <span>LUMO Trade Protection: <strong className="text-white tnum">100% Protected</strong></span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-400" />
            <span>USD/TZS Exchange Rate: <strong className="text-white tnum">Fixed on Order</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
          <Sparkles className="size-4" />
          <span>Real-time Port Customs &amp; TRA Clearance Integrated</span>
        </div>
      </div>
    </div>
  )
}
