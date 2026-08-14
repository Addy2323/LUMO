'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, ArrowRight, Loader2, CheckCircle2, ShieldAlert, Check } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isMinLength = newPassword.length >= 12
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasLower = /[a-z]/.test(newPassword)
  const hasNumber = /\d/.test(newPassword)
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword)
  const matches = newPassword.length > 0 && newPassword === confirmPassword

  const isValidPassword = isMinLength && hasUpper && hasNumber && matches

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidPassword) {
      setError('Please fulfill all password requirements before submitting.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/password-recovery/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })

      let data: any = {}
      try {
        const text = await res.text()
        if (text) data = JSON.parse(text)
      } catch {}

      if (!res.ok) throw new Error(data.error || `Password reset failed (${res.status}). Please try again.`)

      setSuccessMessage(data.message || 'Password reset successfully. Redirecting to sign in...')

      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Password reset failed.')
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
              <Lock className="size-6 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Set New Password
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Create a new secure password for your Lumo Commerce account.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-xs font-bold text-red-600 dark:text-red-400 text-center flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage ? (
            <div className="py-6 text-center space-y-3 animate-in fade-in">
              <div className="mx-auto size-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="size-8 stroke-[2.5]" />
              </div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {successMessage}
              </p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  New Password (Min 12 Characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#F95700] focus:ring-2 focus:ring-[#F95700]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#F95700] focus:ring-2 focus:ring-[#F95700]/30"
                />
              </div>

              {/* Password Checklist */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3.5 space-y-2 border border-slate-100 dark:border-slate-800 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div className={`size-4 rounded-full flex items-center justify-center shrink-0 ${isMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    <Check className="size-2.5 stroke-[3]" />
                  </div>
                  <span className={isMinLength ? 'text-slate-900 dark:text-slate-200 font-bold' : 'text-slate-400'}>
                    At least 12 characters
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`size-4 rounded-full flex items-center justify-center shrink-0 ${hasUpper && hasNumber ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    <Check className="size-2.5 stroke-[3]" />
                  </div>
                  <span className={hasUpper && hasNumber ? 'text-slate-900 dark:text-slate-200 font-bold' : 'text-slate-400'}>
                    Contains uppercase letter &amp; number
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`size-4 rounded-full flex items-center justify-center shrink-0 ${matches ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    <Check className="size-2.5 stroke-[3]" />
                  </div>
                  <span className={matches ? 'text-slate-900 dark:text-slate-200 font-bold' : 'text-slate-400'}>
                    Passwords match
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !isValidPassword}
                className="w-full h-11 bg-[#F95700] hover:bg-[#e04f00] text-white font-extrabold rounded-xl shadow-md gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password &amp; Sign In</span>
                    <ArrowRight className="size-4 stroke-[2.5]" />
                  </>
                )}
              </Button>
            </form>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-md py-4 text-center text-xs font-semibold text-slate-400">
        Protected by Lumo Auth Engine
      </footer>
    </div>
  )
}
