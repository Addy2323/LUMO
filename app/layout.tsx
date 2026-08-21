import type { Metadata, Viewport } from 'next'
import { Outfit, Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'
import { AppProviders } from '@/components/providers/app-providers'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { DevRoleSwitcher } from '@/components/dev/dev-role-switcher'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Lumo — Global Sourcing & Commerce Platform',
    template: '%s · Lumo',
  },
  description:
    'Lumo is an enterprise-grade digital commerce platform for Tanzania and East Africa, connecting buyers directly to global factories in China, Dubai, and Turkey.',
  applicationName: 'Lumo',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1A19' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jakarta.variable} ${geistMono.variable} bg-background overflow-x-clip max-w-full`}
      suppressHydrationWarning
    >
      <body
        className="font-sans antialiased selection:bg-brand-500 selection:text-white pb-16 lg:pb-0 overflow-x-clip max-w-full"
        suppressHydrationWarning
      >
        <AppProviders>
          {children}
          <MobileBottomNav />
          {process.env.NODE_ENV === 'development' && <DevRoleSwitcher />}
        </AppProviders>
      </body>
    </html>
  )
}
