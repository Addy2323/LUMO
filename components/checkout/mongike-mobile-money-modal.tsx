'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  X,
  RefreshCw,
  ArrowRight,
  Lock,
  ChevronRight,
  Zap,
} from 'lucide-react'

export interface MongikeMobileMoneyModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
  amountTZS: number
  defaultPhone?: string
  onSuccess?: () => void
}

export type PaymentState =
  | 'READY'
  | 'SENDING_REQUEST'
  | 'AWAITING_PHONE_CONFIRMATION'
  | 'VERIFYING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'

type CarrierType = 'MPESA' | 'TIGO' | 'AIRTEL' | 'HALOPESA' | 'UNKNOWN'

interface CarrierConfig {
  id: CarrierType
  name: string
  prefixExamples: string
  color: string
  activeBg: string
  activeBorder: string
  activeText: string
}

const CARRIERS: CarrierConfig[] = [
  {
    id: 'MPESA',
    name: 'M-Pesa',
    prefixExamples: '074, 075, 076',
    color: '#E60000',
    activeBg: 'bg-red-500/20',
    activeBorder: 'border-red-500/60',
    activeText: 'text-red-400',
  },
  {
    id: 'TIGO',
    name: 'Tigo Pesa',
    prefixExamples: '071, 065, 067, 077',
    color: '#00377B',
    activeBg: 'bg-sky-500/20',
    activeBorder: 'border-sky-500/60',
    activeText: 'text-sky-400',
  },
  {
    id: 'AIRTEL',
    name: 'Airtel Money',
    prefixExamples: '068, 069, 078',
    color: '#ED1C24',
    activeBg: 'bg-rose-500/20',
    activeBorder: 'border-rose-500/60',
    activeText: 'text-rose-400',
  },
  {
    id: 'HALOPESA',
    name: 'HaloPesa',
    prefixExamples: '062, 061',
    color: '#FF6B00',
    activeBg: 'bg-amber-500/20',
    activeBorder: 'border-amber-500/60',
    activeText: 'text-amber-400',
  },
]

/**
 * Normalizes user input into a clean 9-digit Tanzanian local number (e.g. 768828247)
 * Automatically strips +255, 255, leading 0, and non-digits.
 */
function sanitizeTanzanianPhone(input: string): string {
  let cleaned = input.replace(/\D/g, '')

  if (cleaned.startsWith('255')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1)
  }

  // Cap at 9 digits
  return cleaned.slice(0, 9)
}

/**
 * Formats a 9-digit number as "768 828 247"
 */
function formatPhoneDisplay(rawDigits: string): string {
  if (!rawDigits) return ''
  const part1 = rawDigits.slice(0, 3)
  const part2 = rawDigits.slice(3, 6)
  const part3 = rawDigits.slice(6, 9)

  if (rawDigits.length <= 3) return part1
  if (rawDigits.length <= 6) return `${part1} ${part2}`
  return `${part1} ${part2} ${part3}`
}

/**
 * Identifies Tanzanian telecom carrier from 9-digit phone number
 */
function detectCarrier(rawDigits: string): CarrierType {
  if (rawDigits.length < 2) return 'UNKNOWN'
  const prefix2 = rawDigits.slice(0, 2)

  // Vodacom M-Pesa: 74x, 75x, 76x
  if (['74', '75', '76'].includes(prefix2)) return 'MPESA'

  // Tigo Pesa: 71x, 65x, 67x, 77x
  if (['71', '65', '67', '77'].includes(prefix2)) return 'TIGO'

  // Airtel Money: 68x, 69x, 78x
  if (['68', '69', '78'].includes(prefix2)) return 'AIRTEL'

  // HaloPesa: 62x, 61x
  if (['62', '61'].includes(prefix2)) return 'HALOPESA'

  return 'UNKNOWN'
}

export function MongikeMobileMoneyModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amountTZS,
  defaultPhone = '',
  onSuccess,
}: MongikeMobileMoneyModalProps) {
  // Store raw 9-digit string (e.g. 768828247)
  const [rawPhone, setRawPhone] = useState<string>(() => sanitizeTanzanianPhone(defaultPhone))
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierType>('UNKNOWN')
  const [paymentState, setPaymentState] = useState<PaymentState>('READY')
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900) // 15 mins
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-detect carrier when phone changes
  const detectedCarrier = useMemo(() => detectCarrier(rawPhone), [rawPhone])

  useEffect(() => {
    if (detectedCarrier !== 'UNKNOWN') {
      setSelectedCarrier(detectedCarrier)
    }
  }, [detectedCarrier])

  // Sync default phone
  useEffect(() => {
    if (defaultPhone) {
      const sanitized = sanitizeTanzanianPhone(defaultPhone)
      setRawPhone(sanitized)
    }
  }, [defaultPhone])

  // Status Polling
  useEffect(() => {
    if ((paymentState === 'AWAITING_PHONE_CONFIRMATION' || paymentState === 'VERIFYING') && attemptId) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/mongike/status?attemptId=${attemptId}`)
          if (!res.ok) return

          const data = await res.json()

          if (data.status === 'SUCCEEDED' || data.orderStatus === 'PAID') {
            setPaymentState('PAID')
            clearInterval(pollingRef.current!)
            if (onSuccess) onSuccess()
          } else if (data.status === 'FAILED') {
            setPaymentState('FAILED')
            setErrorMessage(data.failureMessage || 'Payment authorization was declined or failed.')
            clearInterval(pollingRef.current!)
          } else if (data.status === 'EXPIRED') {
            setPaymentState('EXPIRED')
            setErrorMessage('Payment request expired. Please initiate a new payment request.')
            clearInterval(pollingRef.current!)
          }
        } catch (err) {
          console.error('[STATUS POLL ERROR]', err)
        }
      }, 3000)
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [paymentState, attemptId, onSuccess])

  // Countdown timer
  useEffect(() => {
    if (paymentState === 'AWAITING_PHONE_CONFIRMATION' || paymentState === 'VERIFYING') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setPaymentState('EXPIRED')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paymentState])

  if (!isOpen) return null

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeTanzanianPhone(e.target.value)
    setRawPhone(sanitized)
  }

  const handleInitiatePayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (rawPhone.length !== 9) {
      setErrorMessage('Please enter a valid 9-digit Tanzanian phone number (e.g. 768 828 247).')
      return
    }

    setPaymentState('SENDING_REQUEST')
    setErrorMessage(null)

    const fullPhoneNumber = `255${rawPhone}`

    try {
      const res = await fetch('/api/payments/mongike/mobile-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          buyerPhone: fullPhoneNumber,
          feePayer: 'MERCHANT',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.failureMessage || 'Failed to initiate mobile money payment.')
      }

      setAttemptId(data.paymentAttemptId)

      if (data.status === 'SUCCEEDED') {
        setPaymentState('PAID')
        if (onSuccess) onSuccess()
      } else if (data.status === 'FAILED') {
        setPaymentState('FAILED')
        setErrorMessage(data.error || data.failureMessage || 'Payment authorization was declined.')
      } else {
        setPaymentState('AWAITING_PHONE_CONFIRMATION')
        setSecondsRemaining(900)
      }
    } catch (err: any) {
      setPaymentState('FAILED')
      setErrorMessage(err.message || 'An unexpected network error occurred.')
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const formattedAmount = Number(amountTZS).toLocaleString('en-US')
  const isValidPhone = rawPhone.length === 9

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Card / Bottom Sheet on Mobile */}
      <div
        className="relative w-full max-w-lg bg-[#0B1728] text-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-brand-500/30 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-6 sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Bar Indicator */}
        <div className="sm:hidden w-full flex items-center justify-center pt-2 pb-1 bg-gradient-to-b from-[#112238] to-[#0B1728]">
          <div className="w-12 h-1 rounded-full bg-slate-600/70" />
        </div>

        {/* Header */}
        <div className="relative px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-[#0E1E34] via-[#162A48] to-[#0E1E34] border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 sm:size-11 bg-brand-500/20 border border-brand-500/40 rounded-2xl flex items-center justify-center text-brand-500 shadow-inner">
              <Smartphone className="size-5 sm:size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white tracking-tight">Tanzania Mobile Money</h3>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  INSTANT PUSH
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Order Ref: <span className="font-mono text-brand-500 font-bold">{orderNumber}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-full bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors touch-manipulation"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto overscroll-contain">
          {/* Supported Mobile Carriers Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Zap className="size-3.5 text-brand-500" /> Supported Tanzanian Networks:
              </span>
              {selectedCarrier !== 'UNKNOWN' && (
                <span className="text-[11px] font-bold text-emerald-400 font-mono">
                  ● {CARRIERS.find((c) => c.id === selectedCarrier)?.name} Detected
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {CARRIERS.map((carrier) => {
                const isActive = selectedCarrier === carrier.id
                return (
                  <button
                    key={carrier.id}
                    type="button"
                    onClick={() => setSelectedCarrier(carrier.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      isActive
                        ? `${carrier.activeBg} ${carrier.activeBorder} ${carrier.activeText} shadow-md scale-102 ring-1 ring-white/20`
                        : 'bg-[#13233A]/60 border-slate-800/80 text-slate-400 hover:bg-[#182C48] hover:text-slate-200'
                    }`}
                  >
                    <span className="text-[11px] sm:text-xs font-black tracking-tight leading-tight">
                      {carrier.name}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono hidden sm:block mt-0.5">
                      {carrier.prefixExamples.split(',')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* STATE 1: READY */}
          {paymentState === 'READY' && (
            <form onSubmit={handleInitiatePayment} className="space-y-5">
              {/* Pricing Breakdown Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#102035] to-[#0B1728] border border-slate-800 space-y-2.5 text-xs sm:text-sm shadow-inner">
                <div className="flex justify-between text-slate-400">
                  <span className="font-medium">Payable Amount:</span>
                  <span className="text-white font-mono font-bold text-sm sm:text-base">TZS {formattedAmount}</span>
                </div>
                <div className="flex justify-between text-slate-400 items-center">
                  <span className="font-medium">Transaction Fee:</span>
                  <span className="text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20 text-[11px]">
                    FREE (Covered by LUMO)
                  </span>
                </div>
                <div className="border-t border-slate-800/80 pt-2.5 flex justify-between items-center font-bold">
                  <span className="text-white text-sm sm:text-base">Total Charge:</span>
                  <span className="text-brand-500 font-mono text-lg sm:text-xl font-black">
                    TZS {formattedAmount}
                  </span>
                </div>
              </div>

              {/* Mobile Number Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-200">
                  Enter Tanzanian Mobile Number (9 Digits)
                </label>

                <div className="relative flex items-center rounded-2xl bg-[#13233A] border-2 border-slate-700/80 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30 transition-all shadow-inner overflow-hidden">
                  {/* TZ Prefix Badge */}
                  <div className="flex items-center gap-1.5 px-3.5 py-3.5 bg-[#0E1A2B] border-r border-slate-700/80 text-slate-300 shrink-0 select-none">
                    <span className="text-base" role="img" aria-label="Tanzania flag">🇹🇿</span>
                    <span className="font-mono text-xs sm:text-sm font-black tracking-wider text-slate-200">+255</span>
                  </div>

                  {/* Phone Input Box */}
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                    value={formatPhoneDisplay(rawPhone)}
                    onChange={handlePhoneChange}
                    placeholder="768 828 247"
                    className="w-full bg-transparent px-3.5 py-3 text-white font-mono text-base sm:text-lg font-bold tracking-wider placeholder:text-slate-500 placeholder:font-normal focus:outline-hidden"
                  />

                  {/* Valid Icon */}
                  {isValidPhone && (
                    <div className="pr-3 text-emerald-400 shrink-0 animate-in zoom-in-50">
                      <CheckCircle2 className="size-5" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <p className="flex items-center gap-1.5 text-slate-300">
                    <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
                    <span>A USSD PIN push will pop up automatically.</span>
                  </p>
                  <span className="font-mono font-bold text-slate-400">
                    {rawPhone.length}/9 digits
                  </span>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={!isValidPhone}
                className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wide text-white shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation active:scale-98 ${
                  isValidPhone
                    ? 'bg-brand-500 hover:bg-brand-600 hover:shadow-brand-500/25 hover:shadow-2xl'
                    : 'bg-slate-700/60 text-slate-400 cursor-not-allowed opacity-75'
                }`}
              >
                <span>Pay TZS {formattedAmount} Now</span>
                <ArrowRight className="size-5" />
              </button>
            </form>
          )}

          {/* STATE 2: SENDING_REQUEST */}
          {paymentState === 'SENDING_REQUEST' && (
            <div className="py-10 text-center space-y-4">
              <div className="relative size-16 mx-auto flex items-center justify-center">
                <Loader2 className="size-12 text-brand-500 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-lg text-white">Connecting to Mobile Gateway...</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Dispatching instant USSD authorization push to{' '}
                  <strong className="text-white font-mono">+255 {formatPhoneDisplay(rawPhone)}</strong>
                </p>
              </div>
            </div>
          )}

          {/* STATE 3 & 4: AWAITING_PHONE_CONFIRMATION / VERIFYING */}
          {(paymentState === 'AWAITING_PHONE_CONFIRMATION' || paymentState === 'VERIFYING') && (
            <div className="py-4 text-center space-y-5">
              {/* Pulse Phone Visual */}
              <div className="relative size-20 mx-auto">
                <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping" />
                <div className="relative size-20 bg-[#13233A] border-2 border-brand-500 rounded-full flex items-center justify-center text-brand-500 shadow-xl">
                  <Smartphone className="size-10 animate-bounce" />
                </div>
              </div>

              {/* Step by Step Instructions */}
              <div className="space-y-2">
                <h4 className="font-black text-xl text-white tracking-tight">Check Your Mobile Phone!</h4>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto">
                  A USSD payment prompt has been sent to{' '}
                  <span className="font-mono text-brand-500 font-black">+255 {formatPhoneDisplay(rawPhone)}</span>.
                </p>
              </div>

              {/* 3 Step Card */}
              <div className="p-3.5 rounded-2xl bg-[#102035] border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex items-center gap-2.5 text-slate-200">
                  <span className="size-5 rounded-full bg-brand-500/20 text-brand-500 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                  <span>Unlock your phone screen now</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <span className="size-5 rounded-full bg-brand-500/20 text-brand-500 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                  <span>Enter your secret Mobile Money PIN</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <span className="size-5 rounded-full bg-brand-500/20 text-brand-500 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                  <span>Confirm payment of <strong className="text-emerald-400 font-mono">TZS {formattedAmount}</strong></span>
                </div>
              </div>

              {/* Countdown badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-400">
                <Clock className="size-4 text-brand-500" />
                <span>Expires in <strong className="text-white font-black">{formatTime(secondsRemaining)}</strong></span>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentState('VERIFYING')}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="size-3.5 animate-spin text-brand-500" />
                  Listening for confirmation in real-time...
                </button>
              </div>
            </div>
          )}

          {/* STATE 5: PAID */}
          {paymentState === 'PAID' && (
            <div className="py-6 text-center space-y-5">
              <div className="size-16 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg animate-in zoom-in-75">
                <CheckCircle2 className="size-10" />
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-2xl text-white tracking-tight">Payment Verified!</h4>
                <p className="text-xs sm:text-sm text-slate-300">
                  Your payment of <span className="font-black text-emerald-400 font-mono">TZS {formattedAmount}</span> for Order #{orderNumber} has been received.
                </p>
              </div>

              <div className="p-4 bg-[#102035] rounded-2xl border border-slate-800 text-xs text-left space-y-2 text-slate-300">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Order Number:</span>
                  <span className="font-mono text-white font-bold">{orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gateway:</span>
                  <span className="text-emerald-400 font-medium">Mongike Mobile Money</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SMS Confirmation:</span>
                  <span className="text-emerald-400 font-medium">Dispatched via Meseji</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose()
                  window.location.href = `/orders/${orderNumber}`
                }}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                <span>Track Your Order</span>
                <ArrowRight className="size-5" />
              </button>
            </div>
          )}

          {/* STATE 6: FAILED */}
          {paymentState === 'FAILED' && (
            <div className="py-6 text-center space-y-5">
              <div className="size-16 bg-rose-500/20 border-2 border-rose-500 text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-lg animate-in zoom-in-75">
                <AlertCircle className="size-10" />
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-xl text-white">Payment Authorization Failed</h4>
                <p className="text-xs text-rose-300 max-w-xs mx-auto">
                  {errorMessage || 'The payment request was cancelled or declined on your phone.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPaymentState('READY')}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-black rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="size-4" />
                <span>Try Again</span>
              </button>
            </div>
          )}

          {/* STATE 7: EXPIRED */}
          {paymentState === 'EXPIRED' && (
            <div className="py-6 text-center space-y-5">
              <div className="size-16 bg-amber-500/20 border-2 border-amber-500 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Clock className="size-10" />
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-xl text-white">Payment Request Expired</h4>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  The authorization prompt timed out after 15 minutes. Please initiate a new payment push.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPaymentState('READY')}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-black rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="size-4" />
                <span>Resend Payment Request</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="px-4 py-3 bg-[#08111D] border-t border-slate-800 text-center text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-center gap-1.5 shrink-0">
          <Lock className="size-3.5 text-emerald-400" />
          <span>Protected by 256-bit Encrypted LUMO Trade Assurance &amp; Mongike Gateway</span>
        </div>
      </div>
    </div>
  )
}
