'use client'

import { Award, Box, MessageSquare } from 'lucide-react'
import { useT } from '@/lib/i18n/use-locale'

export function HomeValueStrip() {
  const t = useT()

  const items = [
    { icon: Award, title: t('home.valueQualityTitle'), desc: t('home.valueQualityDesc') },
    { icon: Box, title: t('home.valueTrackingTitle'), desc: t('home.valueTrackingDesc') },
    { icon: MessageSquare, title: t('home.valueSupportTitle'), desc: t('home.valueSupportDesc') },
  ]

  return (
    <section className="py-8 sm:py-10 bg-white border-t border-[#DCE6F0]/80">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-center justify-between">
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="flex items-center gap-3.5">
                <div className="size-11 rounded-xl bg-[#0F9D8A]/8 border border-[#0F9D8A]/25 flex items-center justify-center shrink-0">
                  <Icon className="size-5 text-[#0F9D8A]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#0B1F3A]">{item.title}</span>
                  <span className="text-xs text-[#64748B] mt-0.5">{item.desc}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
