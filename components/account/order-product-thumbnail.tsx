'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'

interface OrderProductThumbnailProps {
  src?: string
  alt?: string
  className?: string
}

export function OrderProductThumbnail({
  src,
  alt = 'Wholesale B2B Goods',
  className = 'size-12',
}: OrderProductThumbnailProps) {
  const [error, setError] = useState(false)

  let cleanSrc = src || ''
  if (cleanSrc.startsWith('//')) {
    cleanSrc = `https:${cleanSrc}`
  }

  // If src contains generic unsplash placeholder, treat as missing so fallback renders
  if (cleanSrc.includes('unsplash.com')) {
    cleanSrc = ''
  }

  const showFallback = !cleanSrc || error

  return (
    <div
      className={`${className} rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs`}
    >
      {showFallback ? (
        <div className="w-full h-full bg-gradient-to-br from-orange-50 to-slate-100 flex items-center justify-center text-[#FF6B00]">
          <Package className="size-6 shrink-0" />
        </div>
      ) : (
        <img
          src={cleanSrc}
          alt={alt}
          onError={() => setError(true)}
          className="size-full object-cover"
        />
      )}
    </div>
  )
}
