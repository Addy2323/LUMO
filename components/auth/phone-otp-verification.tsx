'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ShieldCheck, ArrowRight, Loader2, RefreshCw, Smartphone, Globe } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { OtpInput } from '@/components/auth/otp-input'
import { ThemeToggle } from '@/components/theme-toggle'
import { AuthLogisticsIllustration } from '@/components/auth/auth-logistics-illustration'
import { AUTH_TRANSLATIONS, AuthLanguage } from '@/lib/i18n/auth-translations'

interface PhoneOtpVerificationProps {
  initialPhone?: string
}

export function PhoneOtpVerification({ initialPhone }: PhoneOtpVerificationProps) {
  const router = useRouter()
  const [lang, setLang] = useState<AuthLanguage>('en')
  const t = AUTH_TRANSLATIONS[lang]

  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [cooldown, setCooldown] = useState(60)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function handleVerify(codeToSubmit?: string) {
    const code = codeToSubmit || otpCode
    if (code.length !== 6) {
      setError(t.invalidCode)
      return
    }

    setVerifying(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/phone-verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || t.invalidCode)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (err: any) {
      setError(err.message || t.invalidCode)
    } finally {
      setVerifying(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0 || loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/phone-verification/resend', {
        method: 'POST',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP')

      setCooldown(data.resendCooldownSeconds || 60)
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh min-h-svh w-full flex-col justify-between p-4 sm:p-6 lg:p-8 pb-[env(safe-area-inset-bottom)] antialiased bg-[#FAF8F5] dark:bg-[#090D16] text-[#0F172A] dark:text-slate-100 transition-colors duration-300">
      
      {/* Background Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] dark:bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none z-0" />

      {/* Header bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between py-2">
        <Link href="/">
          <Logo tone="default" />
        </Link>

        <div className="flex items-center gap-3">
          {/* i18n Language Toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Globe className="size-3.5 text-primary" />
            <span>{lang === 'en' ? 'Swahili' : 'English'}</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 my-auto mx-auto w-full max-w-md lg:max-w-5xl py-6">
        
        {/* Responsive Dual-Column on Desktop (≥ lg) */}
        <div className="hidden lg:grid grid-cols-[400px_1fr] rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden min-h-[500px]">
          
          {/* Left Hero Column */}
          <div className="bg-primary p-10 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="space-y-6">
              <div className="border border-white/40 bg-white/10 text-white font-extrabold text-[10px] tracking-wider uppercase px-3.5 py-1 rounded-full w-fit backdrop-blur-xs">
                PHONE VERIFICATION
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
                {t.verifyPhoneTitle}
              </h2>
              <p className="text-xs font-medium text-white/90 leading-relaxed">
                Security verification guarantees direct trade access, landed cost calculation, and authentic quotation processing.
              </p>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/20">
              <div className="flex items-center gap-3 text-xs font-bold">
                <CheckCircle2 className="size-4 shrink-0 text-white" />
                <span>Anti-abuse brute force protection</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <CheckCircle2 className="size-4 shrink-0 text-white" />
                <span>Single-use encrypted OTP challenge</span>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {t.verifyPhoneTitle}
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.verifyPhoneSubtitle} <span className="font-extrabold text-slate-900 dark:text-white">{initialPhone || 'your phone number'}</span>
              </p>
            </div>

            {/* Success State */}
            {success ? (
              <div className="my-auto space-y-4 py-8 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="mx-auto size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-8 ring-emerald-50 dark:ring-emerald-950/30">
                  <CheckCircle2 className="size-10 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {t.verificationSuccess}
                </h3>
              </div>
            ) : (
              <div className="space-y-6">
                <OtpInput
                  length={6}
                  value={otpCode}
                  onChange={setOtpCode}
                  onComplete={(code) => handleVerify(code)}
                  disabled={verifying}
                  error={!!error}
                />

                {error && (
                  <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-xs font-bold text-red-600 dark:text-red-400 text-center animate-shake">
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => handleVerify()}
                  disabled={verifying || otpCode.length !== 6}
                  className="w-full h-12 bg-primary hover:bg-[#e04f00] text-white font-extrabold rounded-xl shadow-md gap-2 cursor-pointer"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{t.verifying}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.verifyButton}</span>
                      <ArrowRight className="size-4 stroke-[2.5]" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between pt-2 text-xs font-semibold text-slate-500">
                  <span>{t.resendPrompt}</span>
                  {cooldown > 0 ? (
                    <span className="text-slate-400 font-medium">
                      {t.resendCooldown.replace('{seconds}', String(cooldown))}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="font-extrabold text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="size-3" />
                      <span>{t.resendButton}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
              <ShieldCheck className="size-4 text-emerald-500" />
              <span>Protected by Lumo Auth Abuse Engine</span>
            </div>
          </div>
        </div>

        {/* Mobile Single Card Layout (< lg) */}
        <div className="w-full lg:hidden rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-6">
          <div className="space-y-2 text-center">
            <div className="mx-auto size-12 rounded-full bg-orange-50 dark:bg-orange-950/40 text-primary flex items-center justify-center">
              <Smartphone className="size-6 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {t.verifyPhoneTitle}
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.verifyPhoneSubtitle} <span className="font-extrabold text-slate-900 dark:text-white">{initialPhone || 'your phone'}</span>
            </p>
          </div>

          {success ? (
            <div className="py-6 text-center space-y-3">
              <div className="mx-auto size-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="size-8 stroke-[2.5]" />
              </div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {t.verificationSuccess}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <OtpInput
                length={6}
                value={otpCode}
                onChange={setOtpCode}
                onComplete={(code) => handleVerify(code)}
                disabled={verifying}
                error={!!error}
              />

              {error && (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 text-center">
                  {error}
                </p>
              )}

              <Button
                onClick={() => handleVerify()}
                disabled={verifying || otpCode.length !== 6}
                className="w-full h-11 bg-primary hover:bg-[#e04f00] text-white font-extrabold rounded-xl shadow-md cursor-pointer"
              >
                {verifying ? t.verifying : t.verifyButton}
              </Button>

              <div className="text-center text-xs font-semibold text-slate-500">
                {cooldown > 0 ? (
                  <span>{t.resendCooldown.replace('{seconds}', String(cooldown))}</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="font-extrabold text-primary hover:underline cursor-pointer ml-1"
                  >
                    {t.resendButton}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Decorative Logistics Illustration Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-5xl pt-4 text-center text-xs font-medium text-slate-400">
        <AuthLogisticsIllustration className="mx-auto h-[100px] w-full text-orange-400/20" />
      </footer>
    </div>
  )
}
