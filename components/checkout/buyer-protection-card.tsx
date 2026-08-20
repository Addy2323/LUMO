'use client'

import { Check, ShieldCheck } from 'lucide-react'

export interface BuyerProtectionCardProps {
  variant?: 'compact' | 'full'
}

export function BuyerProtectionCard({ variant = 'full' }: BuyerProtectionCardProps) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-[#A7F3D0] bg-[#E6F4EA] p-3 text-xs text-[#065F46]">
        <ShieldCheck className="size-4 text-[#137333] shrink-0" />
        <span className="font-semibold leading-snug">
          <strong className="font-extrabold text-[#047857]">Lumo Payment Guarantee:</strong> Payment is processed safely via LUMO Pay and protected until your goods pass inspection upon arrival.
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#A7F3D0] bg-[#E6F4EA] p-4 text-xs text-[#065F46] space-y-2.5 shadow-2xs">
      <div className="flex items-center gap-2 font-extrabold text-[#047857] text-xs sm:text-sm">
        <ShieldCheck className="size-4.5 text-[#137333] shrink-0" />
        <span>LUMO Trade Protection</span>
      </div>

      <ul className="space-y-1.5 text-xs text-[#065F46] font-medium">
        <li className="flex items-center gap-2">
          <Check className="size-3.5 text-[#137333] stroke-[3] shrink-0" />
          <span>Payment protected until delivery is confirmed</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-3.5 text-[#137333] stroke-[3] shrink-0" />
          <span>100% refund if item is damaged or missing</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-3.5 text-[#137333] stroke-[3] shrink-0" />
          <span>Seller receives payment only after confirmation</span>
        </li>
      </ul>
    </div>
  )
}
