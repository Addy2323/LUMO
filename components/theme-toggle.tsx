'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Droplet, Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 rounded-full bg-slate-800/30 border border-slate-700/40 opacity-70">
        <div className="size-6 rounded-full bg-slate-700/40" />
        <div className="size-6 rounded-full bg-slate-700/40" />
        <div className="size-6 rounded-full bg-slate-700/40" />
      </div>
    )
  }

  const currentTheme = theme || 'dark'

  return (
    <div
      aria-label="Theme selector"
      className="flex items-center gap-1 p-0.5 rounded-full bg-slate-200/90 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/60 shadow-xs"
    >
      <button
        type="button"
        title="Dark Mode"
        onClick={() => setTheme('dark')}
        className={`size-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          currentTheme === 'dark'
            ? 'bg-[#0D1527] text-white shadow-xs border border-slate-700 ring-1 ring-slate-600'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Moon className="size-3.5" />
      </button>

      <button
        type="button"
        title="Light Blue Mode"
        onClick={() => setTheme('light-blue')}
        className={`size-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          currentTheme === 'light-blue'
            ? 'bg-[#164E8C] text-white shadow-xs ring-1 ring-blue-400'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Droplet className="size-3.5" />
      </button>

      <button
        type="button"
        title="Light Mode"
        onClick={() => setTheme('light')}
        className={`size-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          currentTheme === 'light'
            ? 'bg-amber-500 text-white shadow-xs ring-1 ring-amber-300'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Sun className="size-3.5" />
      </button>
    </div>
  )
}
