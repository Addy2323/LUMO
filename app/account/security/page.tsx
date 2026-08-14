'use client'

import { useState } from 'react'
import { ShieldCheck, Lock, Smartphone, KeyRound, Monitor, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function CustomerSecurityPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [is2FAEnabled, setIs2FAEnabled] = useState(true)

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    toast.success('Account password updated successfully!')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  function handleToggle2FA() {
    setIs2FAEnabled(!is2FAEnabled)
    toast.success(`Two-Factor Authentication (2FA) ${!is2FAEnabled ? 'ENABLED' : 'DISABLED'}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Security &amp; Account Protection</h1>
        <p className="text-sm text-muted-foreground">
          Manage your password, enable two-factor authentication (2FA), and review active sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Reset Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <KeyRound className="size-5 text-brand-500" />
              Change Password
            </CardTitle>
            <CardDescription className="text-xs">
              Ensure your account uses a strong, unique password to protect your company's order data.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Current Password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Confirm New Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs">
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 2FA & Session Management */}
        <div className="space-y-6">
          {/* 2FA Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Smartphone className="size-5 text-emerald-500" />
                  Two-Factor Authentication (2FA)
                </CardTitle>
                <Badge className={is2FAEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'}>
                  {is2FAEnabled ? 'ENABLED' : 'DISABLED'}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Protect payouts and order authorizations with Vodacom SMS / Google Authenticator codes.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button
                variant={is2FAEnabled ? 'outline' : 'default'}
                onClick={handleToggle2FA}
                className="w-full text-xs font-bold"
              >
                {is2FAEnabled ? 'Disable 2FA Protection' : 'Enable 2FA Protection'}
              </Button>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Monitor className="size-4 text-brand-500" />
                Active Device Sessions
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border bg-muted/40 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground">Windows PC · Chrome Browser</p>
                  <p className="text-[11px] text-muted-foreground">Dar es Salaam, Tanzania · Current Session</p>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-600 font-bold">
                  Active Now
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
