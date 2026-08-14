'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { KeyRound, ArrowLeft, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { OtpInput } from '@/components/auth/otp-input'
import { ThemeToggle } from '@/components/theme-toggle'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const [cooldown, setCooldown] = useState(0)

  // Countdown timer effect
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function handleRequestCode(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!phone || phone.trim().length < 9) {
      setError('Please enter a valid registered phone number.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/password-recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      let data: any = {}
      try {
        const text = await res.text()
        if (text) data = JSON.parse(text)
      } catch {}

      if (!res.ok) throw new Error(data.error || `Request failed (${res.status}). Please try again.`)

      setInfoMessage(data.message)
      setCooldown(data.resendCooldownSeconds || 60)
      setStep(2)
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(codeToSubmit?: string) {
    const code = codeToSubmit || otpCode
    if (code.length !== 6) {
      setError('Please enter the full 6-digit verification code.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/password-recovery/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })

      let data: any = {}
      try {
        const text = await res.text()
        if (text) data = JSON.parse(text)
      } catch {}

      if (!res.ok) throw new Error(data.error || `Verification failed (${res.status}). Please try again.`)

      router.push(data.redirect || '/auth/reset-password')
    } catch (err: any) {
      setError(err.message || 'Code verification failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh min-h-svh w-full flex-col justify-between p-4 sm:p-6 lg:p-8 antialiased bg-[#FAF8F5] dark:bg-[#090D16] text-[#0F172A] dark:text-slate-100 transition-colors duration-300">
      
      {/* Header */}
      <header className="mx-auto flex w-full max-w-md items-center justify-between py-2">
        <Link href="/">
          <Logo tone="default" />
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Card */}
      <main className="my-auto mx-auto w-full max-w-md py-6">
        <div className="rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
          
          <div className="space-y-2 text-center">
            <div className="mx-auto size-12 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#F95700] flex items-center justify-center">
              <KeyRound className="size-6 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {step === 1 ? 'Forgot Password' : 'Verify Reset Code'}
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {step === 1
                ? 'Enter your registered Tanzanian phone number to receive a 6-digit verification code.'
                : infoMessage || 'Enter the 6-digit verification code sent to your phone.'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-xs font-bold text-red-600 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Registered Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+255 7XX XXX XXX"
                  required
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#F95700] focus:ring-2 focus:ring-[#F95700]/30"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !phone}
                className="w-full h-11 bg-[#F95700] hover:bg-[#e04f00] text-white font-extrabold rounded-xl shadow-md gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="size-4 stroke-[2.5]" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-5">
              <OtpInput
                length={6}
                value={otpCode}
                onChange={setOtpCode}
                onComplete={(code) => handleVerifyCode(code)}
                disabled={loading}
                error={!!error}
              />

              <Button
                onClick={() => handleVerifyCode()}
                disabled={loading || otpCode.length !== 6}
                className="w-full h-11 bg-[#F95700] hover:bg-[#e04f00] text-white font-extrabold rounded-xl shadow-md gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code &amp; Continue</span>
                    <ArrowRight className="size-4 stroke-[2.5]" />
                  </>
                )}
              </Button>

              {/* Countdown & Resend Section */}
              <div className="text-center pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {cooldown > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      Resend code available in <strong className="text-slate-900 dark:text-white font-mono">{cooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestCode()}
                      disabled={loading}
                      className="text-xs font-extrabold text-[#F95700] hover:underline disabled:opacity-50"
                    >
                      Didn&apos;t receive code? Resend SMS OTP
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">
                  Code expires in 5 minutes
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#F95700] hover:underline"
            >
              <ArrowLeft className="size-3.5 stroke-[2.5]" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Security Footer */}
      <footer className="mx-auto w-full max-w-md py-4 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="size-4 text-emerald-500" />
        <span>Protected by Lumo Secure Auth Engine</span>
      </footer>
    </div>
  )
}
