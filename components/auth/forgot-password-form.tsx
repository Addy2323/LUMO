'use client'

import * as React from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/auth/schemas'
import { useForgotPassword } from '@/lib/auth/use-auth'

export function ForgotPasswordForm() {
  const forgot = useForgotPassword()
  const [sentTo, setSentTo] = React.useState<string | null>(null)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: '' },
  })

  const { errors } = form.formState

  if (sentTo) {
    return (
      <div className="flex flex-col gap-6">
        <Empty className="rounded-lg border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MailCheckIcon />
            </EmptyMedia>
            <EmptyTitle>Check your inbox or SMS</EmptyTitle>
            <EmptyDescription>
              If an account exists for <span className="font-medium">{sentTo}</span>, reset
              instructions are on the way. The link expires in 30 minutes.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSentTo(null)
              form.reset()
            }}
          >
            Use a different email or number
          </Button>
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/login">Back to sign in</Link>}
          />
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        await forgot.mutateAsync(values)
        setSentTo(values.identifier)
      })}
      noValidate
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <Field data-invalid={!!errors.identifier || undefined}>
          <FieldLabel htmlFor="identifier">Email or phone number</FieldLabel>
          <Input
            id="identifier"
            autoComplete="username"
            placeholder="you@example.co.tz or +255 712 345 678"
            aria-invalid={!!errors.identifier || undefined}
            {...form.register('identifier')}
          />
          <FieldDescription>
            We will send a reset link by email, or a code by SMS for phone accounts.
          </FieldDescription>
          <FieldError errors={[errors.identifier]} />
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3">
        <Button type="submit" size="lg" disabled={forgot.isPending}>
          {forgot.isPending && <Spinner data-icon="inline-start" />}
          Send reset instructions
        </Button>
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href="/login">Back to sign in</Link>}
        />
      </div>
    </form>
  )
}
