'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { cartSubtotal, useCartStore, type CartLine } from '@/lib/stores/cart-store'
import { useSessionStore } from '@/lib/stores/session-store'
import { AuthRequiredModal } from '@/components/auth/auth-required-modal'
import { useLocaleStore, useT } from '@/lib/i18n/use-locale'
import { formatCurrency } from '@/lib/i18n/format'
import { useFormatPrice } from '@/lib/stores/currency-store'

const DELIVERY_FEE = 8000
const FREE_DELIVERY_THRESHOLD = 250000

export function CartView() {
  const t = useT()
  const locale = useLocaleStore((state) => state.locale)
  const formatPrice = useFormatPrice()
  const router = useRouter()
  const user = useSessionStore((state) => state.user)
  const lines = useCartStore((state) => state.lines)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)
  const toggleSaved = useCartStore((state) => state.toggleSavedForLater)

  const [showAuthModal, setShowAuthModal] = useState(false)

  const active = lines.filter((line) => !line.savedForLater)
  const saved = lines.filter((line) => line.savedForLater)
  const subtotal = cartSubtotal(lines)
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FEE
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal)

  function handleProceedToCheckout() {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    router.push('/checkout')
  }

  if (active.length === 0 && saved.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShoppingCart />
          </EmptyMedia>
          <EmptyTitle>{t('cart.emptyTitle')}</EmptyTitle>
          <EmptyDescription>
            {t('cart.emptyDesc')}
          </EmptyDescription>
        </EmptyHeader>
        <Button render={<Link href="/marketplace">{t('cart.continueShopping')}</Link>} />
      </Empty>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-base">
              {t('cart.title')} ({t('cart.itemCount', { count: active.length })})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-0 p-0">
            {active.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {t('cart.emptyTitle')}
              </p>
            ) : (
              active.map((line, index) => (
                <div key={line.id}>
                  {index > 0 ? <Separator /> : null}
                  <CartRow
                    line={line}
                    onQuantity={(quantity) => setQuantity(line.id, quantity)}
                    onRemove={() => remove(line.id)}
                    onSave={() => toggleSaved(line.id)}
                    saveLabel="Save for later"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {saved.length > 0 ? (
          <Card className="gap-0 py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base">Saved for later ({saved.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-0 p-0">
              {saved.map((line, index) => (
                <div key={line.id}>
                  {index > 0 ? <Separator /> : null}
                  <CartRow
                    line={line}
                    onQuantity={(quantity) => setQuantity(line.id, quantity)}
                    onRemove={() => remove(line.id)}
                    onSave={() => toggleSaved(line.id)}
                    saveLabel="Move to cart"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card className="lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle className="text-base">{t('cart.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{t('cart.subtotal')}</span>
            <span className="font-medium tabular-nums">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{t('cart.deliveryFee')}</span>
            <span className="font-medium tabular-nums">
              {delivery === 0 ? 'Free' : formatPrice(delivery)}
            </span>
          </div>
          {remainingForFreeDelivery > 0 ? (
            <p className="rounded-md bg-info-subtle px-3 py-2 text-xs text-info-strong">
              Add {formatPrice(remainingForFreeDelivery)} more for free delivery.
            </p>
          ) : null}
          <Separator />
          <div className="flex items-center justify-between gap-2 text-base">
            <span className="font-medium">{t('cart.total')}</span>
            <span className="font-semibold tabular-nums">{formatPrice(subtotal + delivery)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Pay with M-Pesa, Mixx by Yas, Airtel Money, HaloPesa, card or bank transfer.
          </p>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            className="w-full font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
            disabled={active.length === 0}
            onClick={handleProceedToCheckout}
          >
            {t('cart.proceedToCheckout')}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            render={<Link href="/marketplace">{t('cart.continueShopping')}</Link>}
          />
        </CardFooter>
      </Card>

      <AuthRequiredModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Sign In Required to Checkout"
        description="Please sign in or create an account to proceed with your order and unlock buyer protection."
        redirectUrl="/checkout"
      />
    </div>
  )
}

function CartRow({
  line,
  onQuantity,
  onRemove,
  onSave,
  saveLabel,
}: {
  line: CartLine
  onQuantity: (quantity: number) => void
  onRemove: () => void
  onSave: () => void
  saveLabel: string
}) {
  const t = useT()
  const locale = useLocaleStore((state) => state.locale)
  const formatPrice = useFormatPrice()

  return (
    <div className="flex gap-4 p-4">
      <Link
        href={`/marketplace/${line.slug}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-md border bg-muted"
      >
        <Image src={line.image} alt={line.title} fill sizes="80px" className="object-cover" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href={`/marketplace/${line.slug}`}
              className="text-sm font-medium text-pretty hover:text-primary"
            >
              {line.title}
            </Link>
            <span className="text-xs text-muted-foreground">{line.variantLabel}</span>
            <span className="text-xs text-muted-foreground">SKU {line.sku}</span>
          </div>
          <span className="font-medium tabular-nums">
            {formatPrice(line.unitPrice * line.quantity)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Decrease quantity of ${line.title}`}
              disabled={line.quantity <= 1}
              onClick={() => onQuantity(line.quantity - 1)}
            >
              <Minus />
            </Button>
            <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Increase quantity of ${line.title}`}
              disabled={line.quantity >= line.stock}
              onClick={() => onQuantity(line.quantity + 1)}
            >
              <Plus />
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={onSave}>
            {saveLabel}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-danger-strong hover:text-danger-strong"
          >
            <Trash2 data-icon="inline-start" />
            {t('common.remove')}
          </Button>
        </div>
      </div>
    </div>
  )
}
