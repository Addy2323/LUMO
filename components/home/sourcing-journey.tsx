'use client'

import Image from 'next/image'
import { Building2, Lock, MapPin, Package, Search } from 'lucide-react'
import { useT } from '@/lib/i18n/use-locale'

export function SourcingJourney() {
  const t = useT()

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden bg-[#FAFDFF] border border-[#D9E7F3] shadow-[0_18px_45px_rgba(6,35,75,0.14)] p-4 sm:p-6 lg:p-7 select-none min-h-[370px] sm:min-h-[340px] flex flex-col justify-between"
      aria-label="Lumo sourcing journey from supplier review through quality inspection and secure payment to delivery in Dar es Salaam."
    >
      {/* 1. Pale Dotted World Map & Sourcing Routes Background Image */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <Image
          src="/images/hero/lumo-global-routes-transparent.png"
          alt=""
          fill
          sizes="(max-width: 1200px) 100vw, 900px"
          className="object-cover sm:object-contain object-center opacity-85"
          priority
        />
      </div>

      {/* 2. Top Header Row: Supplier Card (Left) + LUMO Container & Boxes (Right) */}
      <div className="relative z-10 flex items-start justify-between gap-2 sm:gap-4">
        
        {/* Supplier Card (Upper-Left) */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2.5 sm:p-3.5 border border-[#E1EAF3] shadow-[0_8px_22px_rgba(11,31,58,0.10)] flex items-center gap-2.5 min-w-[165px] sm:min-w-[210px]">
          <div className="size-8 sm:size-11 rounded-full bg-[#0B4385] text-white flex items-center justify-center shrink-0">
            <Building2 className="size-4 sm:size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold text-[#0B1F3A] leading-tight">
              Supplier
            </span>
            <span className="text-[10px] sm:text-xs text-[#64748B] leading-tight mt-0.5">
              Guangzhou, China
            </span>
            <span className="mt-1 px-2 py-0.5 bg-[#E6F7F2] text-[#0F9D8A] text-[9px] sm:text-[10px] font-bold rounded-full border border-[#0F9D8A]/20 w-fit">
              Confirmed
            </span>
          </div>
        </div>

        {/* 3D LUMO Shipping Container & Stacked Boxes Image Asset (Upper-Right) */}
        <div className="relative w-28 sm:w-48 lg:w-60 aspect-[16/9] shrink-0 pointer-events-none self-start -mt-1 -mr-2">
          <Image
            src="/images/hero/lumo-container-transparent.png"
            alt="Lumo blue shipping container and cardboard boxes"
            fill
            sizes="(max-width: 768px) 120px, 240px"
            className="object-contain object-right-top drop-shadow-md"
            priority
          />
        </div>
      </div>

      {/* 3. Center Horizontal Journey Progress Line & 4 Stages */}
      <div className="relative z-10 mt-5 sm:mt-8 mb-2">
        {/* Base Progress Line */}
        <div className="absolute top-[18px] sm:top-[22px] left-[8%] right-[8%] h-[2px] bg-[#D9E7F3] -z-10" />
        {/* Completed Progress Segment */}
        <div className="absolute top-[18px] sm:top-[22px] left-[8%] right-[32%] h-[2px] bg-gradient-to-r from-[#0B4385] via-[#0F9D8A] to-[#0F9D8A] -z-10" />

        <div className="grid grid-cols-4 gap-1 sm:gap-4 items-start">
          {/* Stage 1: Supplier */}
          <div className="flex flex-col items-center text-center">
            <div className="size-9 sm:size-11 rounded-full bg-[#0B4385] text-white flex items-center justify-center shadow-md ring-4 ring-[#FAFDFF]">
              <Building2 className="size-4 sm:size-5" />
            </div>
            <span className="mt-2 text-[11px] sm:text-sm font-extrabold text-[#0B1F3A]">
              Supplier
            </span>
            <span className="mt-1 text-[9px] sm:text-xs text-[#64748B] leading-[1.25] max-w-[130px]">
              Supplier confirmed and order received.
            </span>
          </div>

          {/* Stage 2: Quality Check */}
          <div className="flex flex-col items-center text-center">
            <div className="size-9 sm:size-11 rounded-full bg-[#0F9D8A] text-white flex items-center justify-center shadow-md ring-4 ring-[#FAFDFF]">
              <Search className="size-4 sm:size-5" />
            </div>
            <span className="mt-2 text-[11px] sm:text-sm font-extrabold text-[#0B1F3A]">
              Quality Check
            </span>
            <span className="mt-1 text-[9px] sm:text-xs text-[#64748B] leading-[1.25] max-w-[130px]">
              Products inspected for quality and standards.
            </span>
          </div>

          {/* Stage 3: Secure Payment */}
          <div className="flex flex-col items-center text-center">
            <div className="size-9 sm:size-11 rounded-full bg-[#0F9D8A] text-white flex items-center justify-center shadow-md ring-4 ring-[#FAFDFF]">
              <Lock className="size-4 sm:size-5" />
            </div>
            <span className="mt-2 text-[11px] sm:text-sm font-extrabold text-[#0B1F3A]">
              Secure Payment
            </span>
            <span className="mt-1 text-[9px] sm:text-xs text-[#64748B] leading-[1.25] max-w-[130px]">
              Payment held securely until you confirm.
            </span>
          </div>

          {/* Stage 4: Delivered */}
          <div className="flex flex-col items-center text-center">
            <div className="size-9 sm:size-11 rounded-full bg-[#0B4385] text-white flex items-center justify-center shadow-md ring-4 ring-[#FAFDFF]">
              <Package className="size-4 sm:size-5" />
            </div>
            <span className="mt-2 text-[11px] sm:text-sm font-extrabold text-[#0B1F3A]">
              Delivered
            </span>
            <span className="mt-1 text-[9px] sm:text-xs text-[#64748B] leading-[1.25] max-w-[130px]">
              Delivered to your door with buyer protection.
            </span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Right: Destination Card (Floating inside panel) */}
      <div className="relative z-10 flex justify-end mt-3">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2.5 sm:p-3.5 border border-[#E1EAF3] shadow-[0_8px_22px_rgba(11,31,58,0.10)] flex items-center gap-2.5 min-w-[160px] sm:min-w-[200px]">
          <div className="size-8 sm:size-10 rounded-full bg-[#0F9D8A] text-white flex items-center justify-center shrink-0">
            <MapPin className="size-4 sm:size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold text-[#0B1F3A] leading-tight">
              Dar es Salaam, Tanzania
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
