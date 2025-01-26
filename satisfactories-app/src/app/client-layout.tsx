'use client'

import { Inter } from 'next/font/google'
import { Flowbite } from 'flowbite-react'
import Script from 'next/script'
import { DarkModeToggle } from '@/components/DarkModeToggle'

const inter = Inter({ subsets: ['latin'] })

// Script to run before React hydration to prevent flash of wrong theme
const darkModeScript = `
if (typeof window !== 'undefined') {
  let darkMode = localStorage.getItem('color-theme')
  
  if (!darkMode) {
    darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  
  if (darkMode === 'dark') {
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = 'light'
  }
}
`

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Flowbite>
      <html lang="en" className="min-h-screen">
        <head>
          <Script id="dark-mode-init" strategy="beforeInteractive">
            {darkModeScript}
          </Script>
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="application-name" content="Satisfactories" />
          <meta name="apple-mobile-web-app-title" content="Satisfactories" />
          <meta name="msapplication-TileColor" content="#0ea5e9" />
          <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
          <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.1/flowbite.min.css" rel="stylesheet" />
        </head>
        <body className={`${inter.className} flex min-h-[100vh] flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100`}>
          <DarkModeToggle />
          {/* Skip to main content link for keyboard users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-primary-600"
          >
            Skip to main content
          </a>
          
          <main id="main-content" className="flex-1">
            {children}
          </main>
          
          <Script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.1/flowbite.min.js" strategy="afterInteractive" />
        </body>
      </html>
    </Flowbite>
  )
}
