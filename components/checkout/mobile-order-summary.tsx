'use client'

import { formatTZS } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface MobileOrderSummaryProps {
  itemCount: number
  subtotal: number
  shippingName: string
  shippingFee: number
  taxAmount?: number
  couponDiscount?: number
  total: number
  className?: string
}

export function MobileOrderSummary({
  itemCount,
  subtotal,
  shippingName,
  shippingFee,
  taxAmount = 0,
  couponDiscount = 0,
  total,
  className,
}: MobileOrderSummaryProps) {
  return (
    <div className={cn('rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-5 shadow-2xs space-y-3.5', className)}>
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
        <h3 className="font-extrabold text-sm text-[#0F172A]">Order Summary</h3>
        <span className="text-xs font-bold text-[#64748B]">{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-[#475569]">
          <span>Items Subtotal</span>
          <span className="font-bold text-[#0F172A] tnum">{formatTZS(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between text-[#475569]">
          <span className="truncate pr-2">{shippingName}</span>
          <span className="font-bold text-[#0F172A] tnum shrink-0">
            {shippingFee === 0 ? (
              <span className="text-[#137333]">FREE</span>
            ) : (
              formatTZS(shippingFee)
            )}
          </span>
        </div>

        <div className="flex items-center justify-between text-[#475569]">
          <div className="flex items-center gap-1.5">
            <span>Customs Duty &amp; TBS Tax</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-[#475569] border border-slate-200">
              Included
            </span>
          </div>
          <span className="font-bold text-[#0F172A] tnum">{formatTZS(taxAmount)}</span>
        </div>

        {couponDiscount > 0 && (
          <div className="flex items-center justify-between text-[#137333] font-bold">
            <span>Promo Discount</span>
            <span className="tnum">-{formatTZS(couponDiscount)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-[#E2E8F0] pt-3 flex items-baseline justify-between">
        <span className="text-sm font-black text-[#0F172A]">Total Amount</span>
        <div className="text-right">
          <span className="text-xl sm:text-2xl font-black text-[#F95700] tnum block leading-none">
            {formatTZS(total)}
          </span>
          <span className="text-[10px] text-[#64748B] font-medium block mt-1">
            All taxes &amp; charges included
          </span>
        </div>
      </div>
    </div>
  )
}
