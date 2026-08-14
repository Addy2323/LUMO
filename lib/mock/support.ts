/**
 * Support fixtures. Customers only ever talk to the Sales Department — there is
 * no customer-to-supplier channel anywhere in this data model. Staff-to-supplier
 * messages live on `internalNotes`, which is never rendered to a customer.
 */

export type TicketStatus = 'open' | 'assigned' | 'escalated' | 'resolved'

export type TicketAuthorRole = 'customer' | 'sales' | 'supplier' | 'system'

export type TicketMessage = {
  id: string
  authorRole: TicketAuthorRole
  authorName: string
  body: string
  sentAt: string
}

export type SupportTicket = {
  id: string
  reference: string
  subject: string
  status: TicketStatus
  priority: 'low' | 'normal' | 'high'
  category: 'Order issue' | 'Delivery' | 'Refund' | 'Product question' | 'Account'
  customer: { id: string; name: string; email: string; phone: string }
  orderReference: string | null
  assignedTo: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
  unreadForCustomer: number
  messages: TicketMessage[]
  /** Sales ↔ supplier liaison thread. Internal only. */
  internalNotes: TicketMessage[]
}

export const TICKETS: SupportTicket[] = []

export type SourcingRequest = {
  id: string
  reference: string
  customerName: string
  productDescription: string
  quantity: number
  targetBudget: number
  region: string
  status: 'open' | 'assigned' | 'resolved'
  assignedAgent?: string
  createdAt: string
}

export const SOURCING_REQUESTS: SourcingRequest[] = []

export type CannedResponse = {
  id: string
  title: string
  category: string
  body: string
  usageCount: number
  updatedAt: string
}

export const CANNED_RESPONSES: CannedResponse[] = [
  {
    id: 'cr_001',
    title: 'Delivery delay — courier backlog',
    category: 'Delivery',
    body: 'Thank you for your patience. Your parcel is with our courier partner and is running behind the original estimate. The new expected delivery window is {{window}}. You will receive an SMS as soon as it is out for delivery.',
    usageCount: 0,
    updatedAt: '2026-07-18T09:00:00Z',
  },
  {
    id: 'cr_002',
    title: 'Refund timeline — mobile money',
    category: 'Refund',
    body: 'Your refund of {{amount}} has been approved and returns to the {{method}} number used at checkout. Mobile money refunds usually reflect within 1-3 business days.',
    usageCount: 0,
    updatedAt: '2026-07-11T11:20:00Z',
  },
  {
    id: 'cr_003',
    title: 'Missing item — replacement dispatched',
    category: 'Order issue',
    body: 'We have confirmed a packing error on order {{order}}. A replacement for {{item}} is being dispatched at no cost to you and no return is required.',
    usageCount: 0,
    updatedAt: '2026-07-29T16:05:00Z',
  },
  {
    id: 'cr_004',
    title: 'Product availability — awaiting restock',
    category: 'Product question',
    body: 'That variant is currently out of stock. The supplier expects a restock around {{date}}. Would you like me to notify you the moment it is available?',
    usageCount: 0,
    updatedAt: '2026-06-30T08:40:00Z',
  },
]

export type NotificationItem = {
  id: string
  title: string
  body: string
  createdAt: string
  read: boolean
  kind: 'order' | 'support' | 'promotion' | 'security'
}

export const NOTIFICATIONS: NotificationItem[] = []

export type ActivityEntry = {
  id: string
  action: string
  detail: string
  at: string
  ip: string
}

export const ACTIVITY_LOG: ActivityEntry[] = []

