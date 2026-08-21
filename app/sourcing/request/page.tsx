'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CustomerSourcingRequestPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/sourcing/paste-link')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div className="space-y-3">
        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto animate-spin">
          ⏳
        </div>
        <p className="text-sm font-bold text-foreground">Redirecting to Smart Product Sourcing...</p>
      </div>
    </div>
  )
}
