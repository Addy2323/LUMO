'use client'

import { Globe, Lock, ShieldCheck, Truck } from 'lucide-react'

export function TrustHighlights() {
  const items = [
    {
      icon: ShieldCheck,
      title: 'Buyer Protection',
      desc: 'Shop with confidence and full protection.',
    },
    {
      icon: Lock,
      title: 'Secure Payments',
      desc: 'Payment is safely protected.',
    },
    {
      icon: Truck,
      title: 'Reliable Delivery',
      desc: 'Safe delivery across Tanzania.',
    },
    {
      icon: Globe,
      title: 'Global Marketplace',
      desc: 'Access quality worldwide.',
    },
  ]

  return (
    <section className="py-8 sm:py-10 bg-white border-y border-[#DCE6F0]/80">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] tracking-tight mb-6">
          Why Choose Lumo?
        </h2>

        {/* 2x2 Grid on Mobile, 4-column on Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                className="flex flex-col items-center text-center sm:items-start sm:text-left p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs hover:border-[#0F9D8A]/40 transition-colors"
              >
                <div className="size-12 rounded-full border-2 border-[#0F9D8A]/30 bg-[#0F9D8A]/10 flex items-center justify-center shrink-0 mb-3">
                  <Icon className="size-6 text-[#0F9D8A]" />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-[#0B1F3A] leading-tight">
                  {item.title}
                </span>
                <span className="text-[11px] sm:text-xs text-[#64748B] leading-normal mt-1">
                  {item.desc}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
