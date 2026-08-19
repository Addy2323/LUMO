'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Command,
  Store,
  FileText,
  ShoppingBag,
  Truck,
  Users,
  ShieldCheck,
  Headphones,
  Settings,
  Sparkles,
  Package,
  PlusCircle,
  CreditCard,
  Building2,
  ArrowRight,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type CommandItem = {
  id: string
  title: string
  subtitle?: string
  category: 'Navigation' | 'Actions' | 'Portals' | 'Sourcing'
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const COMMAND_ITEMS: CommandItem[] = [
  // Portals
  {
    id: 'cmd_1',
    title: 'Marketplace Storefront',
    subtitle: 'Browse factory direct wholesale products',
    category: 'Portals',
    href: '/marketplace',
    icon: Store,
  },
  {
    id: 'cmd_2',
    title: 'Supplier Portal Dashboard',
    subtitle: 'Manage products, stock matrix & payouts',
    category: 'Portals',
    href: '/supplier',
    icon: Building2,
  },
  {
    id: 'cmd_3',
    title: 'Sales Department Service Desk',
    subtitle: 'Manage customer RFQs & canned replies',
    category: 'Portals',
    href: '/sales',
    icon: Headphones,
  },
  {
    id: 'cmd_4',
    title: 'Logistics Operations Control',
    subtitle: 'Dispatch manifests, e-POD & fleet',
    category: 'Portals',
    href: '/logistics',
    icon: Truck,
  },
  {
    id: 'cmd_5',
    title: 'Admin Governance Suite',
    subtitle: 'Master orders, escrow & system config',
    category: 'Portals',
    href: '/admin',
    icon: ShieldCheck,
  },

  // Sourcing & Quick Actions
  {
    id: 'cmd_6',
    title: 'Paste Product Link Sourcing',
    subtitle: 'Generate instant 1688 / Taobao / Alibaba quote',
    category: 'Sourcing',
    href: '/sourcing/paste-link',
    icon: Sparkles,
  },
  {
    id: 'cmd_7',
    title: 'Add New Product (Supplier)',
    subtitle: 'Upload images & list item in catalog',
    category: 'Actions',
    href: '/supplier/products/new',
    icon: PlusCircle,
  },
  {
    id: 'cmd_8',
    title: 'Track Air/Sea Freight',
    subtitle: 'Real-time container & parcel tracker',
    category: 'Navigation',
    href: '/track-freight',
    icon: Package,
  },

  // Customer Account
  {
    id: 'cmd_9',
    title: 'Tax Invoices & Receipts',
    subtitle: 'TRA EFD invoices & VAT breakdown',
    category: 'Navigation',
    href: '/account/invoices',
    icon: FileText,
  },
  {
    id: 'cmd_10',
    title: 'Payment Methods & Wallets',
    subtitle: 'M-Pesa, Mix by Yas, Airtel & Cards',
    category: 'Navigation',
    href: '/account/payment-methods',
    icon: CreditCard,
  },
]

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  // Keyboard shortcut listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filteredItems = COMMAND_ITEMS.filter((item) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    )
  })

  function handleSelect(href: string) {
    setIsOpen(false)
    setQuery('')
    router.push(href)
  }

  return (
    <>
      {/* Top Bar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs text-muted-foreground transition-all shadow-xs group"
        title="Search platform (Cmd+K)"
      >
        <Search className="size-3.5 text-muted-foreground group-hover:text-brand-500 transition-colors shrink-0" />
        <span className="font-medium hidden sm:inline">Search...</span>
        <kbd className="font-mono text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded border border-border text-foreground ml-1.5 hidden md:inline-block">
          ⌘K
        </kbd>
      </button>

      {/* Global Command Palette Modal */}
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card">
            {/* Search Header */}
            <div className="p-4 border-b flex items-center gap-3 bg-muted/30">
              <Search className="size-5 text-brand-500 shrink-0" />
              <Input
                placeholder="Type a command or search platform (e.g. 'Supplier', 'Freight', 'Invoice')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium text-foreground placeholder:text-muted-foreground"
              />
              <Badge variant="outline" className="text-[10px] font-mono font-bold shrink-0">
                ESC to close
              </Badge>
            </div>

            {/* Results Roster */}
            <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-border/50">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No matching commands found for <strong className="text-foreground">"{query}"</strong>
                </div>
              ) : (
                ['Portals', 'Sourcing', 'Actions', 'Navigation'].map((category) => {
                  const catItems = filteredItems.filter((i) => i.category === category)
                  if (catItems.length === 0) return null

                  return (
                    <div key={category} className="py-2 first:pt-0 last:pb-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1.5 block">
                        {category}
                      </span>

                      <div className="space-y-1">
                        {catItems.map((item) => {
                          const IconComp = item.icon
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelect(item.href)}
                              className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-500/10 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-muted text-muted-foreground group-hover:bg-brand-500 group-hover:text-white flex items-center justify-center transition-colors">
                                  <IconComp className="size-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-foreground group-hover:text-brand-500 transition-colors">
                                    {item.title}
                                  </h4>
                                  {item.subtitle && (
                                    <p className="text-[11px] text-muted-foreground">{item.subtitle}</p>
                                  )}
                                </div>
                              </div>

                              <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-muted/40 border-t flex items-center justify-between text-[11px] text-muted-foreground px-4 font-mono">
              <span>LUMO Enterprise Platform</span>
              <span className="flex items-center gap-2">
                <span className="font-bold text-foreground">↵ Select</span>
                <span>·</span>
                <span className="font-bold text-foreground">↑↓ Navigate</span>
              </span>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
