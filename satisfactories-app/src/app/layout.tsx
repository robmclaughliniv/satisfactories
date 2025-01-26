import { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Satisfactories App',
  description: 'A Next.js PWA application with mobile-first design',
  manifest: '/manifest.json',
  icons: {
    apple: [
      { url: '/icons/icon-192x192.png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512' },
    ],
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0ea5e9',
  viewportFit: 'cover'
}

import ClientLayout from './client-layout'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}
