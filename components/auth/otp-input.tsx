'use client'

import React, { useRef, useState, useEffect } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface OtpInputProps {
  length?: number
  value: string
  onChange: (code: string) => void
  onComplete?: (code: string) => void
  disabled?: boolean
  error?: boolean
  isVerified?: boolean
  isVerifying?: boolean
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  isVerified = false,
  isVerifying = false,
}: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''))
  const [isShaking, setIsShaking] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const valDigits = value.split('').slice(0, length)
    const newDigits = Array(length).fill('')
    valDigits.forEach((char, idx) => {
      if (/\d/.test(char)) newDigits[idx] = char
    })
    setDigits(newDigits)
  }, [value, length])

  // Trigger shake animation on error
  useEffect(() => {
    if (error) {
      setIsShaking(true)
      const timer = setTimeout(() => setIsShaking(false), 500)
      return () => clearTimeout(timer)
    }
  }, [error])

  function handleChange(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled || isVerifying || isVerified) return
    const val = e.target.value
    const lastChar = val.substring(val.length - 1)

    if (val && !/\d/.test(lastChar)) return

    const newDigits = [...digits]
    newDigits[idx] = lastChar
    setDigits(newDigits)
    const combined = newDigits.join('')
    onChange(combined)

    if (lastChar && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus()
    }

    if (combined.length === length && !newDigits.includes('')) {
      onComplete?.(combined)
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled || isVerifying || isVerified) return
    if (e.key === 'Backspace') {
      if (!digits[idx] && idx > 0) {
        inputRefs.current[idx - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    if (disabled || isVerifying || isVerified) return
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length)
    if (!pastedData) return

    const newDigits = Array(length).fill('')
    pastedData.split('').forEach((char, idx) => {
      newDigits[idx] = char
    })

    setDigits(newDigits)
    const combined = newDigits.join('')
    onChange(combined)

    const nextFocusIdx = Math.min(pastedData.length, length - 1)
    inputRefs.current[nextFocusIdx]?.focus()

    if (pastedData.length === length) {
      onComplete?.(combined)
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={`flex items-center justify-center gap-2 sm:gap-3 transition-transform duration-200 ${
          isShaking ? 'animate-shake' : ''
        }`}
        role="group"
        aria-label="6-digit verification code input"
      >
        {Array.from({ length }).map((_, idx) => {
          const isFilled = !!digits[idx]
          return (
            <div key={idx} className="relative">
              <input
                ref={(el) => {
                  inputRefs.current[idx] = el
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                value={digits[idx] || ''}
                onChange={(e) => handleChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                disabled={disabled || isVerifying || isVerified}
                aria-label={`Digit ${idx + 1} of ${length}`}
                aria-invalid={error}
                className={`size-11 sm:size-13 text-center text-xl sm:text-2xl font-black rounded-xl border transition-all duration-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-1 select-none transform active:scale-95 motion-reduce:transition-none motion-reduce:animate-none ${
                  isVerified
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 animate-pulse-halo scale-105'
                    : error
                    ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 focus:ring-red-500'
                    : isFilled
                    ? 'border-primary/70 bg-orange-50/40 dark:bg-orange-950/20 text-[#0F172A] dark:text-white focus:border-primary focus:ring-primary/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white focus:border-primary focus:ring-primary/30'
                } ${(disabled || isVerifying) && !isVerified ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              {isVerified && idx === length - 1 && (
                <div className="absolute -right-2 -top-2 size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md animate-bounce">
                  <CheckCircle2 className="size-3.5 stroke-[3]" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Screen Reader & State Announcement */}
      <div aria-live="polite" className="sr-only">
        {isVerified
          ? 'Verification successful! Redirecting to marketplace...'
          : error
          ? 'Invalid verification code. Please check and try again.'
          : isVerifying
          ? 'Verifying code...'
          : `Entered ${digits.filter(Boolean).length} of ${length} digits.`}
      </div>
    </div>
  )
}

