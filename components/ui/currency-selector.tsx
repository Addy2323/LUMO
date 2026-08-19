'use client'

import React, { useEffect, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useCurrencyStore,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from '@/lib/stores/currency-store'

interface FlagIconProps {
  code: CurrencyCode
  className?: string
}

export function FlagIcon({ code, className = 'size-4' }: FlagIconProps) {
  const containerClass = `${className} rounded-full overflow-hidden shrink-0 border border-slate-200/80 shadow-2xs`

  switch (code) {
    case 'TZS':
      return (
        <svg className={containerClass} viewBox="0 0 36 24" aria-hidden="true">
          <rect width="36" height="24" fill="#1EB53A" />
          <path d="M0,24 L36,0 L36,24 Z" fill="#00A3E0" />
          <path d="M0,24 L36,0" stroke="#FCD116" strokeWidth="7" />
          <path d="M0,24 L36,0" stroke="#000000" strokeWidth="4.5" />
        </svg>
      )
    case 'USD':
      return (
        <svg className={containerClass} viewBox="0 0 36 24" aria-hidden="true">
          <rect width="36" height="24" fill="#B22234" />
          <path d="M0,3.7h36M0,11.1h36M0,18.5h36" stroke="#FFFFFF" strokeWidth="2.5" />
          <rect width="15" height="13" fill="#3C3B6E" />
          <circle cx="4" cy="3.5" r="1" fill="#FFFFFF" />
          <circle cx="11" cy="3.5" r="1" fill="#FFFFFF" />
          <circle cx="7.5" cy="6.5" r="1" fill="#FFFFFF" />
          <circle cx="4" cy="9.5" r="1" fill="#FFFFFF" />
          <circle cx="11" cy="9.5" r="1" fill="#FFFFFF" />
        </svg>
      )
    case 'KES':
      return (
        <svg className={containerClass} viewBox="0 0 36 24" aria-hidden="true">
          <rect width="36" height="6.5" fill="#000000" />
          <rect y="6.5" width="36" height="1.8" fill="#FFFFFF" />
          <rect y="8.3" width="36" height="7.4" fill="#BB0000" />
          <rect y="15.7" width="36" height="1.8" fill="#FFFFFF" />
          <rect y="17.5" width="36" height="6.5" fill="#006600" />
        </svg>
      )
    case 'UGX':
      return (
        <svg className={containerClass} viewBox="0 0 36 24" aria-hidden="true">
          <rect width="36" height="4" y="0" fill="#000000" />
          <rect width="36" height="4" y="4" fill="#FCD116" />
          <rect width="36" height="4" y="8" fill="#D21034" />
          <rect width="36" height="4" y="12" fill="#000000" />
          <rect width="36" height="4" y="16" fill="#FCD116" />
          <rect width="36" height="4" y="20" fill="#D21034" />
        </svg>
      )
    case 'EUR':
      return (
        <svg className={containerClass} viewBox="0 0 36 24" aria-hidden="true">
          <rect width="36" height="24" fill="#003399" />
          <circle cx="18" cy="12" r="6" stroke="#FFCC00" strokeWidth="1.8" fill="none" strokeDasharray="2.5,2" />
        </svg>
      )
    case 'GBP':
      return (
        <svg className={containerClass} viewBox="0 0 36 24" aria-hidden="true">
          <rect width="36" height="24" fill="#00247D" />
          <path d="M0,0 L36,24 M36,0 L0,24" stroke="#FFFFFF" strokeWidth="4.5" />
          <path d="M0,0 L36,24 M36,0 L0,24" stroke="#CF142B" strokeWidth="2.5" />
          <path d="M18,0 V24 M0,12 H36" stroke="#FFFFFF" strokeWidth="7" />
          <path d="M18,0 V24 M0,12 H36" stroke="#CF142B" strokeWidth="4" />
        </svg>
      )
    case 'CNY':
      return (
        <svg className={containerClass} viewBox="0 0 36 24" aria-hidden="true">
          <rect width="36" height="24" fill="#DE2910" />
          <polygon points="7,4 8.5,8.5 13,8.5 9.5,11 11,15.5 7,13 3,15.5 4.5,11 1,8.5 5.5,8.5" fill="#FFDE00" />
        </svg>
      )
    default:
      return (
        <div className={`${containerClass} bg-slate-300 flex items-center justify-center text-[8px] font-bold`}>
          {code}
        </div>
      )
  }
}

export function CurrencySelector() {
  const activeCurrency = useCurrencyStore((s) => s.currency)
  const setCurrency = useCurrencyStore((s) => s.setCurrency)
  const [mounted, setMounted] = useState(false)

  // Prevent SSR hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const currentConfig = SUPPORTED_CURRENCIES[activeCurrency] || SUPPORTED_CURRENCIES.TZS

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-[#D9E2EC] dark:border-slate-700 shadow-xs text-xs font-bold text-[#0B1F3A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            aria-label={`Select Currency. Current: ${currentConfig.name}`}
          >
            <FlagIcon code={mounted ? activeCurrency : 'TZS'} />
            <span className="font-extrabold tracking-tight">{mounted ? activeCurrency : 'TZS'}</span>
            <ChevronDown className="size-3 text-slate-500 opacity-80" aria-hidden="true" />
          </button>
        }
      />
      <DropdownMenuContent
        align="end"
        className="w-56 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-xl z-50 text-slate-900 dark:text-slate-100"
      >
        <div className="px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
          Select Store Currency
        </div>
        {Object.values(SUPPORTED_CURRENCIES).map((item) => {
          const isSelected = mounted && activeCurrency === item.code
          return (
            <DropdownMenuItem
              key={item.code}
              onClick={() => setCurrency(item.code)}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FlagIcon code={item.code} className="size-4" />
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs truncate leading-tight">{item.code}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight">
                    {item.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {item.symbol}
                </span>
                {isSelected && <Check className="size-3.5 text-orange-600 dark:text-orange-400 stroke-[3]" />}
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
