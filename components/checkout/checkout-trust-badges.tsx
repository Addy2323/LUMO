'use client'

import { Lock, ShieldCheck, Truck } from 'lucide-react'

export function CheckoutTrustBadges() {
  return (
    <section aria-labelledby="checkout-title" className="flex flex-col gap-3 pb-2">
      {/* Active Protection Green Badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4EA] px-3 py-1 text-xs font-bold text-[#137333]">
          <ShieldCheck className="size-3.5 text-[#137333]" />
          LUMO Trade Protection Active
        </span>
      </div>

      {/* Main Title & Description */}
      <div>
        <h1 id="checkout-title" className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
          Secure Checkout &amp; Settlement
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] mt-1 font-medium leading-relaxed">
          Verify your delivery address, select payment method, and complete your order.
        </p>
      </div>

      {/* Trust Badges Bar */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <div className="flex items-center gap-1.5 rounded-full bg-white border border-[#E2E8F0] px-3 py-1.5 shadow-2xs text-xs font-semibold text-[#0F172A]">
          <Lock className="size-3.5 text-[#137333]" />
          <span>256-Bit SSL Encrypted</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white border border-[#E2E8F0] px-3 py-1.5 shadow-2xs text-xs font-semibold text-[#0F172A]">
          <Truck className="size-3.5 text-primary" />
          <span>Guaranteed Delivery</span>
        </div>
      </div>
    </section>
  )
}
