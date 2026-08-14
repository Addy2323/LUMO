'use client'

import { StartupLoader } from '@/components/loaders/startup-loader'

export default function LoadingPage() {
  return (
    <StartupLoader autoRedirect targetRoute="/marketplace" />
  )
}
