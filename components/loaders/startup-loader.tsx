'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

interface StartupLoaderProps {
  children?: React.ReactNode
  targetRoute?: string
  autoRedirect?: boolean
  onComplete?: () => void
  simulateError?: boolean
}

const FULL_TITLE = 'Lumo Commerce'
const TYPING_SPEED_MS = 70

export function StartupLoader({
  children,
  targetRoute = '/marketplace',
  autoRedirect = false,
  onComplete,
  simulateError = false,
}: StartupLoaderProps) {
  const router = useRouter()
  const [typedIndex, setTypedIndex] = useState(0)
  const [typingComplete, setTypingComplete] = useState(false)
  const [taglineVisible, setTaglineVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [messageVisible, setMessageVisible] = useState(false)
  const [phase, setPhase] = useState<'loading' | 'exiting' | 'done' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const isMountedRef = useRef(true)

  // 1. Detect prefers-reduced-motion
  useEffect(() => {
    isMountedRef.current = true
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      if (mediaQuery.matches) {
        setPrefersReducedMotion(true)
        setTypedIndex(FULL_TITLE.length)
        setTypingComplete(true)
        setTaglineVisible(true)
        setMessageVisible(true)
        setProgress(100)
      }
    }
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 2. Error simulation or actual failure trigger
  useEffect(() => {
    if (simulateError) {
      const timer = setTimeout(() => {
        if (!isMountedRef.current) return
        setPhase('error')
        setErrorMessage('We couldn’t prepare Lumo Commerce.')
        console.error('[LUMO LOADER] Simulated initialization failure encountered.')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [simulateError])

  // 3. Typewriter animation loop
  useEffect(() => {
    if (prefersReducedMotion || phase === 'error') return

    // Logo fade-in delay (250ms), then start typing
    const startTimer = setTimeout(() => {
      if (!isMountedRef.current) return

      let currentIndex = 0
      const typingInterval = setInterval(() => {
        if (!isMountedRef.current) {
          clearInterval(typingInterval)
          return
        }

        currentIndex++
        setTypedIndex(currentIndex)

        if (currentIndex >= FULL_TITLE.length) {
          clearInterval(typingInterval)
          setTypingComplete(true)

          // 900-1400ms: Tagline & Message fade in
          setTimeout(() => {
            if (isMountedRef.current) setTaglineVisible(true)
          }, 200)

          setTimeout(() => {
            if (isMountedRef.current) setMessageVisible(true)
          }, 400)
        }
      }, TYPING_SPEED_MS)

      return () => clearInterval(typingInterval)
    }, 250)

    return () => clearTimeout(startTimer)
  }, [prefersReducedMotion, phase])

  // 4. Progress bar smooth animation curve (1,000ms onward)
  useEffect(() => {
    if (phase === 'error') return

    const totalDuration = 2200
    const intervalMs = 30
    const totalSteps = totalDuration / intervalMs
    let step = 0

    const interval = setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(interval)
        return
      }

      step++
      const t = step / totalSteps
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const currentProgress = Math.min(100, Math.round(eased * 100))

      setProgress(currentProgress)

      if (step >= totalSteps) {
        clearInterval(interval)
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }, [phase])

  // 5. Exit & Redirect Sequence when progress reaches 100%
  useEffect(() => {
    if (progress >= 100 && phase === 'loading' && typingComplete) {
      const exitTimer = setTimeout(() => {
        if (!isMountedRef.current) return
        setPhase('exiting')
      }, 400)
      return () => clearTimeout(exitTimer)
    }
  }, [progress, phase, typingComplete])

  useEffect(() => {
    if (phase === 'exiting') {
      const doneTimer = setTimeout(() => {
        if (!isMountedRef.current) return
        setPhase('done')
        if (onComplete) onComplete()
        if (autoRedirect && targetRoute) {
          router.push(targetRoute)
        }
      }, 500)
      return () => clearTimeout(doneTimer)
    }
  }, [phase, autoRedirect, targetRoute, router, onComplete])

  const handleRetry = () => {
    setPhase('loading')
    setErrorMessage(null)
    setTypedIndex(0)
    setTypingComplete(false)
    setTaglineVisible(false)
    setMessageVisible(false)
    setProgress(0)
  }

  if (phase === 'done' && children) {
    return <>{children}</>
  }

  // Derive visible title parts
  const visibleText = FULL_TITLE.slice(0, typedIndex)
  const lumoPart = visibleText.slice(0, 4) // "Lumo"
  const commercePart = visibleText.slice(4) // " Commerce"

  return (
    <>
      {children && (
        <div className={phase !== 'done' ? 'invisible fixed opacity-0' : ''}>
          {children}
        </div>
      )}

      {/* Screen Reader Announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        Lumo Commerce — Shop globally. Delivered locally. Preparing your marketplace...
      </div>

      {/* Full-Screen Brand Loading Overlay */}
      <div
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-[#020817] text-white transition-opacity duration-500 select-none overflow-hidden font-sans ${
          phase === 'exiting' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-hidden="true"
      >
        {/* Soft Ambient Radial Glow behind Content */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(255,122,0,0.12)_0%,_rgba(7,17,38,0.05)_50%,_transparent_70%)] pointer-events-none rounded-full" />

        {/* Decorative Global Commerce SVG Network (Routes & Dots) */}
        <svg
          className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid-dots" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#FF7A00" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-dots)" />
          {/* Faint global trade corridor arcs */}
          <path
            d="M 100,300 Q 400,100 800,350 T 1500,200"
            fill="none"
            stroke="#FF7A00"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity="0.3"
          />
          <path
            d="M 200,600 Q 600,400 1100,650 T 1700,500"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="1"
            strokeDasharray="6 8"
            opacity="0.2"
          />
        </svg>

        {/* Centered Main Brand Content */}
        <div className="relative z-10 flex flex-col items-center max-w-xl w-full text-center space-y-6">
          
          {/* 1. Lumo Square Logo (Fade & Scale into View) */}
          <div className="relative group transition-all duration-700 transform hover:scale-105">
            {/* Logo Outer Glow */}
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-[#FF7A00] to-[#FF8A1F] opacity-30 blur-lg group-hover:opacity-60 transition duration-500" />
            <div className="relative size-16 sm:size-20 rounded-2xl bg-[#FF7A00] flex items-center justify-center font-mono font-black text-3xl sm:text-4xl text-white shadow-2xl border border-white/20">
              L
            </div>
          </div>

          {/* 2. Animated "Lumo Commerce" Title */}
          <div className="h-16 sm:h-20 flex items-center justify-center">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-sans flex items-center">
              <span className="text-white">{lumoPart}</span>
              <span className="text-[#FF7A00]">{commercePart}</span>

              {/* Blinking Cursor */}
              {!prefersReducedMotion && phase !== 'error' && (
                <span
                  className={`inline-block w-1 h-9 sm:h-12 lg:h-14 ml-1 bg-[#FF7A00] rounded-full transition-opacity duration-300 ${
                    typingComplete ? 'opacity-0' : 'animate-pulse opacity-100'
                  }`}
                />
              )}
            </h1>
          </div>

          {/* 3. Tagline: "Shop globally. Delivered locally." */}
          <div
            className={`transition-all duration-500 transform ${
              taglineVisible || prefersReducedMotion
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-3'
            }`}
          >
            <p className="text-sm sm:text-lg text-slate-300 font-medium tracking-wide">
              Shop globally. Delivered locally.
            </p>
          </div>

          {/* Error State or Progress Section */}
          {phase === 'error' ? (
            <div className="w-full space-y-4 pt-4 animate-in fade-in duration-300">
              <p className="text-sm text-rose-400 font-medium">
                {errorMessage || 'We couldn’t prepare Lumo Commerce.'}
              </p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#FF8A1F] text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#020817] cursor-pointer"
              >
                <RefreshCw className="size-4" />
                Try Again
              </button>
            </div>
          ) : (
            <div className="w-full max-w-md space-y-4 pt-2">
              {/* 4. Thin Hairline Progress Bar */}
              <div className="w-full h-1 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/30">
                <div
                  className="h-full bg-gradient-to-r from-[#FF7A00] via-[#FF8A1F] to-amber-400 rounded-full transition-all duration-100 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* 5. Loading Message */}
              <div
                className={`transition-all duration-500 ${
                  messageVisible || prefersReducedMotion
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2'
                }`}
              >
                <p className="text-xs sm:text-sm text-slate-400 font-normal tracking-wide">
                  Preparing your marketplace…
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
