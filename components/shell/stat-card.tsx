import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type StatCardProps = {
  label: string
  value: string
  /** Signed percentage change vs the previous period, e.g. 12.4 or -3.1 */
  delta?: number
  deltaLabel?: string
  hint?: string
  icon?: LucideIcon
  className?: string
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel = 'vs last 30 days',
  hint,
  icon: Icon,
  className,
}: StatCardProps) {
  const isUp = (delta ?? 0) >= 0

  return (
    <Card className={cn('gap-3', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon ? (
          <CardAction>
            <Icon aria-hidden="true" className="size-4 text-muted-foreground" strokeWidth={1.75} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {delta !== undefined ? (
          <p className="flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium',
                isUp ? 'text-success-strong' : 'text-danger-strong',
              )}
            >
              {isUp ? (
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              ) : (
                <ArrowDownRight aria-hidden="true" className="size-3.5" />
              )}
              {isUp ? '+' : ''}
              {delta.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">{deltaLabel}</span>
          </p>
        ) : null}
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

export function StatCardSkeleton() {
  return (
    <Card className="gap-3">
      <CardHeader>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  )
}

export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>
  )
}
