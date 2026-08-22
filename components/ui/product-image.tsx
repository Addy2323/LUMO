'use client'

import React, { useState, useEffect } from 'react'
import { resolveImage } from '@/lib/mock/products'
import { cn } from '@/lib/utils'
import { Armchair, Package, Laptop, Shirt } from 'lucide-react'

interface SafeProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: any
  alt: string
  title?: string
  category?: string
  fallbackSrc?: string
}

function extractStringUrl(input: any): string {
  if (!input) return ''
  if (typeof input === 'string') return input
  if (typeof input === 'object') {
    if (typeof input.url === 'string') return input.url
    if (typeof input.src === 'string') return input.src
  }
  if (Array.isArray(input) && input.length > 0) {
    return extractStringUrl(input[0])
  }
  return ''
}

export function normalizeImageUrl(input: any): string {
  let clean = extractStringUrl(input)
  if (!clean) return ''
  clean = clean.trim().replace(/^['"\(<\[]+|['"\)>\]]+$/g, '')

  if (clean.startsWith('//')) {
    return `https:${clean}`
  }
  if (clean.startsWith('http://')) {
    return clean.replace('http://', 'https://')
  }
  if (clean.includes('drive.google.com/file/d/')) {
    const match = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (match?.[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`
    }
  }
  if (clean.includes('dropbox.com')) {
    return clean.replace('dl=0', 'raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com')
  }
  if (
    !clean.startsWith('https://') &&
    !clean.startsWith('data:') &&
    !clean.startsWith('/') &&
    (clean.includes('.') || clean.includes('/'))
  ) {
    return `https://${clean}`
  }
  return clean
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
  const cleanUrl = normalizeImageUrl(src)
  
  const defaultFallback = React.useMemo(() => {
    return fallbackSrc || resolveImage(title || alt, category)
  }, [fallbackSrc, title, alt, category])

  // Track the raw URL to avoid resetting stage unless cleanUrl changes
  const prevUrlRef = React.useRef(cleanUrl)
  
  // 0 = trying cleanUrl, 1 = trying defaultFallback (local asset), 2 = failed all (show JSX badge)
  const [stage, setStage] = useState<number>(() => {
    if (!cleanUrl || cleanUrl.includes('example.com') || cleanUrl.includes('placeholder') || cleanUrl.includes('phone-case-armour')) {
      return 1
    }
    return 0
  })

  const [imgSrc, setImgSrc] = useState<string>(() => {
    return (!cleanUrl || cleanUrl.includes('example.com') || cleanUrl.includes('placeholder') || cleanUrl.includes('phone-case-armour'))
      ? defaultFallback
      : cleanUrl
  })

  useEffect(() => {
    if (prevUrlRef.current !== cleanUrl) {
      prevUrlRef.current = cleanUrl
      if (!cleanUrl || cleanUrl.includes('example.com') || cleanUrl.includes('placeholder') || cleanUrl.includes('phone-case-armour')) {
        setImgSrc(defaultFallback)
        setStage(1)
      } else {
        setImgSrc(cleanUrl)
        setStage(0)
      }
    }
  }, [cleanUrl, defaultFallback])

  function handleError() {
    if (stage === 0) {
      // Primary URL failed, switch to fallback photo (stage 1)
      setStage(1)
      setImgSrc(defaultFallback)
    } else if (stage === 1) {
      // Fallback photo failed, switch to React JSX badge (stage 2)
      setStage(2)
    }
  }

  if (stage === 2) {
    const name = (title || alt || 'Product').trim()
    const words = name.split(/\s+/).filter(Boolean)
    const initials = words.length >= 2 
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase() || 'LM'

    const lower = name.toLowerCase()
    const isChair = lower.includes('chair') || lower.includes('swivel') || lower.includes('gaming') || lower.includes('mesh') || category.toLowerCase().includes('furniture')
    const isTech = lower.includes('laptop') || lower.includes('monitor') || lower.includes('phone')
    const isApparel = lower.includes('shirt') || lower.includes('dress')

    const colorVariants = [
      'from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10',
      'from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
      'from-blue-500/20 to-indigo-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 bg-blue-500/10',
      'from-purple-500/20 to-violet-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30 bg-purple-500/10',
      'from-pink-500/20 to-rose-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30 bg-pink-500/10',
    ]

    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colorStyle = colorVariants[Math.abs(hash) % colorVariants.length]

    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-2 text-center select-none font-black bg-gradient-to-br rounded-xl border size-full shadow-xs gap-1',
          colorStyle,
          className
        )}
        title={name}
      >
        {isChair ? (
          <Armchair className="size-6 shrink-0 opacity-90" />
        ) : isTech ? (
          <Laptop className="size-6 shrink-0 opacity-90" />
        ) : isApparel ? (
          <Shirt className="size-6 shrink-0 opacity-90" />
        ) : (
          <Package className="size-6 shrink-0 opacity-90" />
        )}
        <span className="text-[10px] font-bold opacity-80 truncate max-w-full leading-none">
          {name.slice(0, 14)}
        </span>
      </div>
    )
  }

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt || title || 'Product Image'}
      onError={handleError}
      referrerPolicy="no-referrer"
      className={cn('object-cover', className)}
    />
  )
}

