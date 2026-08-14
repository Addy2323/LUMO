import type { Metadata } from 'next'
import { AgentSidebar } from '@/components/agent/agent-sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'

export const metadata: Metadata = {
  title: 'LUMO Global Sourcing Agent Portal',
  description: 'Field operations portal for LUMO sourcing agents in China, Dubai, Turkey, and India.',
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0b1120] text-slate-100 antialiased font-sans">
      <AgentSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-extrabold text-slate-300 tracking-wide uppercase font-mono">
              LUMO Global Operations Mesh · Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
