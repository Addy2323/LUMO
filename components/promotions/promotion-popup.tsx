'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { X, Clock, Sparkles } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { useSessionStore } from '@/lib/stores/session-store'

interface PublicPromotion {
  id: string
  title: string
  subtitle?: string | null
  description: string
  desktopImageUrl: string
  mobileImageUrl?: string | null
  imageAltText?: string | null
  buttonText: string
  buttonUrl: string
  secondaryButtonText?: string | null
  secondaryButtonUrl?: string | null
  backgroundColor: string
  textColor: string
  buttonColor: string
  placement: string
  audience: string
  displayFrequency: string
  delaySeconds: number
  dismissible: boolean
  openInNewTab: boolean
  startAt: string
  endAt: string
  timezone: string
}

const EXCLUDED_PREFIXES = [
  '/admin',
  '/agent',
  '/sales',
  '/supplier',
  '/logistics',
  '/login',
  '/register',
  '/auth',
  '/checkout',
  '/pay',
  '/reset-password',
  '/verify-otp',
]

export function PromotionPopup() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useSessionStore((s) => s.user)

  const [promo, setPromo] = useState<PublicPromotion | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // 1. Route exclusion check
  const isExcludedRoute = React.useMemo(() => {
    if (!pathname) return false
    if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true
    if (pathname.includes('/orders/') && pathname.includes('/pay')) return true
    return false
  }, [pathname])

  // Helper: check frequency cap
  const checkFrequencyPermitted = useCallback((p: PublicPromotion) => {
    const promoKey = `lumo_promo_${p.id}`
    const now = Date.now()

    if (p.displayFrequency === 'ONCE_PER_SESSION') {
      const seen = sessionStorage.getItem(promoKey)
      if (seen) return false
    } else if (p.displayFrequency === 'ONCE_PER_DAY') {
      const lastSeen = localStorage.getItem(`${promoKey}_time`)
      if (lastSeen && now - parseInt(lastSeen, 10) < 24 * 60 * 60 * 1000) {
        return false
      }
    } else if (p.displayFrequency === 'ONCE_PER_WEEK') {
      const lastSeen = localStorage.getItem(`${promoKey}_time`)
      if (lastSeen && now - parseInt(lastSeen, 10) < 7 * 24 * 60 * 60 * 1000) {
        return false
      }
    } else if (p.displayFrequency === 'ONCE_PER_PROMOTION') {
      const seen = localStorage.getItem(promoKey)
      if (seen) return false
    }

    return true
  }, [])

  // Helper: record frequency display
  const recordFrequencyDisplay = useCallback((p: PublicPromotion) => {
    const promoKey = `lumo_promo_${p.id}`
    const now = String(Date.now())

    if (p.displayFrequency === 'ONCE_PER_SESSION') {
      sessionStorage.setItem(promoKey, '1')
    } else if (p.displayFrequency === 'ONCE_PER_DAY' || p.displayFrequency === 'ONCE_PER_WEEK') {
      localStorage.setItem(`${promoKey}_time`, now)
    } else if (p.displayFrequency === 'ONCE_PER_PROMOTION') {
      localStorage.setItem(promoKey, '1')
      localStorage.setItem(`${promoKey}_time`, now)
    }
  }, [])

  // 2. Fetch active promotion
  useEffect(() => {
    if (isExcludedRoute || hasInteracted) return

    let isMounted = true
    let timer: NodeJS.Timeout

    async function loadActivePromotion() {
      try {
        const audience = user ? 'LOGGED_IN' : 'GUEST'
        const res = await fetch(`/api/promotions/active?placement=ENTRY_POPUP&audience=${audience}`)
        if (!res.ok) return

        const data = await res.json()
        if (!data.promotion || !isMounted) return

        const promotion: PublicPromotion = data.promotion

        // Verify frequency
        if (!checkFrequencyPermitted(promotion)) {
          return
        }

        setPromo(promotion)

        // Trigger after delaySeconds (default 1.5s - 2s)
        const delayMs = Math.max(800, (promotion.delaySeconds || 2) * 1000)
        timer = setTimeout(() => {
          if (!isMounted) return
          previousActiveElement.current = document.activeElement as HTMLElement
          setIsOpen(true)
          recordFrequencyDisplay(promotion)

          // Send impression telemetry
          const device = window.innerWidth < 768 ? 'MOBILE' : 'DESKTOP'
          fetch(`/api/promotions/${promotion.id}/impression`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user?.id || null,
              deviceType: device,
            }),
          }).catch(() => {})
        }, delayMs)
      } catch (err) {
        console.error('[PROMOTION POPUP FETCH ERROR]', err)
      }
    }

    loadActivePromotion()

    return () => {
      isMounted = false
      if (timer) clearTimeout(timer)
    }
  }, [pathname, isExcludedRoute, user, checkFrequencyPermitted, recordFrequencyDisplay, hasInteracted])

  // 3. Live countdown calculation
  useEffect(() => {
    if (!isOpen || !promo?.endAt) return

    function updateCountdown() {
      const end = new Date(promo!.endAt).getTime()
      const now = Date.now()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft(null)
        setIsOpen(false)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [isOpen, promo])

  // 4. Background scroll lock & Esc key listener
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && promo?.dismissible !== false) {
        handleDismiss('escape_key')
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
      if (previousActiveElement.current) {
        previousActiveElement.current.focus?.()
      }
    }
  }, [isOpen, promo])

  // Handlers
  function handleDismiss(reason: string = 'close_button') {
    if (!promo) return
    setIsOpen(false)
    setHasInteracted(true)

    // Fire dismiss telemetry
    const device = typeof window !== 'undefined' && window.innerWidth < 768 ? 'MOBILE' : 'DESKTOP'
    fetch(`/api/promotions/${promo.id}/dismiss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id || null,
        deviceType: device,
        metadata: { reason },
      }),
    }).catch(() => {})
  }

  function handleCtaClick() {
    if (!promo) return
    setIsOpen(false)
    setHasInteracted(true)

    // Fire click telemetry
    const device = typeof window !== 'undefined' && window.innerWidth < 768 ? 'MOBILE' : 'DESKTOP'
    fetch(`/api/promotions/${promo.id}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id || null,
        deviceType: device,
      }),
    }).catch(() => {})

    if (promo.openInNewTab) {
      window.open(promo.buttonUrl, '_blank', 'noopener,noreferrer')
    } else {
      router.push(promo.buttonUrl)
    }
  }

  function handleSecondaryClick() {
    if (!promo) return
    if (promo.secondaryButtonUrl) {
      router.push(promo.secondaryButtonUrl)
    }
    handleDismiss('secondary_button')
  }

  if (!isOpen || !promo || isExcludedRoute) {
    return null
  }

  const format2 = (n: number) => String(n).padStart(2, '0')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-heading"
      onClick={(e) => {
        if (e.target === e.currentTarget && promo.dismissible) {
          handleDismiss('backdrop_click')
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-[720px] max-h-[85vh] overflow-y-auto rounded-2xl md:rounded-3xl shadow-2xl transition-all duration-300 transform scale-100 animate-in zoom-in-95 border border-white/20"
        style={{
          backgroundColor: promo.backgroundColor || '#FFF8F2',
          color: promo.textColor || '#0B1F3A',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {promo.dismissible && (
          <button
            type="button"
            onClick={() => handleDismiss('close_button')}
            className="absolute top-3 right-3 z-20 flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-xs hover:bg-white hover:text-slate-950 transition-all focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            aria-label="Close promotional popup"
          >
            <X className="size-5" />
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] md:min-h-[420px]">
          {/* Left Column: Image Creative */}
          <div className="md:col-span-5 relative min-h-[220px] md:min-h-full overflow-hidden rounded-t-2xl md:rounded-tr-none md:rounded-l-3xl bg-slate-200">
            <img
              src={promo.desktopImageUrl || promo.mobileImageUrl || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800'}
              alt={promo.imageAltText || promo.title}
              className="size-full object-cover"
              loading="eager"
            />
            {/* Soft inner glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent md:hidden" />
          </div>

          {/* Right Column: Copy & Actions */}
          <div className="md:col-span-7 flex flex-col justify-center items-center text-center p-6 sm:p-8 space-y-4">
            {/* Lumo Logo Mark */}
            <div className="flex items-center justify-center gap-2">
              <Logo markOnly className="size-8" />
              <span className="font-extrabold text-lg tracking-tight uppercase" style={{ color: promo.buttonColor || '#FF6B00' }}>
                LUMO
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-1.5 max-w-sm">
              <h2 id="promo-heading" className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight leading-tight">
                {promo.title}
              </h2>
              {promo.subtitle && (
                <p className="text-sm sm:text-base font-extrabold" style={{ color: promo.buttonColor || '#FF6B00' }}>
                  {promo.subtitle}
                </p>
              )}
            </div>

            {/* Sparkle divider */}
            <div className="flex items-center justify-center">
              <Sparkles className="size-4 opacity-70" style={{ color: promo.buttonColor || '#FF6B00' }} />
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm leading-relaxed opacity-90 max-w-xs font-medium">
              {promo.description}
            </p>

            {/* Countdown Badge */}
            {timeLeft && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
                <span>
                  Offer ends in{' '}
                  <strong className="font-mono text-xs font-black">
                    {format2(timeLeft.hours)}:{format2(timeLeft.minutes)}:{format2(timeLeft.seconds)}
                  </strong>
                </span>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="w-full max-w-xs space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCtaClick}
                className="w-full py-3 px-6 rounded-xl font-black text-sm uppercase tracking-wide text-white shadow-lg hover:brightness-110 active:scale-98 transition-all focus:outline-hidden focus:ring-3 focus:ring-brand-500/40 cursor-pointer"
                style={{ backgroundColor: promo.buttonColor || '#FF6B00' }}
              >
                {promo.buttonText || 'Explore the Offer'}
              </button>

              {promo.secondaryButtonText && (
                <button
                  type="button"
                  onClick={handleSecondaryClick}
                  className="w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                >
                  {promo.secondaryButtonText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
