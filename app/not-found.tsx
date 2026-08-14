import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowLeft,
  Globe,
  Home,
  Package,
  Search,
  ShoppingBag,
} from 'lucide-react'

export const metadata: Metadata = {
  title: '404 — Page Not Found',
  description: 'The page you are looking for does not exist on the Lumo platform.',
}

export default function NotFound() {
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center relative overflow-hidden"
      style={{
        background:
          'linear-gradient(145deg, #3e1300 0%, #7f2000 25%, #bf360c 55%, #e65100 85%, #f57c00 100%)',
      }}
    >
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-10 -top-48 -left-48"
          style={{
            background: 'radial-gradient(circle, rgba(255,204,128,0.5) 0%, transparent 70%)',
            animation: 'orb1 8s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-10 -bottom-32 -right-32"
          style={{
            background: 'radial-gradient(circle, rgba(255,204,128,0.4) 0%, transparent 70%)',
            animation: 'orb2 6s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-[0.06] top-1/3 right-1/4"
          style={{
            background: 'radial-gradient(circle, rgba(255,224,178,0.6) 0%, transparent 70%)',
            animation: 'orb3 10s ease-in-out infinite alternate',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-lg">
        {/* 404 Number */}
        <div className="relative">
          <span
            className="text-[140px] sm:text-[180px] font-black leading-none tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, #f57c00 0%, #ffcc80 40%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(245,124,0,0.3))',
              animation: 'glowPulse 3s ease-in-out infinite',
            }}
          >
            404
          </span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]">
            <Package className="size-40 text-white" strokeWidth={0.5} />
          </div>
        </div>

        {/* Message */}
        <div className="flex flex-col items-center gap-3 -mt-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Shipment Lost in Transit
          </h1>
          <p className="text-sm sm:text-base text-orange-200/80 leading-relaxed max-w-md">
            This page couldn&apos;t be located in our global warehouse network.
            It may have been moved, renamed, or is still clearing customs.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-2">
          <Link
            href="/"
            className="group flex flex-col items-center gap-2 rounded-xl border border-orange-400/20 bg-white/5 backdrop-blur p-4 text-center transition-all hover:bg-white/10 hover:border-orange-400/40 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-0.5"
          >
            <Home className="size-5 text-orange-300 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Home</span>
          </Link>
          <Link
            href="/marketplace"
            className="group flex flex-col items-center gap-2 rounded-xl border border-orange-400/20 bg-white/5 backdrop-blur p-4 text-center transition-all hover:bg-white/10 hover:border-orange-400/40 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-0.5"
          >
            <Globe className="size-5 text-orange-300 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Marketplace</span>
          </Link>
          <Link
            href="/cart"
            className="group flex flex-col items-center gap-2 rounded-xl border border-orange-400/20 bg-white/5 backdrop-blur p-4 text-center transition-all hover:bg-white/10 hover:border-orange-400/40 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-0.5"
          >
            <ShoppingBag className="size-5 text-orange-300 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Cart</span>
          </Link>
          <Link
            href="/login"
            className="group flex flex-col items-center gap-2 rounded-xl border border-orange-400/20 bg-white/5 backdrop-blur p-4 text-center transition-all hover:bg-white/10 hover:border-orange-400/40 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-0.5"
          >
            <Search className="size-5 text-orange-300 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Sign In</span>
          </Link>
        </div>

        {/* Go Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-400 hover:shadow-orange-500/40 hover:-translate-y-0.5 mt-2"
        >
          <ArrowLeft className="size-4" />
          Back to Lumo Platform
        </Link>

        {/* Trade Route Footer */}
        <div className="flex items-center gap-3 text-[10px] text-orange-200/40 font-medium mt-4 tracking-wider uppercase">
          <span>Yiwu 🇨🇳</span>
          <span>·</span>
          <span>Dubai 🇦🇪</span>
          <span>·</span>
          <span>Istanbul 🇹🇷</span>
          <span>·</span>
          <span>Dar es Salaam 🇹🇿</span>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes orb1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, 30px) scale(1.15); }
        }
        @keyframes orb2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-30px, -20px) scale(1.1); }
        }
        @keyframes orb3 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(20px, -40px) scale(1.2); }
        }
        @keyframes glowPulse {
          0%, 100% { filter: drop-shadow(0 0 40px rgba(245,124,0,0.3)); }
          50% { filter: drop-shadow(0 0 60px rgba(245,124,0,0.5)); }
        }
      `,
        }}
      />
    </div>
  )
}
