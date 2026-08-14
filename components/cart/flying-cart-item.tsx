'use client'

import React, { useEffect, useState } from 'react'

export type FlyingItem = {
  id: string
  imageUrl: string
  startX: number
  startY: number
  targetX: number
  targetY: number
}

export function FlyingCartContainer() {
  const [items, setItems] = useState<FlyingItem[]>([])

  useEffect(() => {
    function handleCartAdd(e: Event) {
      const customEvent = e as CustomEvent<{
        imageUrl?: string
        startX?: number
        startY?: number
      }>

      const imageUrl = customEvent.detail?.imageUrl
      if (!imageUrl) return

      // Find target cart icon element in header
      const cartIcon = document.querySelector('[data-cart-icon]')
      let targetX = window.innerWidth - 80
      let targetY = 30

      if (cartIcon) {
        const rect = cartIcon.getBoundingClientRect()
        targetX = rect.left + rect.width / 2
        targetY = rect.top + rect.height / 2
      }

      const startX = customEvent.detail?.startX ?? window.innerWidth / 2
      const startY = customEvent.detail?.startY ?? window.innerHeight / 2

      const newItem: FlyingItem = {
        id: `fly_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        imageUrl,
        startX,
        startY,
        targetX,
        targetY,
      }

      setItems((prev) => [...prev, newItem])

      // After 800ms animation finishes, remove item & trigger cart bounce
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== newItem.id))
        window.dispatchEvent(new CustomEvent('lumo_cart_bounce'))
      }, 850)
    }

    window.addEventListener('lumo_cart_item_added', handleCartAdd)
    return () => window.removeEventListener('lumo_cart_item_added', handleCartAdd)
  }, [])

  if (items.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute size-12 rounded-xl border-2 border-brand-500 bg-white p-1 shadow-2xl overflow-hidden animate-fly-to-cart"
          style={
            {
              '--start-x': `${item.startX}px`,
              '--start-y': `${item.startY}px`,
              '--target-x': `${item.targetX}px`,
              '--target-y': `${item.targetY}px`,
            } as React.CSSProperties
          }
        >
          <img src={item.imageUrl} alt="" className="size-full object-cover rounded-lg" />
        </div>
      ))}
    </div>
  )
}
