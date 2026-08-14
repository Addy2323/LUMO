import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AnimatedAuthCard } from '@/components/auth/animated-auth-card'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Lumo account.',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AnimatedAuthCard initialMode="login" />
    </Suspense>
  )
}
