'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  FileText,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Upload,
  UserCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSupplierStore } from '@/lib/stores/supplier-store'
import { toast } from 'sonner'

export default function SupplierCompanyKYCPage() {
  const { profile, updateProfile, addKYCDocument } = useSupplierStore()

  // Form states
  const [companyName, setCompanyName] = useState(profile.companyName)
  const [tinNumber, setTinNumber] = useState(profile.tinNumber)
  const [vrnNumber, setVrnNumber] = useState(profile.vrnNumber)
  const [brelaRegistrationNumber, setBrelaRegistrationNumber] = useState(profile.brelaRegistrationNumber)
  const [businessAddress, setBusinessAddress] = useState(profile.businessAddress)
  const [contactEmail, setContactEmail] = useState(profile.contactEmail)
  const [contactPhone, setContactPhone] = useState(profile.contactPhone)

  // Bank & Mobile Money
  const [bankName, setBankName] = useState(profile.bankAccount.bankName)
  const [accountNumber, setAccountNumber] = useState(profile.bankAccount.accountNumber)
  const [accountName, setAccountName] = useState(profile.bankAccount.accountName)
  const [mobileProvider, setMobileProvider] = useState(profile.mobilePayout.provider)
  const [mobilePhone, setMobilePhone] = useState(profile.mobilePayout.phoneNumber)

  // New Doc Upload state
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState('Tax Clearance Certificate')

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    updateProfile({
      companyName,
      tinNumber,
      vrnNumber,
      brelaRegistrationNumber,
      businessAddress,
      contactEmail,
      contactPhone,
      bankAccount: { bankName, accountNumber, accountName },
      mobilePayout: { provider: mobileProvider, phoneNumber: mobilePhone },
    })
    toast.success('Company profile & payout details updated!')
  }

  function handleUploadDoc(e: React.FormEvent) {
    e.preventDefault()
    if (!docName.trim()) {
      toast.error('Document file name required')
      return
    }

    addKYCDocument({ name: docName.trim(), type: docType })
    toast.success(`Uploaded ${docType} for compliance verification!`)
    setDocName('')
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Company Profile &amp; KYC Verification</h1>
            {profile.kycStatus === 'verified' ? (
              <Badge className="bg-emerald-600 text-white font-bold gap-1 text-xs">
                <BadgeCheck className="size-3.5" />
                TRA &amp; BRELA Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-500 border-amber-500/40 font-bold text-xs">
                Under Regulatory Review
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Maintain your legal business credentials, TRA tax identification, and settlement payout accounts.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
        {/* Legal Identity Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Building2 className="size-5 text-brand-500" />
              Legal Business &amp; TRA Registration
            </CardTitle>
            <CardDescription className="text-xs">
              Official company details registered with BRELA and Tanzania Revenue Authority.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-foreground">Registered Enterprise Name</label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="text-xs h-9" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-foreground">TRA TIN Number</label>
                <Input value={tinNumber} onChange={(e) => setTinNumber(e.target.value)} className="font-mono text-xs h-9" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-foreground">VAT VRN Number</label>
                <Input value={vrnNumber} onChange={(e) => setVrnNumber(e.target.value)} className="font-mono text-xs h-9" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-foreground">BRELA Registration #</label>
                <Input value={brelaRegistrationNumber} onChange={(e) => setBrelaRegistrationNumber(e.target.value)} className="font-mono text-xs h-9" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Physical Business Address</label>
              <Input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className="text-xs h-9" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Official B2B Contact Email</label>
                <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="text-xs h-9" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-foreground">Business Hotline Phone</label>
                <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="font-mono text-xs h-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank & Mobile Money Settlement Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <CreditCard className="size-5 text-brand-500" />
              Buyer Protection Payout Settlement Accounts
            </CardTitle>
            <CardDescription className="text-xs">
              Where Lumo deposits your unlocked TZS funds (24h after delivery scanning).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-muted/40 border space-y-3">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                1. Commercial Bank Wire Transfer
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Bank Name</label>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Account Number</label>
                  <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="font-mono text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Account Name</label>
                  <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} className="text-xs h-9" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border space-y-3">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                2. Tanzanian Mobile Money Corporate Payout
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Mobile Money Provider</label>
                  <Input value={mobileProvider} onChange={(e) => setMobileProvider(e.target.value)} className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Registered Phone Number</label>
                  <Input value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} className="font-mono text-xs h-9" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-6">
            Save Profile &amp; Payout Settings
          </Button>
        </div>
      </form>

      {/* KYC Documents Verification Ledger */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-extrabold flex items-center gap-2">
            <FileCheck2 className="size-5 text-brand-500" />
            Compliance Document Ledger
          </CardTitle>
          <CardDescription className="text-xs">Uploaded Certificates &amp; Tax Documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y divide-border border rounded-xl overflow-hidden text-xs">
            {profile.submittedDocuments.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="size-5 text-brand-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">{doc.type}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{doc.name} · Uploaded {doc.uploadedAt}</span>
                  </div>
                </div>

                <Badge
                  className={`text-[10px] font-bold ${
                    doc.verified ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {doc.verified ? 'Verified & Active' : 'Under Inspection'}
                </Badge>
              </div>
            ))}
          </div>

          {/* Quick Upload Form */}
          <form onSubmit={handleUploadDoc} className="p-4 rounded-xl bg-muted/20 border space-y-3">
            <h4 className="font-bold text-xs">Upload Additional Compliance Document</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-muted-foreground text-[11px]">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none"
                >
                  <option value="Tax Clearance Certificate">Tax Clearance Certificate</option>
                  <option value="Municipal Business License">Municipal Business License</option>
                  <option value="Director Identity Document">Director Identity Document</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-muted-foreground text-[11px]">File Name / Reference</label>
                <Input
                  placeholder="e.g. Tax_Clearance_2026.pdf"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <Button type="submit" size="sm" variant="outline" className="font-bold text-xs">
              <Upload className="size-3.5 mr-1 text-brand-500" />
              Upload Document for Review
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
