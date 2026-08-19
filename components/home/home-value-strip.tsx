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
    <section className="py-8 sm:py-10 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800/80">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-center justify-between">
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-orange-500/30 hover:shadow-md transition-all duration-200"
              >
                <div className="size-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 shadow-inner">
                  <Icon className="size-6 text-orange-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{item.title}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
