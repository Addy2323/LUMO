import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  Blocks,
  Boxes,
  Building2,
  Clock,
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  Gift,
  Heart,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  MessageSquare,
  Package,
  PackageSearch,
  Route,
  Scale,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  UploadCloud,
  Users,
  Warehouse,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { normalizeRole, type Role } from '@/lib/roles'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  /** Small count pill on the right of the row (mock figures for now). */
  badge?: string
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

/**
 * One navigation tree per role. Every dashboard uses the same sidebar + topbar
 * shell so the product feels like one system regardless of who signs in.
 */
export const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  customer: [
    {
      label: 'Shopping',
      items: [
        { label: 'Overview', href: '/account', icon: LayoutDashboard },
        { label: 'Marketplace', href: '/marketplace', icon: Store },
        { label: 'Cart', href: '/cart', icon: ShoppingCart },
        { label: 'Wishlist', href: '/account/wishlist', icon: Heart },
      ],
    },
    {
      label: 'Orders',
      items: [
        { label: 'My orders', href: '/account/orders', icon: ShoppingBag },
        { label: 'Sourcing requests', href: '/account/sourcing', icon: PackageSearch },
        { label: 'Returns & refunds', href: '/account/returns', icon: Package },
        { label: 'Invoices', href: '/account/invoices', icon: FileText },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'Support', href: '/account/support', icon: LifeBuoy },
        { label: 'Addresses', href: '/account/addresses', icon: MapPin },
        { label: 'Payment methods', href: '/account/payment-methods', icon: CreditCard },
        { label: 'Referrals', href: '/account/referrals', icon: Gift },
        { label: 'Security', href: '/account/security', icon: ShieldCheck },
      ],
    },
  ],

  supplier: [
    {
      label: 'Business',
      items: [
        { label: 'Overview', href: '/supplier', icon: Gauge },
        { label: 'Orders', href: '/supplier/orders', icon: ClipboardList },
        { label: 'Shipments', href: '/supplier/shipments', icon: Truck },
      ],
    },
    {
      label: 'Catalogue',
      items: [
        { label: 'Products', href: '/supplier/products', icon: Boxes },
        { label: 'Add product', href: '/supplier/products/new', icon: Sparkles },
        { label: 'Bulk import', href: '/supplier/products/import', icon: Blocks },
        { label: 'Inventory', href: '/supplier/inventory', icon: Warehouse },
      ],
    },
    {
      label: 'Company',
      items: [
        { label: 'Profile & KYC', href: '/supplier/company', icon: Building2 },
        { label: 'Reports', href: '/supplier/reports', icon: BarChart3 },
        { label: 'Settlements', href: '/supplier/settlements', icon: Banknote },
      ],
    },
  ],

  sales: [
    {
      label: 'Sales Operations',
      items: [
        { label: 'Overview', href: '/sales', icon: Gauge },
        { label: 'Shared Inbox', href: '/sales/inbox', icon: Inbox },
        { label: 'My Assigned Orders', href: '/sales/orders', icon: ClipboardList },
        { label: 'Sales Pipeline', href: '/sales/pipeline', icon: Activity },
        { label: 'Sourcing Requests', href: '/sales/sourcing', icon: PackageSearch },
        { label: 'Quotations', href: '/sales/quotations', icon: FileText },
        { label: 'Customer Follow-ups', href: '/sales/follow-ups', icon: Clock },
        { label: 'Tasks & Calendar', href: '/sales/tasks', icon: Sparkles },
      ],
    },
    {
      label: 'Customer Service',
      items: [
        { label: 'Customer 360°', href: '/sales/customers', icon: Users },
        { label: 'Support Tickets', href: '/sales/tickets', icon: LifeBuoy },
        { label: 'Complaints', href: '/sales/complaints', icon: AlertTriangle },
        { label: 'Returns & Refunds', href: '/sales/returns', icon: Package },
        { label: 'Disputes', href: '/sales/disputes', icon: Scale },
        { label: 'Escalations', href: '/sales/escalations', icon: ShieldCheck },
      ],
    },
    {
      label: 'Coordination',
      items: [
        { label: 'Sourcing Agents', href: '/sales/agents', icon: Building2 },
        { label: 'Supplier Liaison', href: '/sales/suppliers', icon: Store },
        { label: 'Logistics Coordination', href: '/sales/logistics', icon: Truck },
        { label: 'Payment Issues', href: '/sales/payments', icon: CreditCard },
        { label: 'Internal Messages', href: '/sales/messages', icon: MessageSquare },
      ],
    },
    {
      label: 'Knowledge & Performance',
      items: [
        { label: 'Canned Responses', href: '/sales/templates', icon: MessageSquare },
        { label: 'Knowledge Base', href: '/sales/knowledge', icon: ScrollText },
        { label: 'Customer History', href: '/sales/history', icon: ScrollText },
        { label: 'Team Workload', href: '/sales/workload', icon: Users },
        { label: 'SLA Performance', href: '/sales/sla', icon: BarChart3 },
        { label: 'Sales Reports', href: '/sales/reports', icon: BarChart3 },
        { label: 'My Performance', href: '/sales/performance', icon: BarChart3 },
      ],
    },
  ],

  logistics: [
    {
      label: 'Operations',
      items: [
        { label: 'Overview', href: '/logistics', icon: Gauge },
        { label: 'Shipments', href: '/logistics/shipments', icon: Truck },
        { label: 'Route planning', href: '/logistics/routes', icon: Route },
        { label: 'Proof of delivery', href: '/logistics/proof-of-delivery', icon: BadgeCheck },
      ],
    },
    {
      label: 'Resources',
      items: [
        { label: 'Fleet & drivers', href: '/logistics/fleet', icon: Users },
        { label: 'Rates & zones', href: '/logistics/rates', icon: MapPin },
      ],
    },
  ],

  agent: [
    {
      label: 'Agent Portal',
      items: [
        { label: 'Overview', href: '/agent', icon: Gauge },
        { label: 'Sourcing Orders', href: '/agent/orders', icon: PackageSearch },
        { label: 'Shipments', href: '/agent/shipments', icon: Truck },
        { label: 'Commissions & Reports', href: '/agent/reports', icon: BarChart3 },
      ],
    },
  ],
  admin: [
    {
      label: 'Operations',
      items: [
        { label: 'Overview', href: '/admin', icon: Gauge },
        { label: 'Order Control', href: '/admin/orders', icon: ClipboardList },
        { label: 'Assignment Board', href: '/admin/assignment-board', icon: Boxes },
        { label: 'Sourcing & RFQs', href: '/admin/sourcing', icon: PackageSearch },
        { label: 'Inspections', href: '/admin/inspections', icon: ShieldCheck },
        { label: 'Shipments', href: '/admin/shipments', icon: Truck },
      ],
    },
    {
      label: 'Commerce',
      items: [
        { label: 'Products', href: '/admin/products', icon: Boxes },
        { label: 'Catalog Approval', href: '/admin/catalog', icon: UploadCloud },
        { label: 'Suppliers', href: '/admin/suppliers', icon: Building2 },
        { label: 'Payments', href: '/admin/payments', icon: CreditCard },
        { label: 'Settlements', href: '/admin/settlements', icon: Banknote },
        { label: 'Refunds & Disputes', href: '/admin/disputes', icon: Scale },
      ],
    },
    {
      label: 'Communication',
      items: [
        { label: 'Messaging', href: '/admin/messaging', icon: MessageSquare },
        { label: 'SMS Campaigns', href: '/admin/sms', icon: Inbox },
        { label: 'Support Tickets', href: '/admin/tickets', icon: LifeBuoy },
        { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      ],
    },
    {
      label: 'Governance',
      items: [
        { label: 'Users & Roles', href: '/admin/users', icon: Users },
        { label: 'Partner KYC', href: '/admin/kyc', icon: BadgeCheck },
        { label: 'Risk & Security', href: '/admin/risk', icon: ShieldCheck },
        { label: 'Audit Logs', href: '/admin/audit', icon: Activity },
        { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
        { label: 'Settings', href: '/admin/settings', icon: Settings },
      ],
    },
  ],

}

export function navForRole(role?: string | null): NavGroup[] {
  const norm = normalizeRole(role)
  return NAV_BY_ROLE[norm] ?? NAV_BY_ROLE.customer
}

/**
 * Resolves the deepest matching nav item for a pathname so the sidebar can
 * highlight the correct row on nested routes.
 */
export function activeHref(groups: NavGroup[], pathname: string): string | null {
  const all = groups.flatMap((group) => group.items)
  const exact = all.find((item) => item.href === pathname)
  if (exact) return exact.href

  const nested = all
    .filter((item) => pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)

  return nested[0]?.href ?? null
}
