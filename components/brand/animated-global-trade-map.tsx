'use client'

import { useEffect, useState } from 'react'
import {
  Anchor,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Globe2,
  Package,
  Plane,
  ShieldCheck,
  Ship,
  Sparkles,
  TrendingUp,
  Truck,
  Building2,
} from 'lucide-react'

// Supplier & Destination Nodes (Coordinates normalized on a 1000x500 SVG ViewBox)
export interface TradeNode {
  id: string
  name: string
  country: string
  flag: string
  role: 'Origin' | 'Destination' | 'Hub'
  x: number
  y: number
  type: string
  rating: string
  products: string
  transitTime: string
  verified: boolean
}

const TRADE_NODES: TradeNode[] = [
  // HQ Destination
  {
    id: 'tz',
    name: 'Dar es Salaam Gateway',
    country: 'Tanzania HQ',
    flag: '🇹🇿',
    role: 'Destination',
    x: 590,
    y: 310,
    type: 'LUMO HQ & Port Hub',
    rating: '5.0 ★',
    products: 'Direct Fulfillment',
    transitTime: 'Door-to-Door Delivery',
    verified: true,
  },
  // Primary Global Origins
  {
    id: 'cn-yiwu',
    name: 'Yiwu & Guangzhou Hub',
    country: 'China',
    flag: '🇨🇳',
    role: 'Origin',
    x: 820,
    y: 190,
    type: 'Wholesale Electronics & General',
    rating: '4.9 ★',
    products: '250,000+ Items',
    transitTime: '5-7 Days Air / 21 Days Sea',
    verified: true,
  },
  {
    id: 'ae-dubai',
    name: 'Dubai Dragon Mart',
    country: 'Dubai (UAE)',
    flag: '🇦🇪',
    role: 'Origin',
    x: 650,
    y: 210,
    type: 'Luxury Goods & Electronics',
    rating: '4.95 ★',
    products: '85,000+ Items',
    transitTime: '3-5 Days Express Air',
    verified: true,
  },
  {
    id: 'tr-istanbul',
    name: 'Istanbul Textile Center',
    country: 'Turkey',
    flag: '🇹🇷',
    role: 'Origin',
    x: 550,
    y: 150,
    type: 'Apparel, Carpets & Home',
    rating: '4.85 ★',
    products: '42,000+ Items',
    transitTime: '4-6 Days Air Cargo',
    verified: true,
  },
  {
    id: 'in-mumbai',
    name: 'Mumbai Tech & Pharma',
    country: 'India',
    flag: '🇮🇳',
    role: 'Origin',
    x: 720,
    y: 230,
    type: 'Generics & Electrical',
    rating: '4.8 ★',
    products: '35,000+ Items',
    transitTime: '5-8 Days Air / 14 Days Sea',
    verified: true,
  },
  {
    id: 'de-frankfurt',
    name: 'Frankfurt Industrial',
    country: 'Germany',
    flag: '🇩🇪',
    role: 'Origin',
    x: 500,
    y: 120,
    type: 'Machinery & Solar Electronics',
    rating: '4.98 ★',
    products: '18,000+ Items',
    transitTime: '5-7 Days Air',
    verified: true,
  },
  {
    id: 'us-chicago',
    name: 'US Tech Sourcing Hub',
    country: 'United States',
    flag: '🇺🇸',
    role: 'Origin',
    x: 250,
    y: 160,
    type: 'Enterprise Server Equipment',
    rating: '4.92 ★',
    products: '12,000+ Items',
    transitTime: '6-8 Days Air',
    verified: true,
  },
]

// Animated Trade Route Paths
interface RoutePath {
  id: string
  fromId: string
  toId: string
  mode: 'Air' | 'Sea' | 'Express'
  label: string
  color: string
  dashOffset: string
  eta: string
}

const TRADE_ROUTES: RoutePath[] = [
  {
    id: 'r-cn-tz',
    fromId: 'cn-yiwu',
    toId: 'tz',
    mode: 'Sea',
    label: 'China → Dar es Salaam (Sea Freight)',
    color: '#0D9488', // Teal
    dashOffset: 'dash-sea',
    eta: '21 Days',
  },
  {
    id: 'r-cn-tz-air',
    fromId: 'cn-yiwu',
    toId: 'tz',
    mode: 'Air',
    label: 'Guangzhou → Dar es Salaam (Direct Air)',
    color: '#2563EB', // Blue
    dashOffset: 'dash-air',
    eta: '5-7 Days',
  },
  {
    id: 'r-ae-tz',
    fromId: 'ae-dubai',
    toId: 'tz',
    mode: 'Express',
    label: 'Dubai Dragon Mart → Dar es Salaam',
    color: '#D4AF37', // Gold
    dashOffset: 'dash-express',
    eta: '3 Days',
  },
  {
    id: 'r-tr-tz',
    fromId: 'tr-istanbul',
    toId: 'tz',
    mode: 'Air',
    label: 'Istanbul Cargo → Dar es Salaam',
    color: '#2563EB',
    dashOffset: 'dash-air-fast',
    eta: '4 Days',
  },
  {
    id: 'r-in-tz',
    fromId: 'in-mumbai',
    toId: 'tz',
    mode: 'Sea',
    label: 'Mumbai Port → Dar Port',
    color: '#0D9488',
    dashOffset: 'dash-sea-2',
    eta: '14 Days',
  },
  {
    id: 'r-de-tz',
    fromId: 'de-frankfurt',
    toId: 'tz',
    mode: 'Air',
    label: 'Frankfurt → Dar Cargo',
    color: '#2563EB',
    dashOffset: 'dash-air-3',
    eta: '5 Days',
  },
  {
    id: 'r-us-tz',
    fromId: 'us-chicago',
    toId: 'tz',
    mode: 'Air',
    label: 'US Sourcing → Dar Cargo',
    color: '#2563EB',
    dashOffset: 'dash-air-4',
    eta: '6 Days',
  },
]

// 7-Step Supply Chain Lifecycle
const TIMELINE_STEPS = [
  { id: 1, name: 'Verified Supplier', status: 'Passed' },
  { id: 2, name: 'Quality Inspection', status: 'Passed' },
  { id: 3, name: 'Payment Protection', status: 'Locked' },
  { id: 4, name: 'Consolidation Hub', status: 'In Transit' },
  { id: 5, name: 'Air / Sea Freight', status: 'Active' },
  { id: 6, name: 'TRA Customs', status: 'Cleared' },
  { id: 7, name: 'Door-to-Door', status: 'Delivered' },
]

export function AnimatedGlobalTradeMap() {
  const [selectedNode, setSelectedNode] = useState<TradeNode | null>(TRADE_NODES[0])
  const [activeStepIndex, setActiveStepIndex] = useState(4)

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStepIndex((prev) => (prev % 7) + 1)
    }, 2800)
    return () => clearInterval(stepInterval)
  }, [])

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-slate-800 bg-[#070d19] text-white shadow-2xl">
      {/* Background Radial Glow centered on Tanzania HQ */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-[#1e293b]_1px,transparent_1px] [background-size:24px_24px] opacity-30 pointer-events-none" />

      {/* Top Interactive Metric & Currency Control Bar */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-1 text-xs font-extrabold text-blue-400">
            <Globe2 className="size-3.5 animate-spin-slow" />
            <span>LIVE GLOBAL TRADE NETWORK</span>
          </div>
          <span className="hidden sm:inline text-xs text-slate-400 font-medium">
            Cross-Border Procurement &amp; Freight Tracking Corridor
          </span>
        </div>

        {/* Currency & Buyer Protection Widgets */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-800/90 border border-slate-700 px-3 py-1 text-slate-200">
            <DollarSign className="size-3.5 text-emerald-400" />
            <span className="font-mono font-bold text-white tnum">1 USD = 2,735 TZS</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.2 rounded">
              Fixed Lock
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-slate-800/90 border border-amber-500/30 px-3 py-1 text-amber-400">
            <ShieldCheck className="size-3.5" />
            <span className="font-bold text-white text-[11px]">LUMO Pay Protection</span>
            <span className="text-[10px] text-amber-400 font-extrabold uppercase">✓ Confirmed</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Vector SVG Map Container */}
      <div className="relative w-full aspect-[2/1] min-h-[380px] sm:min-h-[480px] p-2 sm:p-4">
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradient for Air Routes */}
            <linearGradient id="airGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.4" />
            </linearGradient>
            {/* Gradient for Express Gold */}
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="1" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.5" />
            </linearGradient>
            {/* Glow Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Elegant World Grid Background Points (Subtle Vector Grid) */}
          <g opacity="0.12" fill="#94A3B8">
            <circle cx="200" cy="150" r="1.5" />
            <circle cx="240" cy="160" r="1.5" />
            <circle cx="280" cy="170" r="1.5" />
            <circle cx="480" cy="120" r="1.5" />
            <circle cx="520" cy="130" r="1.5" />
            <circle cx="560" cy="150" r="1.5" />
            <circle cx="600" cy="180" r="1.5" />
            <circle cx="650" cy="210" r="1.5" />
            <circle cx="720" cy="230" r="1.5" />
            <circle cx="820" cy="190" r="1.5" />
          </g>

          {/* Trade Bezier Arcs connecting Origins to Tanzania HQ */}
          {TRADE_ROUTES.map((route) => {
            const fromNode = TRADE_NODES.find((n) => n.id === route.fromId)
            const toNode = TRADE_NODES.find((n) => n.id === route.toId)
            if (!fromNode || !toNode) return null

            // Control Point for smooth curved Bezier arc
            const midX = (fromNode.x + toNode.x) / 2
            const midY = Math.min(fromNode.y, toNode.y) - 60
            const pathD = `M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}`

            const durSeconds = route.mode === 'Express' ? 3 : route.mode === 'Air' ? 4.5 : 7
            const delays = [0, durSeconds * 0.33, durSeconds * 0.66]

            return (
              <g key={route.id} className="group cursor-pointer">
                {/* Arc Background Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={route.color}
                  strokeWidth="1.75"
                  strokeOpacity="0.4"
                  strokeDasharray="4 4"
                />
                {/* Active Animated Traveling Particle */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={route.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  className="animate-pulse"
                >
                  <animate
                    attributeName="stroke-dasharray"
                    values="0 400; 100 300; 0 400"
                    dur={`${durSeconds}s`}
                    repeatCount="indefinite"
                  />
                </path>

                {/* Animated Moving Orbs/Balls along Route */}
                {delays.map((delay, idx) => (
                  <g key={`ball-${route.id}-${idx}`}>
                    <circle r="7" fill={route.color} opacity="0.6" filter="url(#glow)" />
                    <circle r="3.5" fill="#FFFFFF" stroke={route.color} strokeWidth="1.5" />
                    <animateMotion
                      path={pathD}
                      dur={`${durSeconds}s`}
                      begin={`${delay.toFixed(2)}s`}
                      repeatCount="indefinite"
                      rotate="auto"
                    />
                  </g>
                ))}
              </g>
            )
          })}

          {/* Supplier Nodes & Destination Points */}
          {TRADE_NODES.map((node) => {
            const isDestination = node.role === 'Destination'
            const isSelected = selectedNode?.id === node.id

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer group"
              >
                {/* Destination Radar Pulse Effect */}
                {isDestination && (
                  <>
                    <circle r="28" fill="#2563EB" opacity="0.15" className="animate-ping" />
                    <circle r="18" fill="none" stroke="#2563EB" strokeWidth="1.5" opacity="0.6" />
                  </>
                )}

                {/* Node Outer Ring */}
                <circle
                  r={isDestination ? 10 : 7}
                  fill={isDestination ? '#2563EB' : '#0F172A'}
                  stroke={isDestination ? '#60A5FA' : isSelected ? '#D4AF37' : '#3B82F6'}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all duration-300 group-hover:scale-125"
                />

                {/* Node Core */}
                <circle r={isDestination ? 4 : 3} fill={isDestination ? '#FFFFFF' : '#D4AF37'} />

                {/* Node Label Text - Clean Country Name without Windows flag ASCII prefix */}
                <text
                  x="0"
                  y={isDestination ? 24 : -14}
                  textAnchor="middle"
                  className={`text-[11px] font-extrabold fill-slate-100 pointer-events-none transition-opacity ${
                    isDestination ? 'fill-blue-400 font-black' : 'opacity-90 group-hover:opacity-100'
                  }`}
                >
                  {node.country}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Floating Live Shipment Activity Cards (3-5px hover float animation) */}
        <div className="absolute top-4 left-4 z-20 hidden md:flex flex-col gap-2.5 max-w-xs pointer-events-none">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/90 backdrop-blur p-3 shadow-xl animate-float">
            <div className="rounded-xl bg-blue-600/20 p-2 text-blue-400">
              <Package className="size-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Order #92841</span>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.2 rounded">
                  Air Freight
                </span>
              </div>
              <span className="text-[11px] text-slate-300">MacBook Parts · China → Dar</span>
              <span className="text-[10px] font-mono text-blue-400 mt-0.5">ETA: 5 Days</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/90 backdrop-blur p-3 shadow-xl animate-float-delayed">
            <div className="rounded-xl bg-teal-600/20 p-2 text-teal-400">
              <Ship className="size-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Container #TZ-8840</span>
                <span className="text-[9px] font-bold text-teal-400 bg-teal-400/10 px-1.5 py-0.2 rounded">
                  Sea Cargo
                </span>
              </div>
              <span className="text-[11px] text-slate-300">Dubai Dragon Mart Goods</span>
              <span className="text-[10px] font-mono text-emerald-400 mt-0.5">Customs Cleared</span>
            </div>
          </div>
        </div>

        {/* Selected Supplier / Node Inspector Panel (Bottom Right) */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 z-20 w-72 rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur p-3.5 shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedNode.flag}</span>
                <span className="text-xs font-extrabold text-white">{selectedNode.name}</span>
              </div>
              {selectedNode.verified && (
                <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                  ★ VERIFIED
                </span>
              )}
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Category</span>
                <span className="font-semibold text-slate-200 truncate block">{selectedNode.type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Transit Speed</span>
                <span className="font-semibold text-blue-400 truncate block">{selectedNode.transitTime}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Supplier Rating</span>
                <span className="font-semibold text-amber-400 block">{selectedNode.rating}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Product Catalog</span>
                <span className="font-semibold text-emerald-400 block">{selectedNode.products}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7-Stage Supply Chain Lifecycle Step Indicator */}
      <div className="relative z-10 border-t border-slate-800 bg-slate-950/90 px-4 py-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold text-slate-200">7-Stage Transparent Supply Chain Lifecycle</span>
            <span className="text-blue-400 font-mono">Stage {activeStepIndex} of 7 Active</span>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {TIMELINE_STEPS.map((step) => {
              const isActive = step.id <= activeStepIndex
              const isCurrent = step.id === activeStepIndex
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-600/20 text-white shadow-sm'
                      : isActive
                      ? 'border-slate-800 bg-slate-900 text-slate-300'
                      : 'border-slate-900 bg-slate-950 text-slate-600'
                  }`}
                >
                  <span className="text-[10px] font-bold truncate w-full">{step.name}</span>
                  <span className="text-[9px] font-mono text-emerald-400 mt-0.5 hidden sm:inline">
                    {step.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Live Operational Statistics Bar */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-3 border-t border-slate-800 bg-slate-900/90 px-6 py-4">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Verified Suppliers</span>
          <span className="text-lg font-extrabold text-white tnum tracking-tight">3,492</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Products Listed</span>
          <span className="text-lg font-extrabold text-blue-400 tnum tracking-tight">412,000+</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Global Trade Hubs</span>
          <span className="text-lg font-extrabold text-white tnum tracking-tight">24 Countries</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Active Air/Sea Shipments</span>
          <span className="text-lg font-extrabold text-emerald-400 tnum tracking-tight">186 Today</span>
        </div>
        <div className="flex flex-col col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 font-medium">Avg Door-to-Door</span>
          <span className="text-lg font-extrabold text-amber-400 tnum tracking-tight">7 Days Air</span>
        </div>
      </div>
    </div>
  )
}
