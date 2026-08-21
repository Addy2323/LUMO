'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Droplet,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Lock,
  Mail,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
  Truck,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLogisticsIllustration } from '@/components/auth/auth-logistics-illustration'
import { OtpInput } from '@/components/auth/otp-input'
import { maskPhoneNumber } from '@/lib/sms/phone-normalizer'
import { useSessionStore } from '@/lib/stores/session-store'

interface SplitRegisterCardProps {
  initialRole?: 'CUSTOMER' | 'SUPPLIER' | 'LOGISTICS'
}

type ThemeMode = 'dark' | 'light-blue' | 'light'

export function SplitRegisterCard({ initialRole = 'CUSTOMER' }: SplitRegisterCardProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'SUPPLIER' | 'LOGISTICS'>(initialRole)

  useEffect(() => {
    setMounted(true)
  }, [])

  const themeMode: ThemeMode = (mounted && theme ? (theme as ThemeMode) : 'dark')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '+255',
    password: '',
    confirmPassword: '',
    companyName: '',
    acceptTerms: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [maskedPhone, setMaskedPhone] = useState<string>('')
  const [challengeId, setChallengeId] = useState<string | undefined>(undefined)
  const [isVerified, setIsVerified] = useState(false)

  // Countdown timer effect
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResendOtp = async () => {
    if (cooldown > 0 || loading || isVerified) return
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'New verification code sent to your phone.')
        if (data.maskedPhone) setMaskedPhone(data.maskedPhone)
        if (data.challengeId) setChallengeId(data.challengeId)
        setCooldown(data.resendCooldownSeconds || 60)
      } else {
        setError(data.error || 'Failed to resend verification code.')
      }
    } catch {
      setError('Failed to resend verification code. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submittedAppInfo, setSubmittedAppInfo] = useState<{
    name: string
    companyName: string
    email: string
    role: 'SUPPLIER' | 'LOGISTICS'
    appId: string
  } | null>(null)

  const features = [
    'Direct factory trade with zero forex risk.',
    'Skip the middlemen. Source direct from factory floor.',
    'One account. Every supplier from China to Dubai.',
    'Verified suppliers. Transparent pricing. No surprises.',
    'Your global supply chain, built from Dar es Salaam.',
  ]

  const handleRoleSelect = (role: 'CUSTOMER' | 'SUPPLIER' | 'LOGISTICS') => {
    setSelectedRole(role)
    setError(null)
    setSuccessMsg(null)
    const targetPath =
      role === 'SUPPLIER'
        ? '/register/supplier'
        : role === 'LOGISTICS'
          ? '/register/logistics'
          : '/register/buyer'
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      router.push(targetPath)
    }
  }

  const handleNavigateHome = () => {
    setShowSuccessModal(false)
    router.push('/')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      return
    }

    if (!formData.acceptTerms) {
      setError('You must agree to the Lumo terms and privacy policy.')
      return
    }

    setLoading(true)

    try {
      let res: Response

      if (selectedRole === 'CUSTOMER') {
        res = await fetch('/api/auth/register/buyer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            preferredLanguage: 'en',
            acceptTerms: formData.acceptTerms,
            acceptPrivacy: formData.acceptTerms,
          }),
        })
      } else {
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            companyName: formData.companyName || formData.name,
            role: selectedRole === 'SUPPLIER' ? 'SUPPLIER' : 'LOGISTICS',
          }),
        })
      }

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please check your details.')
        setLoading(false)
        return
      }

      if (selectedRole === 'CUSTOMER') {
        setSuccessMsg(data.message || 'Account created! Please enter the 6-digit code sent to your phone.')
        setMaskedPhone(data.maskedPhone || maskPhoneNumber(formData.phone))
        setChallengeId(data.challengeId)
        setStep('verify')
        setCooldown(data.resendCooldownSeconds || 60)
      } else {
        const generatedAppId = `APP-${Math.floor(100000 + Math.random() * 900000)}`
        setSubmittedAppInfo({
          name: formData.name,
          companyName: formData.companyName || formData.name,
          email: formData.email,
          role: selectedRole as 'SUPPLIER' | 'LOGISTICS',
          appId: generatedAppId,
        })
        setShowSuccessModal(true)
      }
    } catch (err: unknown) {
      console.error('[REGISTRATION SUBMISSION ERROR]', err)
      setError('A network error occurred. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const executeVerifyOtp = async (codeToVerify: string) => {
    if (loading || isVerified) return
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.phone || formData.email,
          code: codeToVerify,
          challengeId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid or expired verification code.')
        setLoading(false)
        return
      }

      if (data.user) {
        useSessionStore.getState().signIn({
          id: data.user.id,
          fullName: data.user.name || formData.name,
          email: data.user.email || formData.email,
          phone: data.user.phone || formData.phone,
          role: (data.user.role || 'customer').toLowerCase() as any,
          activeRole: (data.user.role || 'customer').toLowerCase() as any,
          verified: true,
          avatarUrl: null,
        })
      }

      setIsVerified(true)
      setLoading(false)

      setTimeout(() => {
        const targetPath = data.redirect || '/account'
        window.location.href = targetPath
      }, 1200)
    } catch {
      setError('Verification failed. Please check connection.')
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length === 6) {
      await executeVerifyOtp(otp)
    }
  }

  const handleVerifyOtpAuto = async (completedCode: string) => {
    if (completedCode.length === 6) {
      await executeVerifyOtp(completedCode)
    }
  }

  const pageBgClass =
    themeMode === 'dark'
      ? 'bg-[#090D16] text-white'
      : themeMode === 'light-blue'
        ? 'bg-[#EBF3FA] text-[#0B1F3A]'
        : 'bg-[#FAF8F5] text-[#0F172A]'

  const rightPanelBgClass =
    themeMode === 'dark'
      ? 'bg-[#0D1527] border-[#1E2B3E]'
      : themeMode === 'light-blue'
        ? 'bg-[#F0F6FC] border-[#CBD5E1]'
        : 'bg-white border-slate-200'

  const inputBgClass =
    themeMode === 'dark'
      ? 'bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-500 focus:border-[#F97316]'
      : 'bg-[#F0F5FD] border-[#DCE7F5] text-[#0F172A] placeholder:text-slate-400 focus:border-[#F97316]'

  const textHeadingClass =
    themeMode === 'dark' ? 'text-white' : 'text-[#0F172A]'

  const textSubtitleClass =
    themeMode === 'dark' ? 'text-slate-400' : 'text-[#64748B]'

  const labelClass =
    themeMode === 'dark' ? 'text-slate-300' : 'text-[#0F172A] font-extrabold'

  return (
    <div className={`min-h-dvh min-h-svh ${pageBgClass} flex items-center justify-center p-3 sm:p-4 lg:p-6 pb-[env(safe-area-inset-bottom)] relative overflow-hidden transition-colors duration-300 antialiased selection:bg-primary selection:text-white`}>
      
      {/* Decorative Logistics Illustration at bottom of page */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-100/70 via-orange-50/30 to-transparent dark:from-orange-950/30 dark:via-transparent" />
        <AuthLogisticsIllustration className="relative h-[140px] sm:h-[180px] lg:h-[220px] w-full text-[#FF9A5C]/40 dark:text-orange-400/25" />
      </div>

      {/* Main Split Card Container */}
      <div
        className={`relative z-10 w-full max-w-4xl rounded-2xl sm:rounded-3xl border ${rightPanelBgClass} shadow-xl shadow-slate-200/50 dark:shadow-black/50 grid grid-cols-1 lg:grid-cols-12 overflow-hidden my-auto transition-all duration-300`}
      >
        {/* LEFT PANEL: Orange Hero Banner (Hidden on Mobile < lg, Only Displayed on Desktop ≥ lg) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-primary via-[#F97316] to-[#EA580C] p-6 lg:p-8 flex-col justify-between text-white relative overflow-hidden">
          {/* Top Section */}
          <div className="space-y-4">
            {/* Pill Badge */}
            <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-extrabold text-[10px] tracking-wider uppercase">
              LUMO ECOSYSTEM
            </div>

            {/* Headline */}
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Join the crew
            </h2>

            {/* Bullet Feature List */}
            <ul className="space-y-3 pt-1">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <div className="size-4.5 rounded-full bg-white text-[#F97316] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-white/95 leading-snug">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* Sign In Pill Button */}
            <div className="pt-2">
              <Link href="/login">
                <button className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-full border-2 border-white text-white font-extrabold text-xs hover:bg-white hover:text-[#F97316] transition-all shadow-xs cursor-pointer">
                  Sign In
                  <ArrowRight className="size-3.5" />
                </button>
              </Link>
            </div>
          </div>

          {/* Bottom Footer Quote */}
          <div className="pt-3 border-t border-white/20 mt-4">
            <p className="text-[11px] italic text-white/85 font-medium">
              &quot;Direct factory trade with zero forex risk.&quot;
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: Registration Form (Full Width on Mobile, 7 cols on lg) */}
        <div className={`lg:col-span-7 col-span-1 p-5 sm:p-6 lg:p-7 ${rightPanelBgClass} flex flex-col justify-between transition-colors duration-300`}>
          {/* Top Section */}
          <div>
            {/* Header Row with Brand & Theme Switcher */}
            <div className="flex items-center justify-between mb-3">
              {/* Lumo Brand Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-[#F97316] text-white flex items-center justify-center font-black text-xs">
                  L
                </div>
                <span className={`font-extrabold text-base tracking-tight ${textHeadingClass}`}>Lumo</span>
              </Link>

              {/* Theme Switcher */}
              <div className="flex items-center gap-1 p-0.5 rounded-full bg-slate-800/20 border border-slate-700/30">
                <button
                  type="button"
                  title="Dark Mode"
                  onClick={() => setTheme('dark')}
                  className={`size-6 rounded-full flex items-center justify-center transition-all ${
                    themeMode === 'dark'
                      ? 'bg-[#0D1527] text-white shadow-xs border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Moon className="size-3" />
                </button>
                <button
                  type="button"
                  title="Light Mode"
                  onClick={() => setTheme('light')}
                  className={`size-6 rounded-full flex items-center justify-center transition-all ${
                    themeMode === 'light'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Sun className="size-3" />
                </button>
              </div>

              {/* Access Badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  selectedRole === 'CUSTOMER'
                    ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                    : selectedRole === 'SUPPLIER'
                      ? 'border-blue-500/40 text-blue-500 bg-blue-500/10'
                      : 'border-teal-500/40 text-teal-500 bg-teal-500/10'
                }`}
              >
                {selectedRole === 'CUSTOMER' ? 'Instant Access' : 'Application Review'}
              </span>
            </div>

            {/* Dynamic Form Title & Subtitle */}
            <h3 className={`text-xl font-extrabold tracking-tight ${textHeadingClass}`}>
              {selectedRole === 'CUSTOMER'
                ? 'Create Buyer Account'
                : selectedRole === 'SUPPLIER'
                  ? 'Apply as Supplier'
                  : 'Apply for Logistics'}
            </h3>
            <p className={`text-xs mt-0.5 mb-3 ${textSubtitleClass}`}>
              {selectedRole === 'CUSTOMER'
                ? 'Shop globally, request sourcing, and track deliveries with instant customer access.'
                : selectedRole === 'SUPPLIER'
                  ? 'Submit your supplier application to list products and sell on Lumo Commerce.'
                  : 'Submit your logistics partner application for freight and fulfillment operations.'}
            </p>

            {/* Role Selector Pills */}
            <div className="mb-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${textSubtitleClass}`}>
                SELECT ACCOUNT TYPE
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('CUSTOMER')}
                  className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'CUSTOMER'
                      ? 'border-primary bg-lumo-orange-light text-primary shadow-xs'
                      : 'border-[#DCE7F5] bg-[#F0F5FD] dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <User className="size-3.5 text-primary" />
                  <span>Buyer</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('SUPPLIER')}
                  className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'SUPPLIER'
                      ? 'border-primary bg-lumo-orange-light text-primary shadow-xs'
                      : 'border-[#DCE7F5] bg-[#F0F5FD] dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Building2 className="size-3.5 text-blue-600" />
                  <span>Supplier</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('LOGISTICS')}
                  className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'LOGISTICS'
                      ? 'border-primary bg-lumo-orange-light text-primary shadow-xs'
                      : 'border-[#DCE7F5] bg-[#F0F5FD] dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Truck className="size-3.5 text-teal-600" />
                  <span>Logistics</span>
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {successMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
                <CheckCircle2 className="size-3.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Registration Form / OTP Step */}
            {step === 'form' ? (
              <form onSubmit={handleRegister} className="space-y-2.5">
                {/* Full Name */}
                <div>
                  <Label className={`text-[11px] font-semibold mb-0.5 block ${labelClass}`}>Full Name</Label>
                  <div className="relative">
                    <User className="size-3.5 absolute left-3 top-3 text-slate-400" />
                    <Input
                      type="text"
                      required
                      placeholder="Amina Hassan"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`pl-9 h-10 text-xs rounded-xl font-semibold ${inputBgClass}`}
                    />
                  </div>
                </div>

                {/* Company / Business Name for Supplier or Logistics */}
                {selectedRole !== 'CUSTOMER' && (
                  <div>
                    <Label className={`text-[11px] font-semibold mb-0.5 block ${labelClass}`}>
                      {selectedRole === 'SUPPLIER' ? 'Company / Business Name' : 'Company / Fleet Name'}
                    </Label>
                    <div className="relative">
                      <FileText className="size-3.5 absolute left-3 top-3 text-slate-400" />
                      <Input
                        type="text"
                        required
                        placeholder={
                          selectedRole === 'SUPPLIER' ? 'e.g. Swahili Traders Ltd' : 'e.g. Dar Freight Logistics'
                        }
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className={`pl-9 h-10 text-xs rounded-xl font-semibold ${inputBgClass}`}
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <Label className={`text-[11px] font-semibold mb-0.5 block ${labelClass}`}>Email Address</Label>
                  <div className="relative">
                    <Mail className="size-3.5 absolute left-3 top-3 text-slate-400" />
                    <Input
                      type="email"
                      required
                      placeholder="you@example.co.tz"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`pl-9 h-10 text-xs rounded-xl font-semibold ${inputBgClass}`}
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <Label className={`text-[11px] font-semibold mb-0.5 block ${labelClass}`}>Phone Number</Label>
                  <div className="relative">
                    <Phone className="size-3.5 absolute left-3 top-3 text-slate-400" />
                    <Input
                      type="tel"
                      required
                      placeholder="+255 712 345 678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`pl-9 h-10 text-xs rounded-xl font-semibold ${inputBgClass}`}
                    />
                  </div>
                </div>

                {/* Password with Eye Toggle */}
                <div>
                  <Label className={`text-[11px] font-semibold mb-0.5 block ${labelClass}`}>Password</Label>
                  <div className="relative">
                    <Lock className="size-3.5 absolute left-3 top-3 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 8 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`pl-9 pr-9 h-10 text-xs rounded-xl font-semibold ${inputBgClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password with Eye Toggle */}
                <div>
                  <Label className={`text-[11px] font-semibold mb-0.5 block ${labelClass}`}>Confirm password</Label>
                  <div className="relative">
                    <Lock className="size-3.5 absolute left-3 top-3 text-slate-400" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`pl-9 pr-9 h-10 text-xs rounded-xl font-semibold ${inputBgClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="pt-0.5">
                  <label className={`flex items-center gap-2 cursor-pointer text-[11px] ${textSubtitleClass}`}>
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span>
                      I agree to the Lumo{' '}
                      <Link href="/terms" target="_blank" className="text-primary font-bold hover:underline">
                        terms
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" target="_blank" className="text-primary font-bold hover:underline">
                        privacy
                      </Link>
                      .
                    </span>
                  </label>
                </div>

                {/* Primary Action Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-[#E04E00] text-white font-extrabold h-11 text-xs rounded-xl mt-2 transition-all shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  {loading
                    ? 'Processing...'
                    : selectedRole === 'CUSTOMER'
                      ? 'Create Account'
                      : selectedRole === 'SUPPLIER'
                        ? 'Apply as Supplier'
                        : 'Apply for Logistics'}
                </Button>

                {/* Sign In Link for Mobile & Desktop */}
                <div className="pt-2 text-center text-xs font-semibold text-[#64748B] dark:text-slate-400">
                  Already registered?{' '}
                  <Link href="/login" className="font-extrabold text-primary hover:underline cursor-pointer ml-1">
                    Sign in
                  </Link>
                </div>
              </form>
            ) : (
              /* OTP Step for Customer */
              <form onSubmit={handleVerifyOtp} className="space-y-4 py-2">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Enter Verification Code
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Verification code sent to{' '}
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {maskedPhone || maskPhoneNumber(formData.phone)}
                    </strong>
                  </p>
                </div>

                <div className="py-2 flex flex-col items-center">
                  <OtpInput
                    length={6}
                    value={otp}
                    onChange={(val) => {
                      setOtp(val)
                      setError(null)
                    }}
                    onComplete={(val) => {
                      setOtp(val)
                      // Auto-submit when 6 digits are typed
                      handleVerifyOtpAuto(val)
                    }}
                    disabled={loading || isVerified}
                    error={!!error}
                    isVerified={isVerified}
                    isVerifying={loading}
                  />
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-fade-in">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {isVerified && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Phone verified! Redirecting to marketplace...</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || otp.length < 6 || isVerified}
                  className="w-full bg-primary hover:bg-[#E04E00] text-white font-extrabold h-11 text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isVerified ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 animate-bounce" /> Verified!
                    </span>
                  ) : loading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...
                    </span>
                  ) : (
                    'Verify & Activate Account'
                  )}
                </Button>

                {/* Countdown & Resend Section */}
                <div className="text-center pt-2 space-y-1.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {cooldown > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        Resend code in <strong className="text-slate-900 dark:text-white font-mono">00:{cooldown < 10 ? `0${cooldown}` : cooldown}</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading || isVerified}
                        className="text-xs font-extrabold text-primary hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        Didn&apos;t receive code? Resend SMS OTP
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep('form')
                    setError(null)
                  }}
                  disabled={loading || isVerified}
                  className={`w-full text-xs text-center mt-1 hover:underline cursor-pointer ${textSubtitleClass}`}
                >
                  ← Edit registration details
                </button>
              </form>
            )}
          </div>

          {/* Footer Security & Compliance Note */}
          <div className={`mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] ${textSubtitleClass}`}>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              {selectedRole === 'CUSTOMER'
                ? 'Instant Access after OTP verification'
                : 'Application subject to admin review'}
            </span>
            <span>v1.0</span>
          </div>
        </div>
      </div>

      {/* Application Under Review Modal */}
      {showSuccessModal && submittedAppInfo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center flex flex-col items-center gap-5">
            <div className="relative">
              <div className="size-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 shadow-lg">
                <CheckCircle2 className="size-9 stroke-[2.5]" />
              </div>
              <span className="absolute -top-1 -right-1 text-xl">🎉</span>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-extrabold text-[11px] tracking-wider uppercase border border-emerald-500/30">
                APPLICATION UNDER REVIEW
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Congratulations, {submittedAppInfo.name}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md font-medium leading-relaxed">
                Your <span className="font-extrabold text-primary">{submittedAppInfo.role === 'SUPPLIER' ? 'Supplier Partner' : 'Logistics Partner'}</span> application has been successfully submitted and is under active review by the Lumo Operations Team.
              </p>
            </div>

            <div className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Application Reference</span>
                <span className="font-mono font-bold text-primary bg-lumo-orange-light px-2 py-0.5 rounded text-[11px]">
                  {submittedAppInfo.appId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Business / Company</span>
                <span className="font-bold text-slate-900 dark:text-white">{submittedAppInfo.companyName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Contact Email</span>
                <span className="font-medium text-slate-900 dark:text-white">{submittedAppInfo.email}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Review Status</span>
                <span className="inline-flex items-center gap-1.5 text-amber-500 font-bold text-[11px]">
                  <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                  Pending Verification (24-48 hrs)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleNavigateHome}
                className="flex-1 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs h-11 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleNavigateHome}
                className="flex-1 bg-primary hover:bg-[#E04E00] text-white font-extrabold text-xs h-11 rounded-xl shadow-md transition-transform active:scale-[0.98]"
              >
                OK (Go to Home)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
