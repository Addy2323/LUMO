import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Rating({
  value,
  reviewCount,
  size = 'sm',
  className,
}: {
  value: number
  reviewCount?: number
  size?: 'sm' | 'md'
  className?: string
}) {
  const rounded = Math.round(value * 2) / 2
  const starSize = size === 'md' ? 'size-4' : 'size-3.5'

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((index) => (
          <Star
            key={index}
            className={cn(
              starSize,
              index <= rounded
                ? 'fill-warning text-warning'
                : 'fill-transparent text-muted-foreground/40',
            )}
            strokeWidth={1.75}
          />
        ))}
      </div>
      <span className={cn('font-medium', size === 'md' ? 'text-sm' : 'text-xs')}>
        {value.toFixed(1)}
      </span>
      {reviewCount !== undefined ? (
        <span className={cn('text-muted-foreground', size === 'md' ? 'text-sm' : 'text-xs')}>
          ({reviewCount.toLocaleString('en-TZ')})
        </span>
      ) : null}
      <span className="sr-only">
        {value.toFixed(1)} out of 5{reviewCount !== undefined ? ` from ${reviewCount} reviews` : ''}
      </span>
    </div>
  )
}
