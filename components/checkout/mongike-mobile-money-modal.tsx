'use client'

import React, { useState, useEffect, useRef } from 'react'
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

export function MongikeMobileMoneyModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amountTZS,
  defaultPhone = '',
  onSuccess,
}: MongikeMobileMoneyModalProps) {
  const [phone, setPhone] = useState(defaultPhone)
  const [paymentState, setPaymentState] = useState<PaymentState>('READY')
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900) // 15 mins
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-fill phone when defaultPhone changes
  useEffect(() => {
    if (defaultPhone) setPhone(defaultPhone)
  }, [defaultPhone])

  // Polling logic when in AWAITING_PHONE_CONFIRMATION or VERIFYING
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

  // Countdown timer logic
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

  const handleInitiatePayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setPaymentState('SENDING_REQUEST')
    setErrorMessage(null)

    try {
      const res = await fetch('/api/payments/mongike/mobile-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          buyerPhone: phone,
          feePayer: 'MERCHANT',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate mobile money payment.')
      }

      setAttemptId(data.paymentAttemptId)

      if (data.status === 'SUCCEEDED') {
        setPaymentState('PAID')
        if (onSuccess) onSuccess()
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0B192C] text-white rounded-3xl border border-[#FF6500]/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-[#0B192C] via-[#1E293B] to-[#0B192C] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FF6500]/20 border border-[#FF6500]/40 rounded-2xl text-[#FF6500]">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Tanzania Mobile Money</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  INSTANT PUSH
                </span>
              </div>
              <p className="text-xs text-gray-400">Order Ref: <span className="font-mono text-[#FF6500] font-semibold">{orderNumber}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Supported Mobile Providers Badges */}
          <div className="flex items-center justify-between p-3 bg-[#1E293B] rounded-2xl border border-slate-700/60 text-xs">
            <span className="text-gray-400 font-medium">Supported Carriers:</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="px-2 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg">M-Pesa</span>
              <span className="px-2 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg">Tigo Pesa</span>
              <span className="px-2 py-1 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-lg">Airtel</span>
              <span className="px-2 py-1 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-lg">HaloPesa</span>
            </div>
          </div>

          {/* STATE 1: READY */}
          {paymentState === 'READY' && (
            <form onSubmit={handleInitiatePayment} className="space-y-5">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Payable Amount:</span>
                  <span className="text-white font-semibold">TZS {formattedAmount}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Transaction Fee:</span>
                  <span className="text-emerald-400 font-medium">FREE (Covered by LUMO)</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-base">
                  <span className="text-white">Total Charge:</span>
                  <span className="text-[#FF6500]">TZS {formattedAmount}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  Enter Tanzanian Mobile Number (M-Pesa / Tigo / Airtel / HaloPesa)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-400 font-mono text-sm">+255</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="711 788 830"
                    className="w-full pl-16 pr-4 py-3 bg-[#1E293B] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  A payment authorization prompt will pop up on this phone number.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#FF6500] hover:bg-[#e05800] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-base"
              >
                Pay TZS {formattedAmount} Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* STATE 2: SENDING_REQUEST */}
          {paymentState === 'SENDING_REQUEST' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-12 h-12 text-[#FF6500] animate-spin mx-auto" />
              <div>
                <h4 className="font-bold text-lg text-white">Connecting to Mongike Gateway...</h4>
                <p className="text-xs text-gray-400 mt-1">Initiating USSD push request to {phone}</p>
              </div>
            </div>
          )}

          {/* STATE 3 & 4: AWAITING_PHONE_CONFIRMATION / VERIFYING */}
          {(paymentState === 'AWAITING_PHONE_CONFIRMATION' || paymentState === 'VERIFYING') && (
            <div className="py-6 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 bg-[#FF6500]/20 rounded-full animate-ping" />
                <div className="relative w-20 h-20 bg-[#1E293B] border-2 border-[#FF6500] rounded-full flex items-center justify-center text-[#FF6500]">
                  <Smartphone className="w-10 h-10 animate-bounce" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xl text-white">Check Your Mobile Phone!</h4>
                <p className="text-sm text-gray-300 max-w-xs mx-auto">
                  A payment authorization prompt has been sent to <span className="font-mono text-[#FF6500] font-bold">{phone}</span>.
                </p>
                <p className="text-xs text-emerald-400 font-medium pt-1">
                  Enter your Mobile Money PIN on your phone to confirm TZS {formattedAmount}.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-gray-400">
                <Clock className="w-4 h-4 text-[#FF6500]" />
                Request expires in <span className="text-white font-bold">{formatTime(secondsRemaining)}</span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setPaymentState('VERIFYING')}
                  className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Checking payment status automatically...
                </button>
              </div>
            </div>
          )}

          {/* STATE 5: PAID */}
          {paymentState === 'PAID' && (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-2xl text-white">Payment Successful!</h4>
                <p className="text-sm text-gray-300">
                  Your payment of <span className="font-bold text-emerald-400">TZS {formattedAmount}</span> for Order #{orderNumber} has been verified.
                </p>
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-xs text-left space-y-2 text-gray-300">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span>Order Number:</span>
                  <span className="font-mono text-white font-semibold">{orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Gateway:</span>
                  <span className="text-emerald-400 font-medium">Mongike Mobile Money</span>
                </div>
                <div className="flex justify-between">
                  <span>SMS Notification:</span>
                  <span className="text-emerald-400 font-medium">Dispatched via Meseji</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose()
                  window.location.href = `/orders/${orderNumber}`
                }}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base"
              >
                Track Your Order
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STATE 6: FAILED */}
          {paymentState === 'FAILED' && (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 bg-rose-500/20 border-2 border-rose-500 text-rose-400 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-xl text-white">Payment Authorization Failed</h4>
                <p className="text-xs text-rose-300 max-w-xs mx-auto">
                  {errorMessage || 'The payment request was cancelled or declined on your phone.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentState('READY')}
                  className="w-full py-3 bg-[#FF6500] hover:bg-[#e05800] text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* STATE 7: EXPIRED */}
          {paymentState === 'EXPIRED' && (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-500 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-xl text-white">Payment Request Expired</h4>
                <p className="text-xs text-gray-300 max-w-xs mx-auto">
                  The authorization prompt timed out after 15 minutes. Please initiate a new payment push.
                </p>
              </div>

              <button
                onClick={() => setPaymentState('READY')}
                className="w-full py-3 bg-[#FF6500] hover:bg-[#e05800] text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Resend Payment Request
              </button>
            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 text-center text-[11px] text-gray-400 flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          Protected by 256-bit Encrypted LUMO Trade Assurance & Mongike Gateway
        </div>
      </div>
    </div>
  )
}
