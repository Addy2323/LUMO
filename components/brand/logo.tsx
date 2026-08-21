import Image from 'next/image'
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
    <span className={cn('inline-flex items-center gap-2 select-none', className)}>
      <Image
        src="/logo.png"
        alt="LUMO"
        width={140}
        height={40}
        className={cn(
          'h-9 w-auto object-contain transition-transform duration-200 hover:scale-105',
          tone === 'onPrimary' && 'brightness-0 invert',
          markOnly && 'h-7 w-7 object-cover object-top'
        )}
        priority
      />
    </span>
  )
}
