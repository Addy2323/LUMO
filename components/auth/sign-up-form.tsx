'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, KeyRound, Mail, Phone, Truck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { PasswordInput } from '@/components/auth/password-input'
import { signUpSchema, type SignUpInput } from '@/lib/auth/schemas'
import { useSignUp } from '@/lib/auth/use-auth'
import { type Role } from '@/lib/roles'
import { ApiError } from '@/lib/api/client'
import { useT } from '@/lib/i18n/use-locale'

const ACCOUNT_TYPES: { role: Role; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { role: 'customer', label: 'Buyer', desc: 'Shop & import products in TZS', icon: User },
  { role: 'supplier', label: 'Supplier', desc: 'Direct factory listing from China/Dubai', icon: Building2 },
  { role: 'logistics', label: 'Logistics', desc: 'Deliver packages & freight', icon: Truck },
]

export function SignUpForm() {
  const t = useT()
  const router = useRouter()
  const signUp = useSignUp()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      role: 'customer',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    mode: 'onSubmit',
  })

  const { errors } = form.formState
  const role = form.watch('role') as Role

  async function onSubmit(values: SignUpInput) {
    setFormError(null)
    try {
      const result = await signUp.mutateAsync(values)
      const params = new URLSearchParams({
        role: values.role,
        destination: result.destination,
        channel: result.channel,
        fullName: values.fullName,
        email: values.email,
      })
      router.push(`/verify?${params.toString()}`)
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          form.setError(field as keyof SignUpInput, { message })
        }
        return
      }
      setFormError('We could not create your account. Please try again.')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3.5 font-sans">
      {formError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertTitle>{t('auth.signUpTitle')}</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* Visual Role Picker */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Account Type</span>
        <div className="grid grid-cols-3 gap-1.5">
          {ACCOUNT_TYPES.map((type) => {
            const Icon = type.icon
            const isSelected = role === type.role
            return (
              <button
                key={type.role}
                type="button"
                onClick={() => form.setValue('role', type.role)}
                className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-lumo-orange-light border-primary text-primary font-bold shadow-xs'
                    : 'bg-[#F0F5FD] hover:bg-slate-100 text-slate-600 border-[#DCE7F5]'
                }`}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="text-xs font-bold">{type.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <FieldGroup className="gap-2.5">
        <Field data-invalid={!!errors.fullName || undefined}>
          <FieldLabel htmlFor="fullName" className="font-extrabold text-xs text-[#0F172A] mb-1">
            {t('account.fullName')}
          </FieldLabel>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 size-4 text-[#64748B] pointer-events-none" />
            <Input
              id="fullName"
              autoComplete="name"
              placeholder="Amina Hassan"
              className="pl-10 h-10 text-xs font-semibold text-[#0F172A] bg-[#F0F5FD] border-[#DCE7F5] rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
              aria-invalid={!!errors.fullName || undefined}
              {...form.register('fullName')}
            />
          </div>
          <FieldError errors={[errors.fullName]} />
        </Field>

        <Field data-invalid={!!errors.email || undefined}>
          <FieldLabel htmlFor="email" className="font-extrabold text-xs text-[#0F172A] mb-1">
            {t('account.email')}
          </FieldLabel>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 size-4 text-[#64748B] pointer-events-none" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.co.tz"
              className="pl-10 h-10 text-xs font-semibold text-[#0F172A] bg-[#F0F5FD] border-[#DCE7F5] rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
              aria-invalid={!!errors.email || undefined}
              {...form.register('email')}
            />
          </div>
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.phone || undefined}>
          <FieldLabel htmlFor="phone" className="font-extrabold text-xs text-[#0F172A] mb-1">
            {t('account.phone')}
          </FieldLabel>
          <div className="relative flex items-center">
            <Phone className="absolute left-3.5 size-4 text-[#64748B] pointer-events-none" />
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+255 712 345 678"
              className="pl-10 h-10 text-xs font-semibold text-[#0F172A] bg-[#F0F5FD] border-[#DCE7F5] rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
              aria-invalid={!!errors.phone || undefined}
              {...form.register('phone')}
            />
          </div>
          <FieldError errors={[errors.phone]} />
        </Field>

        <Field data-invalid={!!errors.password || undefined}>
          <FieldLabel htmlFor="new-password" className="font-extrabold text-xs text-[#0F172A] mb-1">
            {t('auth.password')}
          </FieldLabel>
          <div className="relative flex items-center">
            <KeyRound className="absolute left-3.5 size-4 text-[#64748B] pointer-events-none z-10" />
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="pl-10 h-10 text-xs font-semibold text-[#0F172A] bg-[#F0F5FD] border-[#DCE7F5] rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
              aria-invalid={!!errors.password || undefined}
              {...form.register('password')}
            />
          </div>
          <FieldError errors={[errors.password]} />
        </Field>

        <Field data-invalid={!!errors.confirmPassword || undefined}>
          <FieldLabel htmlFor="confirm-password" className="font-extrabold text-xs text-[#0F172A] mb-1">
            Confirm password
          </FieldLabel>
          <div className="relative flex items-center">
            <KeyRound className="absolute left-3.5 size-4 text-[#64748B] pointer-events-none z-10" />
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              placeholder="Re-enter password"
              className="pl-10 h-10 text-xs font-semibold text-[#0F172A] bg-[#F0F5FD] border-[#DCE7F5] rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
              aria-invalid={!!errors.confirmPassword || undefined}
              {...form.register('confirmPassword')}
            />
          </div>
          <FieldError errors={[errors.confirmPassword]} />
        </Field>

        <Field orientation="horizontal" data-invalid={!!errors.acceptTerms || undefined}>
          <Checkbox
            id="acceptTerms"
            checked={form.watch('acceptTerms')}
            aria-invalid={!!errors.acceptTerms || undefined}
            onCheckedChange={(checked) =>
              form.setValue('acceptTerms', checked === true, {
                shouldValidate: form.formState.isSubmitted,
              })
            }
            className="size-4.5 rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <FieldContent>
            <FieldLabel htmlFor="acceptTerms" className="font-semibold text-xs text-[#64748B]">
              <span className="leading-tight">
                I agree to the Lumo{' '}
                <Link href="/terms" className="text-primary font-bold hover:underline">
                  terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary font-bold hover:underline">
                  privacy
                </Link>
                .
              </span>
            </FieldLabel>
            <FieldError errors={[errors.acceptTerms]} />
          </FieldContent>
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        disabled={signUp.isPending}
        className="h-11 w-full font-extrabold text-xs text-white bg-primary hover:bg-[#E04E00] rounded-xl shadow-md shadow-orange-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-1"
      >
        {signUp.isPending && <Spinner data-icon="inline-start" className="mr-2 text-white" />}
        {t('auth.signUpSubmit')}
      </Button>
    </form>
  )
}
