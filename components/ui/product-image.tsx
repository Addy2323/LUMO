'use client'

import React, { useState, useEffect } from 'react'
import { resolveImage } from '@/lib/mock/products'
import { cn } from '@/lib/utils'

interface SafeProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string
  alt: string
  title?: string
  category?: string
  fallbackSrc?: string
}

/**
 * Resilient Product Image component that automatically recovers from
 * 404s, CORS restrictions, example.com links, or broken image URLs.
 */
export function SafeProductImage({
  src,
  alt,
  title = '',
  category = '',
  fallbackSrc,
  className,
  ...props
}: SafeProductImageProps) {
  const defaultFallback = fallbackSrc || resolveImage(title || alt, category)
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (!src || src.includes('example.com') || src.includes('placeholder')) {
      return defaultFallback
    }
    return src
  })
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => {
    if (!src || src.includes('example.com') || src.includes('placeholder')) {
      setImgSrc(defaultFallback)
    } else {
      setImgSrc(src)
      setHasFailed(false)
    }
  }, [src, defaultFallback])

  function handleError() {
    if (!hasFailed) {
      setHasFailed(true)
      setImgSrc(defaultFallback)
    }
  }

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt || title || 'Product Image'}
      onError={handleError}
      className={cn('object-cover', className)}
    />
  )
}
