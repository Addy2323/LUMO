'use client'

import { Check, ShieldCheck } from 'lucide-react'

export interface BuyerProtectionCardProps {
  variant?: 'compact' | 'full'
}

export function BuyerProtectionCard({ variant = 'full' }: BuyerProtectionCardProps) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-orange-200 bg-[#FFF8F5] p-3 text-xs text-[#9A3412]">
        <ShieldCheck className="size-4 text-primary shrink-0" />
        <span className="font-semibold leading-snug">
          <strong className="font-extrabold text-[#C2410C]">Lumo Payment Guarantee:</strong> Payment is processed safely via LUMO Pay and protected until your goods pass inspection upon arrival.
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-orange-200 bg-[#FFF8F5] p-4 text-xs text-[#9A3412] space-y-2.5 shadow-2xs">
      <div className="flex items-center gap-2 font-extrabold text-[#C2410C] text-xs sm:text-sm">
        <ShieldCheck className="size-4.5 text-primary shrink-0" />
        <span>LUMO Trade Protection</span>
      </div>

      <ul className="space-y-1.5 text-xs text-[#9A3412] font-medium">
        <li className="flex items-center gap-2">
          <Check className="size-3.5 text-primary stroke-[3] shrink-0" />
          <span>Payment protected until delivery is confirmed</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-3.5 text-primary stroke-[3] shrink-0" />
          <span>100% refund if item is damaged or missing</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-3.5 text-primary stroke-[3] shrink-0" />
          <span>Seller receives payment only after confirmation</span>
        </li>
      </ul>
    </div>
  )
}
