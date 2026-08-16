'use client'

/**
 * Session store — server-synchronized.
 * The server session (JWT + database Session row) is authoritative.
 * This store caches the current user info for client rendering.
 * Role switching goes through POST /api/session/active-role, NOT client state.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/lib/roles'

export type SessionUser = {
  id: string
  fullName: string
  email: string
  phone: string
  role: Role
  activeRole: Role
  verified: boolean
  avatarUrl: string | null
}

type SessionState = {
  user: SessionUser | null
  signIn: (user: SessionUser) => void
  signOut: () => void
  /** Update cached activeRole after server-validated role switch */
  setActiveRole: (role: Role) => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      signIn: (user) => set({ user }),
      signOut: () => set({ user: null }),
      setActiveRole: (role) => {
        const current = get().user
        if (current) {
          set({ user: { ...current, activeRole: role } })
        }
      },
    }),
    { name: 'lumo.session.v2' },
  ),
)
