import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
  /** Hide the wordmark and render the mark only (collapsed sidebars, mobile bars). */
  markOnly?: boolean
  /** Inverted mark for use on primary-filled surfaces. */
  tone?: 'default' | 'onPrimary'
}

export function Logo({ className, markOnly = false, tone = 'default' }: LogoProps) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-md font-mono text-sm font-semibold',
          tone === 'onPrimary'
            ? 'bg-brand-panel-foreground text-brand-panel'
            : 'bg-primary-400 text-primary-foreground',
        )}
      >
        L
      </span>
      {!markOnly && (
        <span
          className={cn(
            'text-base font-semibold tracking-tight',
            tone === 'onPrimary' ? 'text-brand-panel-foreground' : 'text-foreground',
          )}
        >
          Lumo
        </span>
      )}
      <span className="sr-only">Lumo</span>
    </span>
  )
}
