'use client'

import * as React from 'react'
import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { StartupLoader } from '@/components/loaders/startup-loader'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  // One client per browser session.
  const [queryClient] = React.useState(makeQueryClient)

  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      themes={['dark', 'light-blue', 'light']}
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <StartupLoader>{children}</StartupLoader>
          <Toaster position="top-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
