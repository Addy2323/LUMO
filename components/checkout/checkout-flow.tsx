'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Package,
  PhoneCall,
  ShieldCheck,
  Tag,
  Truck,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatTZS } from '@/lib/format'
import { ADDRESSES, addCustomAddress, addCustomerOrder, getAddressesForUser, type Address, type PaymentMethodId } from '@/lib/mock/orders'
import { PAYMENT_METHODS, paymentMethod, requestAzamPayCharge } from '@/lib/mock/payments'
import { cartSubtotal, useCartStore } from '@/lib/stores/cart-store'
import { useSessionStore } from '@/lib/stores/session-store'
import { AuthRequiredModal } from '@/components/auth/auth-required-modal'
import { normalizeTanzaniaPhone } from '@/lib/payments/phone-validation'
import {
  getOrCreateIdempotencyKey,
  checkIdempotency,
  registerPendingIdempotency,
  completeIdempotency,
  failIdempotency,
  calculateAuthoritativeTotal,
} from '@/lib/payments/idempotency'

// Import modular reusable checkout components
import { CheckoutTrustBadges } from './checkout-trust-badges'
import { CheckoutProgress } from './checkout-progress'
import { AddressOptionCard } from './address-option-card'
import { ShippingOptionCard, type ShippingOption } from './shipping-option-card'
import { PaymentMethodCard } from './payment-method-card'
import { BuyerProtectionCard } from './buyer-protection-card'
import { MobileOrderSummary } from './mobile-order-summary'

type Step = 0 | 1 | 2

const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'standard',
    name: 'Standard Doorstep Courier',
    detail: '3–5 working days · Delivered by Reliable Logistics',
    fee: 3000,
    badge: 'Popular',
  },
  {
    id: 'express',
    name: 'Express Air Freight Courier',
    detail: 'Next working day · Dar es Salaam, Arusha & Dodoma',
    fee: 8000,
    badge: 'Faster',
  },
  {
    id: 'pickup',
    name: 'Collect from Kariakoo Logistics Hub',
    detail: 'Mtoni, Dar es Salaam · Same day',
    fee: 0,
    badge: 'Self Pick-up',
  },
]

// Provider backend availability configuration
const PAYMENT_AVAILABILITY: Record<PaymentMethodId, { available: boolean; note?: string }> = {
  mpesa: { available: true },
  mixxbyyas: { available: false, note: 'Coming Soon' },
  halopesa: { available: false, note: 'Coming Soon' },
  airtel: { available: false, note: 'Coming Soon' },
  card: { available: false, note: 'Coming Soon' },
  bank_crdb: { available: false, note: 'Currently Unavailable' },
  bank_nmb: { available: false, note: 'Currently Unavailable' },
}

export function CheckoutFlow() {
  const router = useRouter()
  const user = useSessionStore((state) => state.user)
  const lines = useCartStore((state) => state.lines)
  const clear = useCartStore((state) => state.clear)

  const [step, setStep] = useState<Step>(0)
  const [addresses, setAddresses] = useState<Address[]>(() => getAddressesForUser(user))
  const [addressId, setAddressId] = useState<string>(() => {
    const list = getAddressesForUser(user)
    return (list.find((a) => a.isDefault) || list[0]).id
  })

  // Sync addresses when user changes
  useEffect(() => {
    const list = getAddressesForUser(user)
    setAddresses(list)
    if (!list.some((a) => a.id === addressId)) {
      setAddressId((list.find((a) => a.isDefault) || list[0]).id)
    }
  }, [user])

  // New address form state
  const [showAddAddressForm, setShowAddAddressForm] = useState(false)
  const [newAddr, setNewAddr] = useState({
    label: 'Home',
    recipient: user?.fullName || '',
    phone: user?.phone || '+255 ',
    street: '',
    ward: 'Msasani',
    district: 'Kinondoni',
    region: 'Dar es Salaam',
    isDefault: true,
  })

  // Checkout choices state (preserved across step navigation)
  const [shippingId, setShippingId] = useState<string>('standard')
  const [instructions, setInstructions] = useState('')
  const [methodId, setMethodId] = useState<PaymentMethodId>('mpesa')
  const [rawPhone, setRawPhone] = useState(user?.phone || '+255 712 445 908')
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Payment execution state
  const [status, setStatus] = useState<'idle' | 'awaiting' | 'confirmed' | 'failed'>('idle')
  const [idempotencyKey, setIdempotencyKey] = useState<string>('')
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const isSubmittingRef = useRef(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const [lastPaidOrder, setLastPaidOrder] = useState<{
    reference: string
    total: number
    methodName: string
    recipient: string
    phone: string
    ward: string
    region: string
    shippingName: string
  } | null>(null)

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)

  // Active items from cart
  const active = lines.filter((line) => !line.savedForLater)
  const shipping = SHIPPING_OPTIONS.find((option) => option.id === shippingId) || SHIPPING_OPTIONS[0]

  // Authoritative financial calculation
  const authoritative = calculateAuthoritativeTotal({
    lines: active.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
    shippingFee: shipping.fee,
    couponDiscountPercentage: appliedCoupon?.discount,
  })

  const address = addresses.find((item) => item.id === addressId) || addresses[0] || ADDRESSES[0]
  const method = paymentMethod(methodId)

  // Initialize or maintain idempotency key when on review step
  useEffect(() => {
    if (step === 2 && !idempotencyKey) {
      setIdempotencyKey(getOrCreateIdempotencyKey())
    }
  }, [step, idempotencyKey])

  // Phone number live validation
  const validatePhone = (input: string): boolean => {
    const res = normalizeTanzaniaPhone(input)
    if (!res.valid) {
      setPhoneError(res.error || 'Invalid phone number.')
      return false
    }
    setPhoneError(null)
    return true
  }

  const handlePhoneChange = (val: string) => {
    setRawPhone(val)
    if (phoneError) {
      validatePhone(val)
    }
  }

  const handleCreateAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAddr.recipient.trim() || !newAddr.phone.trim() || !newAddr.street.trim()) {
      toast.error('Missing details', { description: 'Please fill in recipient name, phone, and street address.' })
      return
    }

    const created = addCustomAddress({
      label: newAddr.label || 'Home',
      recipient: newAddr.recipient,
      phone: newAddr.phone,
      street: newAddr.street,
      ward: newAddr.ward || 'General',
      district: newAddr.district || 'Kinondoni',
      region: newAddr.region || 'Dar es Salaam',
      isDefault: newAddr.isDefault,
    })

    const updatedList = getAddressesForUser(user)
    setAddresses(updatedList)
    setAddressId(created.id)
    setShowAddAddressForm(false)
    toast.success('Address Saved!', { description: `Set ${created.label} (${created.recipient}) as delivery destination.` })
  }

  function applyPromoCode(e: React.FormEvent) {
    e.preventDefault()
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    if (code === 'LUMO10' || code === 'WELCOME10') {
      setAppliedCoupon({ code, discount: 10 })
      toast.success('Promo Code Applied!', { description: '10% discount has been applied to your subtotal.' })
    } else if (code === 'BARAKASHIP' || code === 'FREESHIP') {
      setAppliedCoupon({ code, discount: 15 })
      toast.success('Promo Code Applied!', { description: 'Special 15% discount applied.' })
    } else {
      toast.error('Invalid Coupon Code', { description: 'Try code "LUMO10" for 10% off.' })
    }
  }

  const handleProceedToStep2 = () => {
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleProceedToStep3 = () => {
    // Validate phone number if M-Pesa is selected
    if (method.kind === 'mobile_money') {
      if (!validatePhone(rawPhone)) {
        toast.error('Invalid Phone Number', { description: 'Please enter a valid Tanzanian mobile money phone number.' })
        return
      }
    }

    // Ensure selected payment method is available
    const availability = PAYMENT_AVAILABILITY[methodId]
    if (!availability || !availability.available) {
      toast.error('Payment Method Unavailable', {
        description: `${method.name} is currently unavailable. Please select M-Pesa.`,
      })
      return
    }

    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function authorizeAndPay() {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    // Check payment availability
    if (!PAYMENT_AVAILABILITY[methodId]?.available) {
      toast.error('Selected payment method is unavailable.')
      return
    }

    // Phone validation
    const phoneCheck = normalizeTanzaniaPhone(rawPhone)
    if (!phoneCheck.valid) {
      setPhoneError(phoneCheck.error || 'Invalid phone number.')
      toast.error('Invalid phone number format')
      return
    }

    // Immediate submission lock (prevent double click & duplicate payment)
    if (isSubmittingRef.current || isAuthorizing) {
      console.warn('[CHECKOUT] Payment authorization already in progress. Ignoring duplicate click.')
      return
    }

    isSubmittingRef.current = true
    setIsAuthorizing(true)
    setStatus('awaiting')

    // Idempotency key handling
    const key = getOrCreateIdempotencyKey(idempotencyKey)
    setIdempotencyKey(key)

    const existingIdemp = checkIdempotency(key)
    if (existingIdemp && existingIdemp.status === 'success') {
      toast.info('Payment already authorized for this transaction.')
      setIsAuthorizing(false)
      isSubmittingRef.current = false
      return
    }

    registerPendingIdempotency(key, authoritative.total)

    try {
      // Execute payment charge via AzamPay integration
      const result = await requestAzamPayCharge({
        methodId,
        amount: authoritative.total,
        phone: phoneCheck.normalized,
      })

      if (result.status !== 'success') {
        failIdempotency(key, 'Payment failed or declined by carrier.')
        setStatus('failed')
        setIsAuthorizing(false)
        isSubmittingRef.current = false
        toast.error('Payment failed', { description: 'No money was charged. Please verify details and try again.' })
        return
      }

      // Prepare order line items
      const orderItems = active.map((line) => ({
        productId: line.id,
        slug: line.id,
        title: line.title,
        variantLabel: line.variantLabel,
        sku: `SKU-${line.id.substring(0, 8).toUpperCase()}`,
        image: line.image,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
      }))

      // Persist order in store / DB
      const createdOrder = addCustomerOrder(
        {
          reference: result.reference,
          items: orderItems,
          subtotal: authoritative.subtotal,
          shippingFee: authoritative.shippingFee,
          total: authoritative.total,
          paymentMethod: methodId,
          shippingAddress: address,
          shippingMethod: shipping.name,
          customer: {
            id: user.id,
            name: user.fullName || address.recipient,
            phone: phoneCheck.normalized,
            email: user.email,
          },
        },
        user
      )

      completeIdempotency(key, createdOrder.reference, result.reference)

      setLastPaidOrder({
        reference: createdOrder.reference,
        total: authoritative.total,
        methodName: method.name,
        recipient: address.recipient,
        phone: phoneCheck.formattedDisplay,
        ward: address.ward,
        region: address.region,
        shippingName: shipping.name,
      })

      setStatus('confirmed')
      toast.success('Order Successfully Placed!', {
        description: `Order ${createdOrder.reference} has been logged to your account.`,
      })
      clear()
    } catch (err) {
      failIdempotency(key, 'Unexpected client error during payment.')
      setStatus('failed')
      toast.error('Transaction Error', { description: 'An error occurred while authorizing payment. Please retry.' })
    } finally {
      setIsAuthorizing(false)
      isSubmittingRef.current = false
    }
  }

  // Final Confirmation Screen
  if (status === 'confirmed' && lastPaidOrder) {
    return (
      <Card className="mx-auto max-w-lg border-[#A7F3D0] bg-white shadow-md overflow-hidden rounded-2xl">
        <div className="bg-[#137333] text-white py-5 px-6 text-center flex flex-col items-center gap-2">
          <div className="size-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white ring-4 ring-white/20">
            <CheckCircle2 className="size-7" />
          </div>
          <Badge className="bg-white/20 text-white border-none text-[10px] font-mono font-bold tracking-wide py-0.5">
            TRANSACTION VERIFIED
          </Badge>
          <h2 className="text-xl font-extrabold">Order Successfully Placed!</h2>
          <p className="text-xs text-emerald-100 max-w-sm">
            Payment of <strong className="text-white tnum">{formatTZS(lastPaidOrder.total)}</strong> confirmed via{' '}
            {lastPaidOrder.methodName}. Reference: <span className="font-mono font-bold text-white">{lastPaidOrder.reference}</span>.
          </p>
        </div>

        <CardContent className="p-5 sm:p-6 space-y-4 text-xs">
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-slate-50 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 font-extrabold text-[#0F172A]">
              <span>Ref: {lastPaidOrder.reference}</span>
              <span className="text-[#137333]">Payment Secured</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Recipient</span>
                <strong className="text-[#0F172A] text-xs block truncate">{lastPaidOrder.recipient}</strong>
                <span className="text-[#64748B] text-[10px] block font-mono">{lastPaidOrder.phone}</span>
                <span className="text-[#64748B] text-[10px] block truncate">
                  {lastPaidOrder.ward}, {lastPaidOrder.region}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Payment &amp; Delivery</span>
                <strong className="text-[#0F172A] text-xs block">{lastPaidOrder.methodName}</strong>
                <span className="text-[#64748B] text-[10px] block truncate">{lastPaidOrder.shippingName}</span>
                <span className="text-[#64748B] text-[10px] block">Est. 2-4 Days</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-[#0F172A]">Fulfillment Status</h4>
            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
              <div className="p-2 rounded-lg bg-[#E6F4EA] border border-[#A7F3D0] text-[#137333] font-bold">
                <Check className="size-3.5 mx-auto mb-0.5 stroke-[3]" />
                Paid
              </div>
              <div className="p-2 rounded-lg bg-[#FFF8F3] border border-[#FFD9C2] text-[#F95700] font-bold">
                <Package className="size-3.5 mx-auto mb-0.5 animate-bounce" />
                Packing
              </div>
              <div className="p-2 rounded-lg bg-slate-100 border text-[#64748B]">
                <Truck className="size-3.5 mx-auto mb-0.5" />
                In Transit
              </div>
              <div className="p-2 rounded-lg bg-slate-100 border text-[#64748B]">
                <MapPin className="size-3.5 mx-auto mb-0.5" />
                Delivered
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Button
              size="sm"
              className="flex-1 font-extrabold bg-[#F95700] hover:bg-[#E04D00] text-white shadow-xs h-10 text-xs rounded-xl"
              render={<Link href="/account/orders" />}
            >
              Track Order in Account
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 font-bold text-xs h-10 rounded-xl border-[#E2E8F0]"
              render={<Link href="/marketplace" />}
            >
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (active.length === 0) {
    return (
      <Card className="mx-auto max-w-lg border-[#E2E8F0] rounded-2xl bg-white shadow-xs">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Package className="size-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0F172A]">Your Checkout Cart is Empty</h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-xs font-medium">
              Add products from the marketplace or paste a factory sourcing link to proceed.
            </p>
          </div>
          <Button size="lg" className="font-extrabold bg-[#F95700] hover:bg-[#E04D00] text-white rounded-xl" render={<Link href="/marketplace" />}>
            Browse Global Marketplace
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-24 lg:pb-8">
      {/* Checkout Introduction Header */}
      <CheckoutTrustBadges />

      {/* Checkout Progress Indicator */}
      <CheckoutProgress currentStep={step} onStepClick={(s) => setStep(s)} />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* Left Main Step Content */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* STEP 1: Delivery Details & Shipping Speed */}
          {step === 0 ? (
            <Card className="border-[#E2E8F0] bg-white rounded-2xl shadow-xs overflow-hidden">
              <CardHeader className="border-b border-[#E2E8F0] bg-[#FAF9F5] py-4 px-5 sm:px-6">
                <CardTitle className="text-base font-black text-[#0F172A] flex items-center gap-2">
                  <MapPin className="size-4.5 text-[#F95700]" />
                  Step 1: Delivery Address &amp; Shipping Speed
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* SELECT DELIVERY ADDRESS */}
                <fieldset className="space-y-3">
                  <div className="flex items-center justify-between">
                    <legend className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                      SELECT DELIVERY ADDRESS
                    </legend>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddAddressForm(!showAddAddressForm)}
                      className="h-8 text-xs font-bold border-[#F95700] text-[#F95700] hover:bg-[#FFF8F3] rounded-xl"
                    >
                      {showAddAddressForm ? 'Cancel' : '+ Add New Address'}
                    </Button>
                  </div>

                  {/* Add New Address Inline Form */}
                  {showAddAddressForm && (
                    <form onSubmit={handleCreateAddress} className="p-4 rounded-2xl border border-[#F95700] bg-[#FFF8F3] space-y-3 mb-4">
                      <div className="flex items-center justify-between border-b border-[#FFD9C2] pb-2">
                        <span className="text-xs font-extrabold text-[#0F172A] flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-[#F95700]" /> Enter Custom Delivery Address
                        </span>
                        <Badge className="bg-[#F95700] text-white text-[10px]">New Address</Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[11px] font-bold text-[#64748B] block mb-1">Address Label</label>
                          <Input
                            placeholder="e.g. Home, Office, Store 2"
                            value={newAddr.label}
                            onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                            className="h-9 text-xs rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-[#64748B] block mb-1">Recipient Name *</label>
                          <Input
                            placeholder="e.g. John Doe"
                            value={newAddr.recipient}
                            onChange={(e) => setNewAddr({ ...newAddr, recipient: e.target.value })}
                            className="h-9 text-xs font-bold rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-[#64748B] block mb-1">Phone Number *</label>
                          <Input
                            placeholder="+255 7XX XXX XXX"
                            value={newAddr.phone}
                            onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                            className="h-9 text-xs font-mono rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-[#64748B] block mb-1">Region / City *</label>
                          <select
                            value={newAddr.region}
                            onChange={(e) => setNewAddr({ ...newAddr, region: e.target.value })}
                            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-semibold"
                          >
                            <option value="Dar es Salaam">Dar es Salaam</option>
                            <option value="Arusha">Arusha</option>
                            <option value="Dodoma">Dodoma</option>
                            <option value="Mwanza">Mwanza</option>
                            <option value="Zanzibar">Zanzibar</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-[#64748B] block mb-1">Street Address *</label>
                          <Input
                            placeholder="e.g. Plot 47, Mbezi Beach Rd"
                            value={newAddr.street}
                            onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                            className="h-9 text-xs rounded-lg"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddAddressForm(false)}
                          className="h-8 text-xs font-semibold rounded-lg"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="h-8 text-xs font-extrabold bg-[#F95700] hover:bg-[#E04D00] text-white shadow-xs rounded-lg"
                        >
                          Save &amp; Use Address
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Address Selection List */}
                  <div className="grid gap-3" role="radiogroup" aria-label="Delivery Address Options">
                    {addresses.map((item) => (
                      <AddressOptionCard
                        key={item.id}
                        address={item}
                        isSelected={item.id === addressId}
                        onSelect={(id) => setAddressId(id)}
                      />
                    ))}
                  </div>
                </fieldset>

                {/* SELECT SHIPPING SPEED */}
                <fieldset className="space-y-3 pt-2">
                  <legend className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                    SELECT SHIPPING SPEED
                  </legend>

                  <div className="grid gap-3" role="radiogroup" aria-label="Shipping Options">
                    {SHIPPING_OPTIONS.map((option) => (
                      <ShippingOptionCard
                        key={option.id}
                        option={option}
                        isSelected={option.id === shippingId}
                        onSelect={(id) => setShippingId(id)}
                      />
                    ))}
                  </div>
                </fieldset>

                {/* Special Delivery Instructions */}
                <Field className="pt-2">
                  <FieldLabel htmlFor="instructions" className="text-xs font-extrabold text-[#0F172A]">
                    Special Delivery Instructions (Optional)
                  </FieldLabel>
                  <Textarea
                    id="instructions"
                    rows={2}
                    placeholder="e.g. Place by back door, call on arrival, delivery time range..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="text-xs rounded-xl border-[#E2E8F0]"
                  />
                </Field>
              </CardContent>

              <CardFooter className="bg-[#FAF9F5] border-t border-[#E2E8F0] p-4 flex justify-end">
                <Button
                  size="lg"
                  onClick={handleProceedToStep2}
                  className="w-full sm:w-auto font-extrabold bg-[#F95700] hover:bg-[#E04D00] text-white shadow-md px-8 h-12 text-sm rounded-xl min-h-[44px]"
                >
                  Continue to Payment
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ) : null}

          {/* STEP 2: Select Payment Method & Payment Protection */}
          {step === 1 ? (
            <Card className="border-[#E2E8F0] bg-white rounded-2xl shadow-xs overflow-hidden">
              <CardHeader className="border-b border-[#E2E8F0] bg-[#FAF9F5] py-4 px-5 sm:px-6">
                <CardTitle className="text-base font-black text-[#0F172A] flex items-center gap-2">
                  <CreditCard className="size-4.5 text-[#F95700]" />
                  Step 2: Select Payment Method &amp; Payment Protection
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* Payment Methods Grid */}
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment Method Options">
                  {PAYMENT_METHODS.map((option) => {
                    const avail = PAYMENT_AVAILABILITY[option.id] || { available: false, note: 'Unavailable' }
                    return (
                      <PaymentMethodCard
                        key={option.id}
                        method={option}
                        isSelected={option.id === methodId}
                        isAvailable={avail.available}
                        statusNote={avail.note}
                        onSelect={(id) => setMethodId(id as PaymentMethodId)}
                      />
                    )
                  })}
                </div>

                {/* M-Pesa Phone Input Container */}
                {method.kind === 'mobile_money' && methodId === 'mpesa' ? (
                  <div className="p-4 rounded-2xl border border-[#F95700] bg-[#FFF8F3] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-[#0F172A]">
                      <PhoneCall className="size-4 text-[#F95700]" />
                      <span>Enter Your M-Pesa Registered Phone Number</span>
                    </div>

                    <Field>
                      <div className="flex items-center gap-2">
                        <span className="flex h-11 items-center rounded-xl border border-slate-300 bg-white px-3 font-mono text-sm font-bold text-[#0F172A] shadow-2xs">
                          +255
                        </span>
                        <Input
                          id="pay-phone"
                          inputMode="tel"
                          value={rawPhone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="712 445 908"
                          aria-invalid={!!phoneError}
                          aria-describedby={phoneError ? 'phone-error-desc' : 'phone-helper-desc'}
                          className="font-mono text-sm font-bold bg-white h-11 rounded-xl flex-1 border-slate-300"
                        />
                      </div>

                      {phoneError ? (
                        <p id="phone-error-desc" className="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1">
                          ⚠️ {phoneError}
                        </p>
                      ) : (
                        <FieldDescription id="phone-helper-desc" className="text-xs text-[#64748B] mt-1.5 font-medium">
                          An instant USSD push prompt will be sent to{' '}
                          <strong className="text-[#0F172A] font-bold">{normalizeTanzaniaPhone(rawPhone).formattedDisplay || rawPhone}</strong>{' '}
                          to approve <strong className="text-[#0F172A] tnum">{formatTZS(authoritative.total)}</strong>.
                        </FieldDescription>
                      )}
                    </Field>
                  </div>
                ) : null}

                {/* Compact Buyer Protection Notice */}
                <BuyerProtectionCard variant="compact" />

                {/* Embedded Step 2 Order Summary */}
                <MobileOrderSummary
                  itemCount={active.reduce((sum, line) => sum + line.quantity, 0)}
                  subtotal={authoritative.subtotal}
                  shippingName={shipping.name}
                  shippingFee={authoritative.shippingFee}
                  couponDiscount={authoritative.couponDiscount}
                  total={authoritative.total}
                />
              </CardContent>

              <CardFooter className="bg-[#FAF9F5] border-t border-[#E2E8F0] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="w-full sm:w-auto font-bold text-xs rounded-xl h-11 border-[#E2E8F0] min-h-[44px]"
                >
                  Back to Delivery
                </Button>

                <Button
                  size="lg"
                  onClick={handleProceedToStep3}
                  className="w-full sm:w-auto font-extrabold bg-[#F95700] hover:bg-[#E04D00] text-white shadow-md px-8 h-12 text-sm rounded-xl min-h-[44px]"
                >
                  Review Order &amp; Pay
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ) : null}

          {/* STEP 3: Review Details & Authorize Settlement */}
          {step === 2 ? (
            <Card className="border-[#E2E8F0] bg-white rounded-2xl shadow-xs overflow-hidden">
              <CardHeader className="border-b border-[#E2E8F0] bg-[#FAF9F5] py-4 px-5 sm:px-6">
                <CardTitle className="text-base font-black text-[#0F172A] flex items-center gap-2">
                  <Zap className="size-4.5 text-[#F95700]" />
                  Step 3: Review Details &amp; Authorize Settlement
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* Delivery & Payment Review Grid */}
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  {/* Delivering To Card */}
                  <div className="rounded-2xl border border-[#E2E8F0] bg-slate-50 p-4 space-y-1">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                      <span className="font-extrabold text-[#0F172A]">Delivering To</span>
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="text-[#F95700] hover:underline font-bold text-xs"
                      >
                        Edit
                      </button>
                    </div>
                    <strong className="text-[#0F172A] text-sm block font-black">{address.recipient}</strong>
                    <span className="text-[#64748B] block font-mono font-medium">{normalizeTanzaniaPhone(rawPhone).formattedDisplay || address.phone}</span>
                    <span className="text-[#64748B] block leading-normal font-medium">
                      {address.street}, {address.ward}, {address.region}
                    </span>
                  </div>

                  {/* Payment & Freight Card */}
                  <div className="rounded-2xl border border-[#E2E8F0] bg-slate-50 p-4 space-y-1">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                      <span className="font-extrabold text-[#0F172A]">Payment &amp; Freight</span>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[#F95700] hover:underline font-bold text-xs"
                      >
                        Edit
                      </button>
                    </div>
                    <strong className="text-[#0F172A] text-sm block font-black">{method.name}</strong>
                    <span className="text-[#64748B] block font-semibold">{shipping.name}</span>
                    <span className="text-[#64748B] block text-[11px] font-medium">{shipping.detail}</span>
                  </div>
                </div>

                {/* ORDER LINE ITEMS */}
                <div className="space-y-3">
                  <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                    ORDER LINE ITEMS ({active.reduce((sum, line) => sum + line.quantity, 0)} ITEMS)
                  </span>
                  <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white">
                    {active.map((line) => (
                      <div key={line.id} className="flex items-center gap-3.5 p-3.5 hover:bg-slate-50 transition-colors">
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          <Image src={line.image} alt={line.title} fill sizes="56px" className="object-cover" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-xs font-bold text-[#0F172A] line-clamp-2">{line.title}</span>
                          <span className="text-[11px] text-[#64748B] font-medium">
                            Variant: {line.variantLabel} · Qty: <strong className="text-[#0F172A] font-bold">{line.quantity}</strong>
                          </span>
                        </div>
                        <span className="text-xs font-black tnum text-[#0F172A] shrink-0 pl-2">
                          {formatTZS(line.unitPrice * line.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3 Order Summary */}
                <MobileOrderSummary
                  itemCount={active.reduce((sum, line) => sum + line.quantity, 0)}
                  subtotal={authoritative.subtotal}
                  shippingName={shipping.name}
                  shippingFee={authoritative.shippingFee}
                  couponDiscount={authoritative.couponDiscount}
                  total={authoritative.total}
                />

                {/* AzamPay Buyer Protection Full Card */}
                <BuyerProtectionCard variant="full" />

                {/* Pending authorization status prompt */}
                {isAuthorizing && (
                  <div className="flex items-center gap-3 rounded-2xl border border-[#F95700]/40 bg-[#FFF8F3] p-4 text-xs font-bold text-[#F95700] animate-pulse">
                    <Loader2 className="size-5 shrink-0 animate-spin text-[#F95700]" />
                    <span>
                      Awaiting USSD PIN authorization on {normalizeTanzaniaPhone(rawPhone).formattedDisplay}... Please check your mobile phone handset.
                    </span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="bg-[#FAF9F5] border-t border-[#E2E8F0] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isAuthorizing}
                  className="w-full sm:w-auto font-bold text-xs rounded-xl h-11 border-[#E2E8F0] min-h-[44px]"
                >
                  Back to Payment
                </Button>

                <Button
                  size="lg"
                  onClick={authorizeAndPay}
                  disabled={isAuthorizing}
                  className="w-full sm:w-auto font-extrabold bg-[#F95700] hover:bg-[#E04D00] text-white shadow-lg px-8 h-12 text-sm rounded-xl min-h-[44px]"
                >
                  {isAuthorizing ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Authorizing Payment...
                    </>
                  ) : (
                    <>
                      <Lock className="size-4 mr-2" />
                      Authorize &amp; Pay {formatTZS(authoritative.total)}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ) : null}
        </div>

        {/* Right Sticky Sidebar Order Summary (Visible on desktop) */}
        <div className="hidden lg:flex flex-col gap-4 sticky top-20">
          <MobileOrderSummary
            itemCount={active.reduce((sum, line) => sum + line.quantity, 0)}
            subtotal={authoritative.subtotal}
            shippingName={shipping.name}
            shippingFee={authoritative.shippingFee}
            couponDiscount={authoritative.couponDiscount}
            total={authoritative.total}
          />

          {/* Promo Code Entry Box */}
          <Card className="border-[#E2E8F0] bg-white rounded-2xl shadow-xs">
            <CardContent className="p-4 space-y-2.5">
              <label className="text-xs font-bold text-[#64748B] flex items-center gap-1.5">
                <Tag className="size-3.5 text-[#F95700]" />
                Have a Promo Code or Coupon?
              </label>
              <form onSubmit={applyPromoCode} className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. LUMO10"
                  className="font-mono text-xs uppercase h-9 rounded-xl border-[#E2E8F0]"
                />
                <Button type="submit" size="sm" variant="outline" className="font-bold shrink-0 h-9 rounded-xl border-[#E2E8F0]">
                  Apply
                </Button>
              </form>
              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs font-bold text-[#137333] bg-[#E6F4EA] p-2 rounded-xl border border-[#A7F3D0]">
                  <span>Coupon &quot;{appliedCoupon.code}&quot; (-{appliedCoupon.discount}%)</span>
                  <span className="tnum">-{formatTZS(authoritative.couponDiscount)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <BuyerProtectionCard variant="full" />
        </div>
      </div>

      <AuthRequiredModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Sign In Required for Order Authorization"
        description="To authorize payment and complete your order with AzamPay buyer protection, please sign in or register an account."
        redirectUrl="/checkout"
      />
    </div>
  )
}
