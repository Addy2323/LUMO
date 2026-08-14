'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Mail, KeyRound } from 'lucide-react'
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
import { signInSchema, type SignInInput } from '@/lib/auth/schemas'
import { useSignIn } from '@/lib/auth/use-auth'
import { roleHome, type Role } from '@/lib/roles'
import { ApiError } from '@/lib/api/client'
import { useT } from '@/lib/i18n/use-locale'

export function SignInForm() {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const signIn = useSignIn()
  const [role, setRole] = React.useState<Role>('customer')
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '', remember: true },
    mode: 'onSubmit',
  })

  const { errors } = form.formState

  async function onSubmit(values: SignInInput) {
    setFormError(null)
    try {
      const user = await signIn.mutateAsync({ ...values, role })
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}`)
      const redirectUrl = searchParams.get('redirect')
      if (redirectUrl) {
        router.push(redirectUrl)
      } else {
        router.push(roleHome(user.role))
      }
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : t('auth.invalidCredentials'),
      )
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 font-sans">
      {formError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertTitle>{t('auth.signInTitle')}</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-3.5">
        {/* Email Address Field */}
        <Field data-invalid={!!errors.identifier || undefined}>
          <FieldLabel htmlFor="identifier" className="font-extrabold text-xs text-[#0F172A] mb-1">
            {t('auth.email')}
          </FieldLabel>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 size-4 text-[#64748B] pointer-events-none z-10" />
            <Input
              id="identifier"
              autoComplete="username"
              placeholder="admin@lumo.co.tz"
              className="pl-10 h-11 text-xs font-semibold text-[#0F172A] bg-[#F0F5FD] dark:bg-slate-900 border-[#DCE7F5] dark:border-slate-800 rounded-xl focus-visible:ring-1 focus-visible:ring-[#F95700] placeholder:text-slate-400"
              aria-invalid={!!errors.identifier || undefined}
              {...form.register('identifier')}
            />
          </div>
          <FieldError errors={[errors.identifier]} />
        </Field>

        {/* Password Field */}
        <Field data-invalid={!!errors.password || undefined}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <FieldLabel htmlFor="password" className="font-extrabold text-xs text-[#0F172A]">
              {t('auth.password')}
            </FieldLabel>
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-[#F95700] hover:underline underline-offset-4"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <div className="relative flex items-center">
            <KeyRound className="absolute left-3.5 size-4 text-[#64748B] pointer-events-none z-10" />
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="pl-10 h-11 text-xs font-semibold text-[#0F172A] bg-[#F0F5FD] dark:bg-slate-900 border-[#DCE7F5] dark:border-slate-800 rounded-xl focus-visible:ring-1 focus-visible:ring-[#F95700] placeholder:text-slate-400"
              aria-invalid={!!errors.password || undefined}
              {...form.register('password')}
            />
          </div>
          <FieldError errors={[errors.password]} />
        </Field>

        {/* Remember Me Checkbox */}
        <Field orientation="horizontal" className="pt-0.5">
          <Checkbox
            id="remember"
            checked={form.watch('remember')}
            onCheckedChange={(checked) => form.setValue('remember', checked === true)}
            className="size-4.5 rounded-md border-slate-300 data-[state=checked]:bg-[#F95700] data-[state=checked]:border-[#F95700]"
          />
          <FieldContent>
            <FieldLabel htmlFor="remember" className="font-semibold text-xs text-[#64748B] cursor-pointer">
              {t('auth.keepSignedIn')}
            </FieldLabel>
          </FieldContent>
        </Field>
      </FieldGroup>

      {/* Primary Submit Button */}
      <Button
        type="submit"
        disabled={signIn.isPending}
        className="h-12 w-full font-extrabold text-sm text-white bg-[#F95700] hover:bg-[#E04E00] rounded-xl shadow-md shadow-orange-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-1"
      >
        {signIn.isPending && <Spinner data-icon="inline-start" className="mr-2 text-white" />}
        {t('auth.signInSubmit')}
      </Button>
    </form>
  )
}
