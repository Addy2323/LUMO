'use client'

/**
 * Mock session store for development only.
 * There is no real authentication yet — the shape of `MockUser` mirrors the
 * expected `GET /me` API response so it can be swapped for a real session later.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/lib/roles'

export type MockUser = {
  id: string
  fullName: string
  email: string
  phone: string
  role: Role
  verified: boolean
  avatarUrl: string | null
}

type SessionState = {
  user: MockUser | null
  signIn: (user: MockUser) => void
  signOut: () => void
  /** Dev-tools only: jump between dashboards without re-authenticating. */
  switchRole: (role: Role) => void
}

export const DEMO_USERS: Record<Role, MockUser> = {
  customer: {
    id: 'usr_cus_001',
    fullName: 'Amina Hassan',
    email: 'amina.hassan@example.co.tz',
    phone: '+255 712 445 908',
    role: 'customer',
    verified: true,
    avatarUrl: null,
  },
  supplier: {
    id: 'usr_sup_001',
    fullName: 'Joseph Mwakalinga',
    email: 'joseph@kilimanjaroelectronics.co.tz',
    phone: '+255 754 220 187',
    role: 'supplier',
    verified: true,
    avatarUrl: null,
  },
  sales: {
    id: 'usr_sal_001',
    fullName: 'Neema Kibona',
    email: 'neema.kibona@lumo.co.tz',
    phone: '+255 768 331 240',
    role: 'sales',
    verified: true,
    avatarUrl: null,
  },
  logistics: {
    id: 'usr_log_001',
    fullName: 'Baraka Freight Ltd',
    email: 'dispatch@barakafreight.co.tz',
    phone: '+255 787 664 019',
    role: 'logistics',
    verified: true,
    avatarUrl: null,
  },
  agent: {
    id: 'usr_agt_001',
    fullName: 'Kelvin Temba',
    email: 'kelvin.temba@lumoagent.co.tz',
    phone: '+255 754 889 012',
    role: 'agent',
    verified: true,
    avatarUrl: null,
  },
  admin: {
    id: 'usr_adm_001',
    fullName: 'Sarah Mkapa',
    email: 'sarah.mkapa@lumo.co.tz',
    phone: '+255 715 908 442',
    role: 'admin',
    verified: true,
    avatarUrl: null,
  },
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      signIn: (user) => set({ user }),
      signOut: () => set({ user: null }),
      switchRole: (role) => {
        const current = get().user
        set({ user: current ? { ...DEMO_USERS[role] } : { ...DEMO_USERS[role] } })
      },
    }),
    { name: 'lumo.session.mock' },
  ),
)
