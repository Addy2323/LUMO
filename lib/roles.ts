export const ROLES = ['customer', 'supplier', 'sales', 'logistics', 'agent', 'admin'] as const

export type Role = (typeof ROLES)[number]

export type RoleConfig = {
  id: Role
  label: string
  description: string
  /** Landing route after a successful login for this role. */
  home: string
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  customer: {
    id: 'customer',
    label: 'Customer',
    description: 'Shop, track orders and talk to the sales department.',
    home: '/account',
  },
  supplier: {
    id: 'supplier',
    label: 'Supplier',
    description: 'Manage catalogue, variants, orders and settlements.',
    home: '/supplier',
  },
  sales: {
    id: 'sales',
    label: 'Sales Department',
    description: 'Shared inbox, sourcing requests and dispute mediation.',
    home: '/sales',
  },
  logistics: {
    id: 'logistics',
    label: 'Logistics Company',
    description: 'Shipments, routes, fleet and proof of delivery.',
    home: '/logistics',
  },
  agent: {
    id: 'agent',
    label: 'Sourcing Agent',
    description: 'Field operations in China, Dubai, Turkey & India for sourcing & inspection.',
    home: '/agent',
  },
  admin: {
    id: 'admin',
    label: 'Administrator',
    description: 'Platform oversight, users, payments and settings.',
    home: '/admin',
  },
}

export const ROLE_LIST: RoleConfig[] = ROLES.map((role) => ROLE_CONFIG[role])

export function normalizeRole(role?: string | null): Role {
  if (!role) return 'customer'
  const lower = role.toLowerCase()
  if (lower === 'buyer') return 'customer'
  if (lower in ROLE_CONFIG) return lower as Role
  return 'customer'
}

export function getRoleConfig(role?: string | null): RoleConfig {
  const norm = normalizeRole(role)
  return ROLE_CONFIG[norm] ?? ROLE_CONFIG.customer
}

export function roleHome(role?: string | null): string {
  return getRoleConfig(role).home
}
