'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useSessionStore } from '@/lib/stores/session-store'

type SystemUser = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  companyName: string | null
  accountStatus: string
  kycStatus: string
  tinNumber?: string | null
  vrnNumber?: string | null
  city?: string | null
  createdAt?: string
}

const ROLE_OPTIONS = [
  { value: 'BUYER', label: 'Buyer / Customer', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  { value: 'SUPPLIER', label: 'Verified Supplier', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'SALES', label: 'Sales Department', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'LOGISTICS', label: 'Logistics Partner', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'AGENT', label: 'Sourcing Agent', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'ADMIN', label: 'Administrator', color: 'bg-orange-50 text-orange-700 border-orange-200 font-extrabold' },
]

export default function AdminUsersPage() {
  const currentUser = useSessionStore((s) => s.user)

  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')

  // Add User Modal & Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // New User Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(true)
  const [role, setRole] = useState('BUYER')
  const [companyName, setCompanyName] = useState('')

  // Edit User Modal & Form State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editRole, setEditRole] = useState('BUYER')
  const [editCompanyName, setEditCompanyName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editAccountStatus, setEditAccountStatus] = useState('ACTIVE')
  const [editKycStatus, setEditKycStatus] = useState('VERIFIED')
  const [isUpdating, setIsUpdating] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Credentials Display Modal State
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string
    email: string
    password: string
    role: string
    companyName: string
  } | null>(null)

  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Fetch real users from API
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch system users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  function generateRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#'
    let pass = ''
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pass)
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!name || !email || !password) {
      setFormError('Please fill in all required fields (Name, Email, Password).')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role,
          companyName: companyName || `${name} Enterprises`,
          kycStatus: 'VERIFIED',
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setFormError(data.error || 'Failed to create user')
        return
      }

      setCreatedCredentials({
        name,
        email,
        password,
        role,
        companyName: companyName || `${name} Enterprises`,
      })

      setName('')
      setEmail('')
      setPhone('')
      setPassword('')
      setCompanyName('')
      setRole('BUYER')
      setShowAddUserModal(false)
      setShowCredentialsModal(true)

      fetchUsers()
    } catch (err: any) {
      setFormError('Network error creating user. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOpenEditModal(u: SystemUser) {
    setEditingUser(u)
    setEditName(u.name)
    setEditEmail(u.email)
    setEditPhone(u.phone || '')
    setEditRole(u.role)
    setEditCompanyName(u.companyName || '')
    setEditAccountStatus(u.accountStatus || 'ACTIVE')
    setEditKycStatus(u.kycStatus || 'VERIFIED')
    setEditPassword('')
    setEditError(null)
    setShowEditModal(true)
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return

    setEditError(null)
    setIsUpdating(true)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editName,
          email: editEmail,
          phone: editPhone,
          role: editRole,
          companyName: editCompanyName,
          accountStatus: editAccountStatus,
          kycStatus: editKycStatus,
          password: editPassword.trim() ? editPassword : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setEditError(data.error || 'Failed to update user profile')
        return
      }

      setShowEditModal(false)
      setEditingUser(null)
      fetchUsers()
    } catch (err) {
      setEditError('Network error updating user. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to remove ${userName} from the system?`)) return

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.error) {
        alert(data.error)
        return
      }

      setUsers(users.filter((u) => u.id !== userId))
    } catch (err) {
      alert('Failed to delete user.')
    }
  }

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      search.trim() === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.companyName && u.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (u.phone && u.phone.includes(search))

    const matchesRole = roleFilter === 'ALL' || u.role.toUpperCase() === roleFilter.toUpperCase()

    return matchesSearch && matchesRole
  })

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto py-2">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">System User &amp; Credentials Management</h1>
          <p className="text-xs text-muted-foreground">
            Create, manage, edit, and assign system credentials for Buyers, Suppliers, Sales, Logistics, Agents, and Administrators.
          </p>
        </div>

        <Button
          onClick={() => {
            generateRandomPassword()
            setShowAddUserModal(true)
          }}
          className="bg-primary hover:bg-primary/80 text-white font-bold gap-2 text-xs shadow-md shadow-orange-500/20"
        >
          <UserPlus className="size-4" /> + Add New System User
        </Button>
      </div>

      {/* Overview Banner */}
      <Card className="border-brand-500/20 bg-brand-50/30 dark:bg-brand-950/20">
        <CardContent className="flex items-center justify-between p-4 text-xs">
          <div className="flex items-center gap-3 text-brand-900 dark:text-brand-300">
            <ShieldCheck className="size-5 shrink-0 text-primary" />
            <span>
              Admin Security Controls: Passwords are encrypted with bcrypt (cost 12). Created credentials can be updated or provided directly to team members.
            </span>
          </div>

          <Button variant="outline" size="sm" onClick={fetchUsers} className="text-xs gap-1.5 h-8">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Users Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Registered System Users ({filteredUsers.length})
            </CardTitle>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-44 p-2 text-xs border rounded-lg bg-background font-medium"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Administrators</option>
              <option value="BUYER">Buyers / Customers</option>
              <option value="SUPPLIER">Suppliers</option>
              <option value="SALES">Sales Dept</option>
              <option value="LOGISTICS">Logistics Partners</option>
              <option value="AGENT">Sourcing Agents</option>
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                Loading system users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">No users found.</p>
                <p>Click "+ Add New System User" above to create an account for any role.</p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const roleConfig = ROLE_OPTIONS.find((r) => r.value === u.role.toUpperCase()) || {
                  label: u.role,
                  color: 'bg-slate-100 text-slate-700',
                }

                return (
                  <div
                    key={u.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{u.name}</span>
                        {u.companyName && (
                          <span className="text-xs text-muted-foreground font-medium">({u.companyName})</span>
                        )}
                        <Badge className={`text-[10px] uppercase font-bold border px-2 ${roleConfig.color}`}>
                          {roleConfig.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                        <span className="font-mono text-foreground font-medium">{u.email}</span>
                        {u.phone && <span>· {u.phone}</span>}
                        <span className="text-[11px] text-slate-400">
                          Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditModal(u)}
                        className="text-xs font-bold border-brand-200 text-primary hover:bg-orange-50 hover:text-[#E85F00] dark:hover:bg-orange-950/30 gap-1 h-8"
                      >
                        <Pencil className="size-3.5" /> Edit User
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 gap-1 h-8"
                      >
                        <Trash2 className="size-3.5" /> Remove User
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
         1. MODAL: EDIT & UPDATE USER
         ========================================================================= */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-foreground">
              <Pencil className="size-5 text-primary" />
              Edit User Profile &amp; Role
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update user contact details, assigned system role, or reset account password.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4 pt-2 text-xs">
              {editError && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-medium">
                  {editError}
                </div>
              )}

              <div>
                <label className="font-bold block mb-1">System Role *</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-background text-xs font-bold"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} ({r.value})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Full Name *</label>
                  <Input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Email Address *</label>
                  <Input
                    required
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Phone Number</label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Company / Organization</label>
                  <Input
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Reset Password (Optional)</label>
                <Input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">Min 6 characters. Enter a new password only if resetting.</span>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-primary hover:bg-primary/80 text-white font-bold text-xs"
                >
                  {isUpdating ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
         2. MODAL: ADD NEW SYSTEM USER
         ========================================================================= */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-foreground">
              <UserPlus className="size-5 text-primary" />
              Add New System User
            </DialogTitle>
            <DialogDescription className="text-xs">
              Create an account with any system role. Credentials will be displayed for sharing upon submission.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 pt-2 text-xs">
            {formError && (
              <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <div>
              <label className="font-bold block mb-1">System Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 border rounded-lg bg-background text-xs font-bold"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} ({r.value})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Amani Joseph"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Email Address *</label>
                <Input
                  required
                  type="email"
                  placeholder="amani@company.co.tz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Phone Number (Optional)</label>
                <Input
                  placeholder="+255 712 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Company / Organization</label>
                <Input
                  placeholder="e.g. Amani Traders Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold">Initial Login Password *</label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Generate Random
                </button>
              </div>
              <div className="relative">
                <Input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 pr-10 text-xs font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setShowAddUserModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/80 text-white font-bold text-xs"
              >
                {isSubmitting ? 'Creating User...' : 'Create System User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
         3. MODAL: USER CREDENTIALS CREATED DISPLAY
         ========================================================================= */}
      <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
        <DialogContent className="sm:max-w-md p-6 bg-[#0f172a] text-white border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-white">
              <KeyRound className="size-5 text-amber-400" />
              User Credentials Created!
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300">
              Provide these credentials to the user so they can log in to their assigned role dashboard.
            </DialogDescription>
          </DialogHeader>

          {createdCredentials && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Role</span>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs font-bold">
                    {createdCredentials.role}
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">User Email / Login ID</span>
                    <span className="text-sm font-bold text-white">{createdCredentials.email}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(createdCredentials.email, 'email')}
                    className="h-8 text-amber-400 hover:text-amber-300 hover:bg-slate-800"
                  >
                    {copiedField === 'email' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Password</span>
                    <span className="text-sm font-bold text-amber-400 tracking-wider">{createdCredentials.password}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(createdCredentials.password, 'password')}
                    className="h-8 text-amber-400 hover:text-amber-300 hover:bg-slate-800"
                  >
                    {copiedField === 'password' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => {
                    const allText = `Lumo System Login Credentials:\nRole: ${createdCredentials.role}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nLogin URL: ${window.location.origin}/login`
                    handleCopy(allText, 'all')
                  }}
                  variant="outline"
                  className="text-xs bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 gap-1.5"
                >
                  {copiedField === 'all' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  {copiedField === 'all' ? 'Copied All!' : 'Copy All Credentials'}
                </Button>

                <Button
                  onClick={() => setShowCredentialsModal(false)}
                  className="bg-primary hover:bg-primary/80 text-white font-bold text-xs"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
