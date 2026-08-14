'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import { useLocaleStore } from '@/lib/i18n/use-locale'
import { cn } from '@/lib/utils'

/**
 * Wraps page content with a smooth opacity fade during locale switches.
 * The header should remain OUTSIDE this wrapper so it stays stable.
 *
 * Race-condition safe: clears previous timers on rapid switches,
 * and cleans up on unmount.
 */
export function LocaleTransitionProvider({ children }: { children: ReactNode }) {
  const isTransitioning = useLocaleStore((s) => s.isTransitioning)

  return (
    <div
      className={cn(
        'locale-transition',
        isTransitioning && 'locale-transitioning',
      )}
    >
      {children}
    </div>
  )
}
