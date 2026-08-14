import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PhoneOtpVerification } from '@/components/auth/phone-otp-verification'

export const metadata: Metadata = {
  title: 'Verify Phone | Lumo Commerce',
  description: 'Verify your phone number to activate your Lumo account.',
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PhoneOtpVerification />
    </Suspense>
  )
}
