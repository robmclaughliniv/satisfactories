import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Providers } from '@/components/Providers'
import { darkModeScript } from './darkMode'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <Script id="dark-mode-init" strategy="beforeInteractive">
          {darkModeScript}
        </Script>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="application-name" content="Satisfactories" />
        <meta name="apple-mobile-web-app-title" content="Satisfactories" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.1/flowbite.min.css" rel="stylesheet" />
      </head>
      <body className={`${inter.className} h-full flex flex-col bg-white text-gray-900 dark:bg-dark-950 dark:text-gray-100`}>
        <Providers>
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
        </Providers>
      </body>
    </html>
  )
}
