'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to dev console
    console.error('[Lumo Platform Exception]', error)
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4 text-foreground antialiased">
      <Card className="mx-auto max-w-md border-border shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 ring-4 ring-amber-500/20">
            <AlertTriangle className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold">Network or Platform Notice</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {error.message?.includes('Failed to fetch')
              ? 'A temporary dev network re-connection occurred. Click Retry to reload.'
              : 'An unexpected application exception was captured.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center text-xs text-muted-foreground py-2">
          <div className="rounded-lg bg-muted p-3 font-mono text-[11px] text-foreground text-left overflow-x-auto max-h-24">
            {error.message || 'TypeError: Failed to fetch'}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => reset()}
            className="w-full font-bold bg-primary hover:bg-primary-600 text-white shadow-xs"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Retry Action
          </Button>

          <div className="flex w-full gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 text-xs"
              render={<Link href="/" />}
            >
              <Home className="size-3.5 mr-1" />
              Home
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
