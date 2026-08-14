'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ScrollToTop({ className }: { className?: string }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    function toggleVisibility() {
      if (window.scrollY > 250) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!isVisible) return null

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      title="Scroll back to top"
      className={cn(
        'hidden sm:flex fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 items-center gap-2 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#E05E00] hover:from-[#E05E00] hover:to-[#C44F00] text-white p-3 shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 border border-white/20 cursor-pointer group',
        className,
      )}
    >
      <ArrowUp className="size-4 stroke-[2.5] transition-transform group-hover:-translate-y-0.5" />
      <span className="hidden md:inline-block text-xs font-bold tracking-wide pr-1">Top</span>
    </button>
  )
}
