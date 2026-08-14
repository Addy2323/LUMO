import { cn } from '@/lib/utils'

/**
 * Single source of truth for every status pill across all dashboards.
 * Status colours use the semantic tokens only — never the teal brand accent.
 */

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'orange' | 'teal'

export type StatusKey =
  // orders
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  // payments
  | 'payment_pending'
  | 'payment_failed'
  | 'refunded'
  // tickets
  | 'open'
  | 'assigned'
  | 'escalated'
  | 'resolved'
  // approvals / KYC / Onboarding Applications
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'more_information_required'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'active'
  | 'verified'
  | 'unverified'
  | 'suspended'
  | 'terminated'
  // shipments
  | 'awaiting_pickup'
  | 'in_transit'
  | 'failed_delivery'

const STATUS_MAP: Record<StatusKey, { label: string; tone: StatusTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  processing: { label: 'Processing', tone: 'info' },
  shipped: { label: 'Shipped', tone: 'teal' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  returned: { label: 'Returned', tone: 'danger' },

  payment_pending: { label: 'Awaiting payment', tone: 'warning' },
  payment_failed: { label: 'Payment failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },

  open: { label: 'Open', tone: 'warning' },
  assigned: { label: 'Assigned', tone: 'info' },
  escalated: { label: 'Escalated', tone: 'danger' },
  resolved: { label: 'Resolved', tone: 'success' },

  draft: { label: 'Draft', tone: 'neutral' },
  submitted: { label: 'Submitted', tone: 'info' },
  under_review: { label: 'Under Review', tone: 'warning' },
  more_information_required: { label: 'More Info Required', tone: 'orange' },
  pending_approval: { label: 'Pending Approval', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
  active: { label: 'Active', tone: 'teal' },
  verified: { label: 'Verified', tone: 'success' },
  unverified: { label: 'Unverified', tone: 'warning' },
  suspended: { label: 'Suspended', tone: 'danger' },
  terminated: { label: 'Terminated', tone: 'danger' },

  awaiting_pickup: { label: 'Awaiting Pickup', tone: 'warning' },
  in_transit: { label: 'In Transit', tone: 'teal' },
  failed_delivery: { label: 'Failed Delivery', tone: 'danger' },
}

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  info: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  danger: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  orange: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  teal: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: StatusKey | string
  /** Override default copy while keeping mapped tone. */
  label?: string
  className?: string
}) {
  const normalizedKey = (status in STATUS_MAP ? status : 'pending') as StatusKey
  const config = STATUS_MAP[normalizedKey]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap shadow-2xs',
        TONE_CLASSES[config.tone],
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label ?? config.label}
    </span>
  )
}
