'use client'

import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
import { DarkThemeToggle, Flowbite } from 'flowbite-react'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering theme toggle until mounted
  if (!mounted) {
    return (
      <html lang="en" className="min-h-screen">
        <head>
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
        <body className={`${inter.className} flex min-h-[100vh] flex-col bg-white text-gray-900 dark:bg-dark-950 dark:text-gray-100`}>
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.1/flowbite.min.js" strategy="afterInteractive" />
        </body>
      </html>
    );
  }

  return (
    <Flowbite>
      <html lang="en" className="min-h-screen">
        <head>
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
        <body className={`${inter.className} flex min-h-[100vh] flex-col bg-white text-gray-900 dark:bg-dark-950 dark:text-gray-100`}>
          <div className="fixed bottom-4 left-4 z-[60]">
            <DarkThemeToggle />
          </div>
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
