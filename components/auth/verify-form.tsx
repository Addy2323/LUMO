'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { OtpField } from '@/components/otp-field'
import { DEV_OTP, useResendOtp, useVerifyOtp } from '@/lib/auth/use-auth'
import { ROLES, roleHome, type Role } from '@/lib/roles'
import { maskPhone } from '@/lib/format'
import { ApiError } from '@/lib/api/client'

const RESEND_SECONDS = 45

export function VerifyForm() {
  const router = useRouter()
  const params = useSearchParams()
  const verify = useVerifyOtp()
  const resend = useResendOtp()

  const roleParam = params.get('role')
  const role: Role = ROLES.includes(roleParam as Role) ? (roleParam as Role) : 'customer'
  const channel = params.get('channel') === 'email' ? 'email' : 'sms'
  const destination = params.get('destination') ?? '+255 712 345 678'
  const fullName = params.get('fullName') ?? ''
  const email = params.get('email') ?? ''

  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = React.useState(RESEND_SECONDS)

  React.useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  async function submit(value: string) {
    setError(null)
    try {
      const user = await verify.mutateAsync({ code: value, role, fullName, email, phone: destination })
      toast.success('Account verified')
      router.push(roleHome(user.role))
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : 'We could not verify that code. Try again.',
      )
      setCode('')
    }
  }

  async function handleResend() {
    await resend.mutateAsync({ destination })
    setSecondsLeft(RESEND_SECONDS)
    setCode('')
    setError(null)
    toast.success(channel === 'sms' ? 'New code sent by SMS' : 'New code sent by email')
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void submit(code)
      }}
      className="flex flex-col gap-6"
    >
      <Alert>
        <AlertTitle>Development mode</AlertTitle>
        <AlertDescription>
          SMS delivery is not connected yet. Use the code{' '}
          <span className="font-mono font-medium">{DEV_OTP}</span> to continue.
        </AlertDescription>
      </Alert>

      <Field data-invalid={!!error || undefined}>
        <FieldLabel htmlFor="otp">Verification code</FieldLabel>
        <OtpField
          id="otp"
          value={code}
          onChange={(value) => {
            setCode(value)
            if (error) setError(null)
          }}
          onComplete={(value) => void submit(value)}
          disabled={verify.isPending}
          invalid={!!error}
          autoFocus
          aria-describedby="otp-description"
        />
        <FieldDescription id="otp-description">
          Sent to {channel === 'sms' ? maskPhone(destination) : destination}
        </FieldDescription>
        <FieldError>{error}</FieldError>
      </Field>

      <div className="flex flex-col gap-3">
        <Button type="submit" size="lg" disabled={verify.isPending || code.length < 6}>
          {verify.isPending && <Spinner data-icon="inline-start" />}
          Verify and continue
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => void handleResend()}
          disabled={secondsLeft > 0 || resend.isPending}
        >
          {resend.isPending && <Spinner data-icon="inline-start" />}
          {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
        </Button>
      </div>
    </form>
  )
}
