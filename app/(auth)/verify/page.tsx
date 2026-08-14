import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { VerifyForm } from '@/components/auth/verify-form'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Verify your account',
  description: 'Enter the 6-digit code we sent to your phone or email.',
}

export default function VerifyPage() {
  return (
    <AuthShell
      title="Verify your account"
      description="Enter the 6-digit code we sent you to finish setting up your account."
      footer={
        <>
          Wrong number or email?{' '}
          <Link
            href="/register"
            className="font-medium text-primary-600 underline-offset-4 hover:underline"
          >
            Start over
          </Link>
        </>
      }
    >
      <Suspense
        fallback={
          <div className="flex flex-col gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        }
      >
        <VerifyForm />
      </Suspense>
    </AuthShell>
  )
}
