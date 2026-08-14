'use client'

import Link from 'next/link'
import Image from 'next/image'

export function CategoryGrid() {
  const categories = [
    {
      title: 'Electronics',
      image: '/categories/electronics.png',
      href: '/marketplace?category=electronics',
      bg: 'bg-[#EAF2FA]',
    },
    {
      title: 'Home & Garden',
      image: '/categories/home-living.png',
      href: '/marketplace?category=home-living',
      bg: 'bg-[#FDF3E7]',
    },
    {
      title: 'Fashion',
      image: '/categories/fashion.png',
      href: '/marketplace?category=fashion',
      bg: 'bg-[#F7EFE9]',
    },
    {
      title: 'Beauty',
      image: '/categories/beauty-health.png',
      href: '/marketplace?category=beauty-health',
      bg: 'bg-[#F9EBEA]',
    },
    {
      title: 'Industrial Tools',
      image: '/categories/industrial-tools.png',
      href: '/marketplace?category=industrial-tools',
      bg: 'bg-[#EBF5FB]',
    },
    {
      title: 'Sports & Outdoors',
      image: '/categories/sports-outdoors.png',
      href: '/marketplace?category=sports-outdoors',
      bg: 'bg-[#FEF9E7]',
    },
  ]

  return (
    <section className="py-8 sm:py-12 bg-[#F4F8FC]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] tracking-tight">
            Popular Categories
          </h2>
          <Link
            href="/marketplace"
            className="text-xs sm:text-sm font-bold text-[#0B4385] hover:underline transition-colors"
          >
            View all
          </Link>
        </div>

        {/* Horizontal Scroll on Mobile, Grid on Desktop */}
        <div className="flex overflow-x-auto gap-3 pb-3 pt-1 scrollbar-none sm:grid sm:grid-cols-3 lg:grid-cols-6 snap-x">
          {categories.map((cat, i) => (
            <Link
              key={i}
              href={cat.href}
              className="group flex flex-col items-center shrink-0 w-[120px] sm:w-auto snap-start cursor-pointer"
            >
              {/* Rounded Image Container */}
              <div
                className={`relative w-full aspect-square ${cat.bg} rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs group-hover:shadow-md transition-all flex items-center justify-center p-2`}
              >
                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  sizes="140px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl"
                />
              </div>
              {/* Category Title */}
              <span className="mt-2 text-xs sm:text-sm font-bold text-[#0B1F3A] group-hover:text-[#0B4385] text-center truncate w-full">
                {cat.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
