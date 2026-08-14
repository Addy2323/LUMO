import { CreditCard, Landmark, Smartphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PaymentMethodId } from '@/lib/mock/orders'

/**
 * Phase 1 payment methods. All of these are processed through AzamPay — the
 * gateway is never surfaced as a choice to the customer.
 */
export type PaymentMethod = {
  id: PaymentMethodId
  name: string
  /** Mobile money uses an STK push; card and bank use their own flows. */
  kind: 'mobile_money' | 'card' | 'bank_transfer'
  description: string
  icon: LucideIcon
  logo?: string
  /** Copy shown while the mock AzamPay call is in flight. */
  waitingCopy?: string
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    kind: 'mobile_money',
    description: 'Vodacom mobile money',
    icon: Smartphone,
    logo: '/payment logo/mpesa.png',
    waitingCopy: 'Check your phone and enter your M-Pesa PIN to approve the payment.',
  },
  {
    id: 'mixxbyyas',
    name: 'Mixx by Yas',
    kind: 'mobile_money',
    description: 'Formerly Tigo Pesa',
    icon: Smartphone,
    logo: '/payment logo/mix by yas.png',
    waitingCopy: 'Check your phone and enter your Mixx by Yas PIN to approve the payment.',
  },
  {
    id: 'halopesa',
    name: 'HaloPesa',
    kind: 'mobile_money',
    description: 'Halotel mobile money',
    icon: Smartphone,
    logo: '/payment logo/halopesa.png',
    waitingCopy: 'Check your phone and enter your HaloPesa PIN to approve the payment.',
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    kind: 'mobile_money',
    description: 'Airtel mobile money',
    icon: Smartphone,
    logo: '/payment logo/airtel-money.png',
    waitingCopy: 'Check your phone and enter your Airtel Money PIN to approve the payment.',
  },
  {
    id: 'card',
    name: 'Card',
    kind: 'card',
    description: 'Visa or Mastercard',
    icon: CreditCard,
  },
  {
    id: 'bank_crdb',
    name: 'CRDB Bank',
    kind: 'bank_transfer',
    description: 'Bank transfer',
    icon: Landmark,
    logo: '/payment logo/crdb.png',
  },
  {
    id: 'bank_nmb',
    name: 'NMB Bank',
    kind: 'bank_transfer',
    description: 'Bank transfer',
    icon: Landmark,
    logo: '/payment logo/nmb.png',
  },
]

export function paymentMethod(id: PaymentMethodId): PaymentMethod {
  return PAYMENT_METHODS.find((method) => method.id === id) ?? PAYMENT_METHODS[0]
}

export const SAVED_PAYMENT_METHODS: any[] = []

/**
 * Stubbed AzamPay call. Resolves after a delay; the reference mirrors the shape
 * the real gateway returns so the checkout screen needs no changes later.
 */
export async function requestAzamPayCharge(input: {
  methodId: PaymentMethodId
  amount: number
  phone?: string
}): Promise<{ reference: string; status: 'success' | 'failed' }> {
  await new Promise((resolve) => setTimeout(resolve, 2600))
  return {
    reference: `AZP-${Math.floor(100000 + Math.random() * 899999)}`,
    status: input.amount > 0 ? 'success' : 'failed',
  }
}
