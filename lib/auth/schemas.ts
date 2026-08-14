import { z } from 'zod'
import { ROLES } from '@/lib/roles'

/** Tanzanian mobile numbers: +255 7XX XXX XXX or 07XX XXX XXX. */
const tzPhone = z
  .string()
  .trim()
  .regex(/^(?:\+255|0)[67]\d{8}$/, 'Enter a valid Tanzanian number, e.g. +255 712 345 678')

export const signInSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Enter your email address or phone number')
    .refine(
      (value) => value.includes('@') || /^(?:\+255|0)[67]\d{8}$/.test(value.replace(/\s+/g, '')),
      'Enter a valid email address or Tanzanian phone number',
    ),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean(),
})
export type SignInInput = z.infer<typeof signInSchema>

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Enter your full name'),
    email: z.string().trim().email('Enter a valid email address'),
    phone: tzPhone,
    role: z.enum(ROLES),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[a-zA-Z]/, 'Include at least one letter')
      .regex(/\d/, 'Include at least one number'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: 'You must accept the terms to continue',
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
export type SignUpInput = z.infer<typeof signUpSchema>

export const verifySchema = z.object({
  code: z.string().length(6, 'Enter the 6-digit code'),
})
export type VerifyInput = z.infer<typeof verifySchema>

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email address or phone number'),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
