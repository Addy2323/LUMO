'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Check, ChevronDown, GlobeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/dictionaries'
import { useLocaleStore } from '@/lib/i18n/use-locale'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)
  const [open, setOpen] = useState(false)
  const [justSelected, setJustSelected] = useState<Locale | null>(null)

  function handleSelect(value: Locale) {
    setJustSelected(value)
    // Brief highlight before closing
    setTimeout(() => {
      setLocale(value)
      setOpen(false)
      setJustSelected(null)
    }, 150)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Change language, active language is ${LOCALE_LABELS[locale]}`}
            className="text-xs font-bold gap-1.5 hover:bg-slate-800 text-slate-200 transition-colors"
          >
            <GlobeIcon className="size-3.5 text-orange-400" aria-hidden="true" />
            <span className="uppercase font-extrabold tracking-wide">{locale}</span>
            <ChevronDown
              className={cn(
                'size-3 text-slate-400 transition-transform duration-200',
                open && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        className={cn(
          'w-44 bg-slate-900 border-orange-500/20 text-slate-200 p-1.5 shadow-lg shadow-slate-950/60',
          /* CSS-driven entrance/exit via data-state */
          'data-[state=open]:animate-scale-in',
          'data-[state=closed]:opacity-0',
        )}
      >
        <DropdownMenuGroup>
          {LOCALES.map((value) => {
            const active = locale === value
            const flashing = justSelected === value
            return (
              <DropdownMenuItem
                key={value}
                onClick={() => handleSelect(value)}
                className={cn(
                  'flex items-center justify-between text-xs font-semibold cursor-pointer px-3 py-2.5 rounded-lg transition-colors',
                  active
                    ? 'bg-orange-500/10 text-orange-400 font-bold'
                    : 'hover:bg-slate-800',
                  flashing && 'bg-orange-500/20',
                )}
              >
                <span>{LOCALE_LABELS[value]}</span>
                {active ? (
                  <Check
                    className="size-4 text-orange-500"
                    aria-hidden="true"
                  />
                ) : null}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
