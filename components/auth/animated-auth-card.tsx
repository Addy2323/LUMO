'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Lock, ArrowUpRight, CheckCircle2, ArrowRight } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { SignInForm } from '@/components/auth/sign-in-form'
import { SignUpForm } from '@/components/auth/sign-up-form'
import { ThemeToggle } from '@/components/theme-toggle'
import { AuthLogisticsIllustration } from '@/components/auth/auth-logistics-illustration'

const REGISTER_BULLETS = [
  'Direct factory trade with zero forex risk.',
  'Skip the middlemen. Source direct from factory floor.',
  'One account. Every supplier from China to Dubai.',
  'Verified suppliers. Transparent pricing. No surprises.',
  'Your global supply chain, built from Dar es Salaam.',
]

const LOGIN_BULLETS = [
  'Empowering direct global sourcing to East Africa.',
  'From factory gate to your doorstep — tracked all the way.',
  'Cut out the guesswork. Source with confidence.',
  'East Africa’s trusted gateway to global manufacturing.',
  'Real suppliers. Real quotations. Real landed cost.',
]

export function AnimatedAuthCard({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  function toggleMode(newMode: 'login' | 'register') {
    setMode(newMode)
    router.push(newMode === 'login' ? '/login' : '/register', { scroll: false })
  }

  const activeBullets = mode === 'register' ? REGISTER_BULLETS : LOGIN_BULLETS

  return (
    <div className="relative flex min-h-dvh min-h-svh w-full flex-col justify-between p-4 sm:p-6 lg:p-8 pb-[env(safe-area-inset-bottom)] antialiased selection:bg-[#F95700] selection:text-white bg-[#FAF8F5] dark:bg-[#090D16] text-[#0F172A] dark:text-slate-100 transition-colors duration-300">
      
      {/* Background Dot Pattern on Desktop */}
      <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] dark:bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none z-0" />

      {/* =========================================================================
         MOBILE LAYOUT (< lg): Single Card with AuthLogisticsIllustration Bottom Art
         ========================================================================= */}
      <div className="flex flex-col justify-between min-h-dvh min-h-svh w-full lg:hidden relative z-10">
        {/* Mobile Header Navigation */}
        <header className="flex w-full items-center justify-between py-2">
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo tone="default" />
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/startup">
              <button
                type="button"
                className="rounded-full border-2 border-[#F95700] text-[#F95700] hover:bg-[#F95700]/10 px-3.5 py-1.5 text-xs font-bold flex items-center gap-1 transition-all duration-200 cursor-pointer shadow-xs"
              >
                Startup Portal
                <ArrowUpRight className="size-3.5 stroke-[2.5]" />
              </button>
            </Link>
          </div>
        </header>

        {/* Mobile Main Form Container */}
        <main className="mx-auto my-auto w-full max-w-[440px] pt-4 pb-6">
          <div className="w-full rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/50 p-6 sm:p-7 transition-all duration-300">
            {mode === 'login' ? (
              <div className="space-y-4">
                <header className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                    Welcome back
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-[#64748B] dark:text-slate-400">
                    Sign in to manage orders, quotations &amp; logistics.
                  </p>
                </header>

                {/* Social Login Buttons (Google & GitHub) */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Button
                    variant="outline"
                    type="button"
                    className="h-10.5 rounded-xl border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-extrabold text-xs shadow-2xs gap-2"
                  >
                    <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Google
                  </Button>

                  <Button
                    variant="outline"
                    type="button"
                    className="h-10.5 rounded-xl border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-extrabold text-xs shadow-2xs gap-2"
                  >
                    <svg className="size-4 shrink-0 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    GitHub
                  </Button>
                </div>

                <div className="relative flex items-center justify-center my-3">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  <span className="absolute bg-white dark:bg-[#0D1527] px-3 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    OR CONTINUE WITH EMAIL
                  </span>
                </div>

                <SignInForm />

                <div className="pt-2 text-center text-xs font-semibold text-[#64748B] dark:text-slate-400">
                  New to Lumo?{' '}
                  <button
                    type="button"
                    onClick={() => toggleMode('register')}
                    className="font-extrabold text-[#F95700] hover:underline cursor-pointer ml-1"
                  >
                    Create an account
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <header className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                    Join the crew
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-[#64748B] dark:text-slate-400">
                    Register an account for buyer, supplier, agent or fleet desk.
                  </p>
                </header>

                <SignUpForm />

                <div className="pt-2 text-center text-xs font-semibold text-[#64748B] dark:text-slate-400">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => toggleMode('login')}
                    className="font-extrabold text-[#F95700] hover:underline cursor-pointer ml-1"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Security Badge Below Card */}
          <div className="flex items-center justify-center gap-2.5 mt-5 text-xs text-[#64748B] dark:text-slate-400 font-semibold">
            <div className="size-7 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="size-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
            </div>
            <span>Secure authentication • Protected by Lumo</span>
          </div>
        </main>

        {/* Decorative Logistics Illustration at bottom of mobile view */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-orange-100/70 via-orange-50/30 to-transparent dark:from-orange-950/30 dark:via-transparent" />
          <AuthLogisticsIllustration className="relative h-[150px] sm:h-[190px] w-full text-[#FF9A5C]/40 dark:text-orange-400/25" />
        </div>
      </div>

      {/* =========================================================================
         DESKTOP LAYOUT (≥ lg): 2-Column Split Auth Card Matching Reference Image
         ========================================================================= */}
      <div className="hidden lg:flex my-auto mx-auto w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-[#0D1527] border border-slate-200/80 dark:border-slate-800 relative z-10 grid grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr]">
        
        {/* Left Column: Vibrant Orange Hero Banner Panel */}
        <div className="bg-[#F95700] p-8 xl:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle Ambient Curved Overlay Lines */}
          <div className="absolute -right-20 -bottom-20 size-80 rounded-full border border-white/15 pointer-events-none" />
          <div className="absolute -right-10 -bottom-10 size-60 rounded-full border border-white/20 pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Top Pill Tag */}
            <div className="border border-white/40 bg-white/10 text-white font-extrabold text-[10px] tracking-wider uppercase px-3.5 py-1 rounded-full w-fit backdrop-blur-xs">
              LUMO ECOSYSTEM
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white">
              {mode === 'register' ? 'Join the crew' : 'Welcome back'}
            </h2>

            {/* Bullet Points List */}
            <ul className="space-y-4 pt-2">
              {activeBullets.map((point, index) => (
                <li key={index} className="flex items-start gap-3 text-xs xl:text-sm font-bold text-white leading-snug">
                  <div className="size-5 rounded-full bg-white text-[#F95700] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <CheckCircle2 className="size-3.5 stroke-[3] fill-current" />
                  </div>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 space-y-6 pt-6">
            {/* Switch Mode Button */}
            {mode === 'register' ? (
              <button
                type="button"
                onClick={() => toggleMode('login')}
                className="border-2 border-white text-white font-extrabold text-xs px-5 py-2.5 rounded-full hover:bg-white/15 transition-all duration-200 flex items-center gap-2 cursor-pointer w-fit shadow-xs"
              >
                Sign In
                <ArrowRight className="size-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => toggleMode('register')}
                className="border-2 border-white text-white font-extrabold text-xs px-5 py-2.5 rounded-full hover:bg-white/15 transition-all duration-200 flex items-center gap-2 cursor-pointer w-fit shadow-xs"
              >
                Create Account
                <ArrowRight className="size-3.5 stroke-[2.5]" />
              </button>
            )}

            {/* Bottom Quote */}
            <p className="text-xs text-white/90 italic font-medium border-t border-white/20 pt-4">
              &ldquo;Direct factory trade with zero forex risk.&rdquo;
            </p>
          </div>
        </div>

        {/* Right Column: White Form Panel */}
        <div className="p-8 xl:p-10 flex flex-col justify-between bg-white dark:bg-[#0D1527] space-y-6">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="transition-transform hover:scale-105">
              <Logo tone="default" />
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="border border-emerald-400/80 text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 font-bold text-xs px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                Instant Access
              </div>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1">
            <h1 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              {mode === 'register' ? 'Create Buyer Account' : 'Sign In to Lumo'}
            </h1>
            <p className="text-xs xl:text-sm font-medium text-[#64748B] dark:text-slate-400">
              {mode === 'register'
                ? 'Shop globally, request sourcing, and track deliveries with instant customer access.'
                : 'Sign in to manage orders, quotations & logistics with zero forex surcharge.'}
            </p>
          </div>

          {/* Form Component */}
          <div>
            {mode === 'register' ? <SignUpForm /> : <SignInForm />}
          </div>

          {/* Desktop Footer Status Bar */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4 stroke-[2.5]" />
              <span>Instant Access after OTP verification</span>
            </div>
            <span className="text-slate-400 text-xs font-medium">v1.0</span>
          </div>

        </div>

      </div>

    </div>
  )
}
