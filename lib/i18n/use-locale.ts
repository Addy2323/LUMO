'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { translate, type Locale } from '@/lib/i18n/dictionaries'

type LocaleState = {
  locale: Locale
  isTransitioning: boolean
  setLocale: (locale: Locale) => void
  setTransitioning: (v: boolean) => void
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'en',
      isTransitioning: false,
      setLocale: (locale) => {
        setCookie('lumo_locale', locale)
        set({ isTransitioning: true, locale })
        // Auto-clear transitioning after the CSS animation completes
        setTimeout(() => set({ isTransitioning: false }), 320)
      },
      setTransitioning: (v) => set({ isTransitioning: v }),
    }),
    {
      name: 'lumo.locale',
      // Only persist locale, not transient UI state
      partialize: (state) => ({ locale: state.locale }),
    },
  ),
)

/** t() bound to the active locale. */
export function useT() {
  const locale = useLocaleStore((s) => s.locale)
  return (key: string, params?: Record<string, string | number>) => translate(locale, key, params)
}
