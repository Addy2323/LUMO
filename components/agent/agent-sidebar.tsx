'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Search,
  Building2,
  Truck,
  ShieldCheck,
  Package,
  Ship,
  MapPin,
  Warehouse,
  MessageSquare,
  BarChart3,
  Settings,
  Globe,
  Sparkles,
  ChevronDown,
  LogOut,
} from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAgentStore, AgentCountry } from '@/lib/stores/agent-store'
import { useSessionStore } from '@/lib/stores/session-store'

const COUNTRIES: { name: AgentCountry; flag: string; city: string }[] = [
  { name: 'China', flag: '🇨🇳', city: 'Shenzhen / Yiwu' },
  { name: 'Dubai', flag: '🇦🇪', city: 'Dragon Mart / JAFZA' },
  { name: 'Turkey', flag: '🇹🇷', city: 'Istanbul / Laleli' },
  { name: 'India', flag: '🇮🇳', city: 'Delhi / Mumbai' },
]

export function AgentSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const signOut = useSessionStore((s) => s.signOut)
  const { activeCountry, setActiveCountry, agentName, orders } = useAgentStore()
  const currentCountry = COUNTRIES.find((c) => c.name === activeCountry) || COUNTRIES[0]

  // Calculate dynamic badge counts for current active country hub
  const countryOrders = orders.filter((o) => o.assignedCountry === activeCountry)
  const newOrdersBadge = countryOrders.filter((o) => o.status === 'assigned' || o.status === 'new').length
  const collectionsBadge = countryOrders.filter((o) => o.status === 'purchased' || o.status === 'collection_pending').length
  const inspectionBadge = countryOrders.filter((o) => o.customerInspectionApproval === 'pending' && o.status === 'inspected').length
  const shipmentsBadge = countryOrders.filter((o) => o.status === 'shipped').length

  const navItems = [
    { label: 'Dashboard', href: '/agent', icon: LayoutDashboard },
    { label: 'Assigned Orders', href: '/agent/orders', icon: ClipboardList, badge: newOrdersBadge > 0 ? String(newOrdersBadge) : null },
    { label: 'Supplier Search', href: '/agent/suppliers', icon: Search },
    { label: 'Collections', href: '/agent/collections', icon: Truck, badge: collectionsBadge > 0 ? String(collectionsBadge) : null },
    { label: 'Quality Inspection', href: '/agent/inspection', icon: ShieldCheck, badge: inspectionBadge > 0 ? String(inspectionBadge) : null },
    { label: 'Packaging & Warehouse', href: '/agent/warehouse', icon: Warehouse },
    { label: 'Shipments & Tracking', href: '/agent/shipments', icon: Ship, badge: shipmentsBadge > 0 ? String(shipmentsBadge) : null },
    { label: 'Messages', href: '/agent/messages', icon: MessageSquare },
    { label: 'Reports', href: '/agent/reports', icon: BarChart3 },
    { label: 'Settings & Audit Log', href: '/agent/settings', icon: Settings },
  ]

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col justify-between shrink-0 min-h-screen">
      <div className="p-4 space-y-6">
        {/* Logo & Agent Tag */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <Link href="/agent">
            <Logo tone="onPrimary" />
          </Link>
          <Badge className="bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[10px] font-extrabold uppercase tracking-wide">
            FIELD OPS
          </Badge>
        </div>

        {/* Country Selector Dropdown */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            Active Country Hub
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  className="w-full justify-between h-11 bg-slate-800/80 border-slate-700 text-white hover:bg-slate-800 text-xs font-bold"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{currentCountry.flag}</span>
                    <span className="truncate">{currentCountry.name} Hub</span>
                  </span>
                  <ChevronDown className="size-4 text-slate-400 shrink-0" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-56 bg-slate-900 border-slate-800 text-white">
              {COUNTRIES.map((c) => (
                <DropdownMenuItem
                  key={c.name}
                  onClick={() => setActiveCountry(c.name)}
                  className="flex items-center justify-between py-2 text-xs font-bold focus:bg-slate-800 focus:text-white cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{c.flag}</span>
                    <span>{c.name} Hub</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{c.city}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 pt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <item.icon className={`size-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </span>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-brand-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Field Agent Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 truncate">
          <div className="size-8 rounded-full bg-brand-500/20 text-brand-400 font-extrabold flex items-center justify-center border border-brand-500/30 shrink-0">
            {currentCountry.flag}
          </div>
          <div className="flex flex-col truncate">
            <span className="font-bold text-white truncate">{agentName}</span>
            <span className="text-[10px] text-slate-400 font-mono">GPS Verified</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            signOut()
            router.push('/login')
          }}
          title="Sign out of Agent Console"
          className="size-8 text-slate-400 hover:text-rose-400 hover:bg-slate-800 shrink-0"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  )
}
