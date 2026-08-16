/** Order fixtures shared by the customer, supplier, logistics and admin views. */

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export type PaymentStatus = 'payment_pending' | 'paid' | 'payment_failed' | 'refunded'

export type PaymentMethodId =
  | 'mpesa'
  | 'mixxbyyas'
  | 'halopesa'
  | 'airtel'
  | 'card'
  | 'bank_crdb'
  | 'bank_nmb'

export type OrderItem = {
  productId: string
  slug: string
  title: string
  variantLabel: string
  sku: string
  image: string
  unitPrice: number
  quantity: number
}

export type Address = {
  id: string
  label: string
  recipient: string
  phone: string
  street: string
  ward: string
  district: string
  region: string
  isDefault: boolean
}

export type TimelineEvent = {
  status: OrderStatus
  label: string
  at: string | null
  note?: string
}

export type CargoMetrics = {
  weightKg: number
  volumeCbm: number
  portOfLoading: string
  portOfDischarge: string
  customsCode: string
}

export type DisputeInfo = {
  id: string
  status: 'open' | 'resolved' | 'rejected'
  reason: string
  refundAmount?: number
  notes?: string
  createdAt: string
}

export type Order = {
  id: string
  reference: string
  placedAt: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethodId
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  tax: number
  total: number
  customer: { id: string; name: string; phone: string; email: string }
  supplier: { id: string; name: string }
  logistics: { id: string; name: string } | null
  trackingNumber: string | null
  shippingAddress: Address
  shippingMethod: string
  timeline: TimelineEvent[]
  tags?: string[]
  dispute?: DisputeInfo | null
  cargoMetrics?: CargoMetrics | null
}

export const ADDRESSES: Address[] = [
  {
    id: 'adr_001',
    label: 'Home',
    recipient: 'Amina Hassan',
    phone: '+255 712 445 908',
    street: 'Plot 47, Mtaa wa Bahari, Off Haile Selassie Rd',
    ward: 'Msasani',
    district: 'Kinondoni',
    region: 'Dar es Salaam',
    isDefault: true,
  },
  {
    id: 'adr_002',
    label: 'Office',
    recipient: 'Amina Hassan',
    phone: '+255 712 445 908',
    street: '3rd Floor, Golden Jubilee Towers, Ohio St',
    ward: 'Kivukoni',
    district: 'Ilala',
    region: 'Dar es Salaam',
    isDefault: false,
  },
]

const ADDRESSES_STORAGE_KEY = 'lumo_user_addresses'

export function getStoredAddresses(): Address[] {
  if (typeof window === 'undefined') return ADDRESSES
  try {
    const raw = localStorage.getItem(ADDRESSES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.error('Failed to read lumo_user_addresses:', e)
  }
  return ADDRESSES
}

export function saveAddresses(addresses: Address[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(addresses))
    window.dispatchEvent(new Event('lumo_addresses_updated'))
  } catch (e) {
    console.error('Failed to save lumo_user_addresses:', e)
  }
}

export function getAddressesForUser(user?: { id?: string; fullName?: string; name?: string; phone?: string; email?: string } | null): Address[] {
  const stored = getStoredAddresses()
  if (!user) return stored

  const userName = user.fullName || user.name || ''
  const userPhone = user.phone || ''

  // If user has custom saved addresses, return them
  const customUserAddresses = stored.filter((a) => !['adr_001', 'adr_002'].includes(a.id))
  if (customUserAddresses.length > 0) {
    return stored
  }

  // If new user logged in, dynamically tailor the default address to their profile
  if (userName && userName !== 'Amina Hassan') {
    const userDefaultAddr: Address = {
      id: `adr_${user.id || 'custom'}_1`,
      label: 'Home (Primary)',
      recipient: userName,
      phone: userPhone || '+255 700 000 000',
      street: 'Main Road, Block B',
      ward: 'Msasani',
      district: 'Kinondoni',
      region: 'Dar es Salaam',
      isDefault: true,
    }
    return [userDefaultAddr, ...stored]
  }

  return stored
}

export function addCustomAddress(newAddr: Omit<Address, 'id'>): Address {
  const existing = getStoredAddresses()
  const created: Address = {
    ...newAddr,
    id: `adr_${Date.now()}`,
  }
  
  // If set as default, update existing
  let updatedList = existing
  if (created.isDefault) {
    updatedList = existing.map((a) => ({ ...a, isDefault: false }))
  }
  
  updatedList = [created, ...updatedList]
  saveAddresses(updatedList)
  return created
}

function timeline(reached: OrderStatus[], placedAt: string): TimelineEvent[] {
  const steps: { status: OrderStatus; label: string }[] = [
    { status: 'pending', label: 'Order placed' },
    { status: 'paid', label: 'Payment confirmed' },
    { status: 'processing', label: 'Preparing for dispatch' },
    { status: 'shipped', label: 'Shipped' },
    { status: 'delivered', label: 'Delivered' },
  ]

  const base = new Date(placedAt).getTime()
  return steps.map((step, index) => ({
    status: step.status,
    label: step.label,
    at: reached.includes(step.status)
      ? new Date(base + index * 22 * 60 * 60 * 1000).toISOString()
      : null,
  }))
}

export const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ord_sample_01',
    reference: 'ORD-LUMO-9901',
    placedAt: '2026-08-07T14:30:00.000Z',
    status: 'processing',
    paymentStatus: 'paid',
    paymentMethod: 'mpesa',
    items: [
      {
        productId: 'prod_01',
        slug: 'inverter-5kw',
        title: '5kW Hybrid Solar Inverter 48V Pure Sine Wave',
        variantLabel: '5kW / 48V Single Phase',
        sku: 'INV-5KW-48V',
        image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
        unitPrice: 2250000,
        quantity: 1,
      },
    ],
    subtotal: 2250000,
    shippingFee: 18000,
    tax: 0,
    total: 2268000,
    customer: {
      id: 'cust_01',
      name: 'Amina Hassan',
      phone: '+255 712 445 908',
      email: 'amina.hassan@example.co.tz',
    },
    supplier: {
      id: 'sup_china_01',
      name: 'Shenzhen Solar Direct Factory',
    },
    logistics: {
      id: 'log_01',
      name: 'Kariakoo Express Freight',
    },
    trackingNumber: 'LUMO-TZ-884920',
    shippingAddress: ADDRESSES[0],
    shippingMethod: 'Express Air Freight Courier',
    timeline: timeline(['pending', 'paid', 'processing'], '2026-08-07T14:30:00.000Z'),
    tags: ['VIP Buyer', 'High Value', 'Air Freight'],
    cargoMetrics: {
      weightKg: 28.5,
      volumeCbm: 0.18,
      portOfLoading: 'Baoan Intl Airport (SZX), Shenzhen',
      portOfDischarge: 'Julius Nyerere Intl Airport (DAR)',
      customsCode: 'HS-8504.40.90',
    },
  },
  {
    id: 'ord_sample_02',
    reference: 'ORD-LUMO-9902',
    placedAt: '2026-08-06T11:15:00.000Z',
    status: 'shipped',
    paymentStatus: 'paid',
    paymentMethod: 'mixxbyyas',
    items: [
      {
        productId: 'prod_02',
        slug: 'heavy-duty-water-pump',
        title: 'High-Efficiency Agricultural Water Pump 3HP',
        variantLabel: '3HP Heavy Duty Diesel Engine',
        sku: 'PMP-3HP-DSL',
        image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
        unitPrice: 850000,
        quantity: 2,
      },
    ],
    subtotal: 1700000,
    shippingFee: 35000,
    tax: 0,
    total: 1735000,
    customer: {
      id: 'cust_02',
      name: 'Juma Rashid',
      phone: '+255 784 112 334',
      email: 'juma.rashid@kilimobora.co.tz',
    },
    supplier: {
      id: 'sup_dubai_02',
      name: 'Gulf Machinery Trading LLC',
    },
    logistics: {
      id: 'log_02',
      name: 'Baraka Sea Freight Lines',
    },
    trackingNumber: 'LUMO-SEA-55193',
    shippingAddress: {
      id: 'adr_003',
      label: 'Farm Store',
      recipient: 'Juma Rashid',
      phone: '+255 784 112 334',
      street: 'Plot 12, Kilimo Zone, Morogoro Road',
      ward: 'Mlandizi',
      district: 'Kaha',
      region: 'Pwani',
      isDefault: true,
    },
    shippingMethod: 'Consolidated Sea Cargo',
    timeline: timeline(['pending', 'paid', 'processing', 'shipped'], '2026-08-06T11:15:00.000Z'),
    tags: ['Agricultural', 'Sea Freight'],
    cargoMetrics: {
      weightKg: 145.0,
      volumeCbm: 1.25,
      portOfLoading: 'Jebel Ali Port, Dubai (DXB)',
      portOfDischarge: 'Dar es Salaam Port (DAR-PORT)',
      customsCode: 'HS-8413.70.20',
    },
  },
  {
    id: 'ord_sample_03',
    reference: 'ORD-LUMO-9903',
    placedAt: '2026-08-05T09:45:00.000Z',
    status: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'bank_crdb',
    items: [
      {
        productId: 'prod_03',
        slug: 'commercial-coffee-roaster',
        title: '15kg Commercial Gas Coffee Roaster Machine',
        variantLabel: '15kg Capacity / LPG Powered',
        sku: 'RST-15KG-LPG',
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
        unitPrice: 14500000,
        quantity: 1,
      },
    ],
    subtotal: 14500000,
    shippingFee: 250000,
    tax: 0,
    total: 14750000,
    customer: {
      id: 'cust_03',
      name: 'Sarah Mwangi',
      phone: '+255 754 998 877',
      email: 'sarah@kilimanjaro-roasters.co.tz',
    },
    supplier: {
      id: 'sup_tr_01',
      name: 'Istanbul Roaster Tech Ltd',
    },
    logistics: {
      id: 'log_01',
      name: 'Kariakoo Express Freight',
    },
    trackingNumber: 'LUMO-TZ-992104',
    shippingAddress: {
      id: 'adr_004',
      label: 'Roastery HQ',
      recipient: 'Sarah Mwangi',
      phone: '+255 754 998 877',
      street: 'Sokoine Road, Opposite Clock Tower',
      ward: 'Kijenge',
      district: 'Arusha Urban',
      region: 'Arusha',
      isDefault: true,
    },
    shippingMethod: 'Express Air Freight Courier',
    timeline: timeline(['pending', 'paid', 'processing', 'shipped', 'delivered'], '2026-08-05T09:45:00.000Z'),
    tags: ['High Value', 'VIP Buyer', 'Priority Delivery'],
    cargoMetrics: {
      weightKg: 380.0,
      volumeCbm: 2.85,
      portOfLoading: 'Istanbul Ambarli Port (TR)',
      portOfDischarge: 'Julius Nyerere Intl Airport (DAR)',
      customsCode: 'HS-8419.81.00',
    },
  },
  {
    id: 'ord_sample_04',
    reference: 'ORD-LUMO-9904',
    placedAt: '2026-08-08T01:20:00.000Z',
    status: 'pending',
    paymentStatus: 'payment_pending',
    paymentMethod: 'halopesa',
    items: [
      {
        productId: 'prod_04',
        slug: 'industrial-led-bay-lights',
        title: '200W Industrial High-Bay LED Shop Lights (Pack of 5)',
        variantLabel: '200W / 6500K Cool White',
        sku: 'LED-HB-200W-5PK',
        image: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=600&auto=format&fit=crop&q=80',
        unitPrice: 650000,
        quantity: 3,
      },
    ],
    subtotal: 1950000,
    shippingFee: 25000,
    tax: 0,
    total: 1975000,
    customer: {
      id: 'cust_04',
      name: 'Baraka Logistics Hub',
      phone: '+255 688 334 221',
      email: 'procurement@barakahub.co.tz',
    },
    supplier: {
      id: 'sup_china_01',
      name: 'Shenzhen Solar Direct Factory',
    },
    logistics: null,
    trackingNumber: null,
    shippingAddress: ADDRESSES[1],
    shippingMethod: 'Standard Doorstep Courier',
    timeline: timeline(['pending'], '2026-08-08T01:20:00.000Z'),
    tags: ['Unassigned Freight', 'Needs Review'],
    dispute: {
      id: 'disp_001',
      status: 'open',
      reason: 'Awaiting payment verification before freight booking',
      createdAt: '2026-08-08T02:00:00.000Z',
    },
  },
  {
    id: 'ord_sample_05',
    reference: 'ORD-LUMO-9905',
    placedAt: '2026-08-04T16:50:00.000Z',
    status: 'cancelled',
    paymentStatus: 'refunded',
    paymentMethod: 'card',
    items: [
      {
        productId: 'prod_05',
        slug: 'cnc-laser-cutter',
        title: 'Desktop Fiber Laser Marking & Engraving System 30W',
        variantLabel: '30W Raycus Fiber Laser',
        sku: 'CNC-FL-30W',
        image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80',
        unitPrice: 5800000,
        quantity: 1,
      },
    ],
    subtotal: 5800000,
    shippingFee: 120000,
    tax: 0,
    total: 5920000,
    customer: {
      id: 'cust_05',
      name: 'David Mollel',
      phone: '+255 767 443 112',
      email: 'd.mollel@techspace.tz',
    },
    supplier: {
      id: 'sup_china_01',
      name: 'Shenzhen Solar Direct Factory',
    },
    logistics: null,
    trackingNumber: null,
    shippingAddress: ADDRESSES[0],
    shippingMethod: 'Consolidated Sea Cargo',
    timeline: timeline(['pending', 'paid'], '2026-08-04T16:50:00.000Z'),
    tags: ['Disputed / Refunded', 'High Value'],
    dispute: {
      id: 'disp_002',
      status: 'resolved',
      reason: 'Customer requested order cancellation due to project scope change.',
      refundAmount: 5920000,
      notes: 'Full refund issued back to Visa card. Transaction #REF-CARD-99201.',
      createdAt: '2026-08-04T18:00:00.000Z',
    },
  },
]

const ORDERS_STORAGE_KEY = 'lumo_customer_orders'

export function getStoredOrders(): Order[] {
  if (typeof window === 'undefined') return DEFAULT_ORDERS
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {
    console.error('Failed to read lumo_customer_orders:', e)
  }
  return []
}

export function getOrdersForUser(user: { id?: string; email?: string; fullName?: string } | null): Order[] {
  const allOrders = getStoredOrders()
  if (!user || allOrders.length === 0) return []

  const userEmail = user.email?.toLowerCase().trim()
  const userName = user.fullName?.toLowerCase().trim()
  const userId = user.id

  // Filter strictly for orders matching current customer
  return allOrders.filter((order) => {
    const custEmail = order.customer?.email?.toLowerCase().trim()
    const custName = order.customer?.name?.toLowerCase().trim()
    const custId = order.customer?.id

    return (
      (Boolean(userId) && custId === userId) ||
      (Boolean(userEmail) && custEmail === userEmail) ||
      (Boolean(userName) && custName === userName)
    )
  })
}

export function saveOrders(orders: Order[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
    ORDERS.length = 0
    ORDERS.push(...orders)
    window.dispatchEvent(new Event('lumo_orders_updated'))
  } catch (e) {
    console.error('Failed to save lumo_customer_orders:', e)
  }
}

export function addCustomerOrder(
  newOrderData: Partial<Order>,
  user?: { id?: string; email?: string; fullName?: string; phone?: string } | null,
): Order {
  const existing = getStoredOrders()
  const now = new Date().toISOString()
  const refNum = Math.floor(100000 + Math.random() * 900000)
  const id = newOrderData.id || `ord_${Date.now()}`
  const reference = newOrderData.reference || `ORD-LUMO-${refNum}`

  const fullOrder: Order = {
    id,
    reference,
    placedAt: now,
    status: newOrderData.status || 'paid',
    paymentStatus: newOrderData.paymentStatus || 'paid',
    paymentMethod: newOrderData.paymentMethod || 'mpesa',
    items: newOrderData.items || [],
    subtotal: newOrderData.subtotal || 0,
    shippingFee: newOrderData.shippingFee || 0,
    tax: newOrderData.tax || 0,
    total: newOrderData.total || 0,
    customer: newOrderData.customer || {
      id: user?.id || 'cust_new',
      name: user?.fullName || newOrderData.shippingAddress?.recipient || 'Customer',
      phone: user?.phone || newOrderData.shippingAddress?.phone || '+255 700 000 000',
      email: user?.email || 'user@example.co.tz',
    },
    supplier: newOrderData.supplier || {
      id: 'sup_china_01',
      name: 'LUMO Direct Factory Network',
    },
    logistics: newOrderData.logistics || {
      id: 'log_01',
      name: 'Baraka Air & Sea Cargo',
    },
    trackingNumber: newOrderData.trackingNumber || `LUMO-TZ-${refNum}`,
    shippingAddress: newOrderData.shippingAddress || ADDRESSES[0],
    shippingMethod: newOrderData.shippingMethod || 'Standard Doorstep Courier',
    timeline: timeline(['pending', 'paid'], now),
  }

  const updated = [fullOrder, ...existing]
  saveOrders(updated)
  return fullOrder
}

export function updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string): void {
  const existing = getStoredOrders()
  const updated = existing.map((o) => {
    if (o.id === orderId || o.reference === orderId) {
      const now = new Date().toISOString()
      const timelineReached: OrderStatus[] = ['pending', 'paid']
      if (newStatus === 'processing') timelineReached.push('processing')
      if (newStatus === 'shipped') timelineReached.push('processing', 'shipped')
      if (newStatus === 'delivered') timelineReached.push('processing', 'shipped', 'delivered')

      const updatedTimeline = timeline(timelineReached, o.placedAt)
      if (note) {
        const targetStep = updatedTimeline.find((t) => t.status === newStatus)
        if (targetStep) targetStep.note = note
      }

      return {
        ...o,
        status: newStatus,
        timeline: updatedTimeline,
      }
    }
    return o
  })
  saveOrders(updated)
}

export const ORDERS: Order[] = []

export const ORDER_STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
]
