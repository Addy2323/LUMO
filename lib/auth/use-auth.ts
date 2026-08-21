'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { useSessionStore, type SessionUser } from '@/lib/stores/session-store'
import { normalizeRole, type Role } from '@/lib/roles'
import type { ForgotPasswordInput, SignInInput, SignUpInput } from '@/lib/auth/schemas'
import { useRouter } from 'next/navigation'

export const DEV_OTP = '123456'

type SignInPayload = SignInInput & { role: Role }
type VerifyPayload = {
  code: string
  role: Role
  fullName?: string
  email?: string
  phone?: string
}

/** POST /api/auth/login */
export function useSignIn() {
  const signIn = useSessionStore((s) => s.signIn)

  return useMutation({
    mutationFn: async (payload: SignInPayload) => {
      const isEmail = payload.identifier.includes('@')
      const body = {
        email: isEmail ? payload.identifier : `${payload.identifier.replace(/[^0-9]/g, '')}@lumo.co.tz`,
        password: payload.password,
      }

      const res = await apiRequest<{
        success: boolean
        user?: any
        requirePhoneVerification?: boolean
        redirect?: string
      }, typeof body>('/api/auth/login', {
        method: 'POST',
        body,
      })

      const rawRole = res.user?.role || payload.role
      const role = normalizeRole(rawRole)

      return {
        id: res.user?.id || '',
        fullName: res.user?.name || 'User',
        email: res.user?.email || body.email,
        phone: res.user?.phone || '',
        role,
        activeRole: role,
        verified: !res.requirePhoneVerification,
        avatarUrl: null,
        companyName: res.user?.companyName || null,
        kycStatus: res.user?.kycStatus || null,
        redirect: res.redirect,
      } as SessionUser & { redirect?: string }
    },
    onSuccess: (user) => {
      signIn(user)
    },
  })
}

/** POST /api/auth/register */
export function useSignUp() {
  return useMutation({
    mutationFn: async (payload: SignUpInput) => {
      const res = await apiRequest<{ success: boolean; user: any }, any>('/api/auth/register', {
        method: 'POST',
        body: {
          name: payload.fullName,
          email: payload.email,
          password: payload.password,
          phone: payload.phone,
          companyName: (payload as any).companyName,
          role: payload.role.toUpperCase(),
        },
      })
      return { userId: res.user.id, channel: 'sms' as const, destination: payload.phone || payload.email }
    },
  })
}

/** POST /api/auth/otp/verify */
export function useVerifyOtp() {
  const signIn = useSessionStore((s) => s.signIn)

  return useMutation({
    mutationFn: async (payload: VerifyPayload) => {
      const identifier = payload.email || payload.phone || ''
      const res = await apiRequest<{ success: boolean; user: any }, any>('/api/auth/otp/verify', {
        method: 'POST',
        body: {
          identifier,
          code: payload.code,
          purpose: 'REGISTER',
        },
      })

      const role = (res.user.role.toLowerCase() as Role) || payload.role
      return {
        id: res.user.id,
        fullName: res.user.name,
        email: res.user.email,
        phone: res.user.phone || '',
        role,
        activeRole: role,
        verified: true,
        avatarUrl: null,
        companyName: res.user.companyName || null,
        kycStatus: res.user.kycStatus || null,
      } as SessionUser
    },
    onSuccess: (user) => {
      signIn(user)
    },
  })
}

/** POST /api/auth/otp/request */
export function useResendOtp() {
  return useMutation({
    mutationFn: (payload: { destination: string }) =>
      apiRequest<{ success: boolean; message: string }, { identifier: string }>('/api/auth/otp/request', {
        method: 'POST',
        body: { identifier: payload.destination },
      }),
  })
}

/** POST /api/auth/password/forgot */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordInput) =>
      apiRequest<{ success: boolean; message: string }, { email: string }>('/api/auth/password/forgot', {
        method: 'POST',
        body: { email: payload.identifier },
      }),
  })
}

// ──────────────────────────────────────────────
// Server-Backed Role Management Hooks
// ──────────────────────────────────────────────

type RoleInfo = {
  role: string
  approvedAt: string | null
}

type RolesResponse = {
  userId: string
  activeRole: string
  roles: RoleInfo[]
}

/** GET /api/session/roles — fetch user's approved roles */
export function useRoles() {
  return useQuery<RolesResponse>({
    queryKey: ['session', 'roles'],
    queryFn: () => apiRequest<RolesResponse>('/api/session/roles'),
    staleTime: 60_000,
  })
}

type SwitchRoleResponse = {
  success: boolean
  activeRole: string
  redirectTo: string
}

/** POST /api/session/active-role — server-validated role switch */
export function useSwitchRole() {
  const setActiveRole = useSessionStore((s) => s.setActiveRole)
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (role: string) => {
      return apiRequest<SwitchRoleResponse, { role: string }>('/api/session/active-role', {
        method: 'POST',
        body: { role },
      })
    },
    onSuccess: (data) => {
      setActiveRole(data.activeRole.toLowerCase() as Role)
      queryClient.invalidateQueries({ queryKey: ['session'] })
      router.push(data.redirectTo)
    },
  })
}
