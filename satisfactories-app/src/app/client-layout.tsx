'use client'

import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
import { Button, Dropdown } from 'flowbite-react'
import { HiMoon, HiSun, HiDesktopComputer } from 'react-icons/hi'
import './globals.css'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  type Theme = 'light' | 'dark' | 'auto'
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'auto'
    }
    return 'auto'
  })

  // Handle system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateTheme = () => {
      if (theme === 'auto') {
        document.documentElement.classList.toggle('dark', mediaQuery.matches)
      }
    }

    mediaQuery.addEventListener('change', updateTheme)
    updateTheme()

    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [theme])

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      // Auto mode - use system preference
      document.documentElement.classList.toggle(
        'dark',
        window.matchMedia('(prefers-color-scheme: dark)').matches
      )
    }
  }

  return (
    <html lang="en">
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
      <body className={`${inter.className} bg-white text-gray-900 dark:bg-dark-950 dark:text-gray-100`}>
        <div className="fixed bottom-4 left-4 z-[60] flex items-center gap-2">
          <Dropdown
            label={
              <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-2 dark:bg-dark-800">
                {theme === 'light' && <HiSun className="h-5 w-5" />}
                {theme === 'dark' && <HiMoon className="h-5 w-5" />}
                {theme === 'auto' && <HiDesktopComputer className="h-5 w-5" />}
                <span className="sr-only">Toggle theme</span>
              </div>
            }
            color="gray"
            size="lg"
            inline
            placement="top"
          >
            <Dropdown.Item
              onClick={() => handleThemeChange('light')}
              icon={HiSun}
            >
              Light
            </Dropdown.Item>
            <Dropdown.Item
              onClick={() => handleThemeChange('dark')}
              icon={HiMoon}
            >
              Dark
            </Dropdown.Item>
            <Dropdown.Item
              onClick={() => handleThemeChange('auto')}
              icon={HiDesktopComputer}
            >
              Auto
            </Dropdown.Item>
          </Dropdown>
        </div>
        {/* Skip to main content link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-primary-600"
        >
          Skip to main content
        </a>
        
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
        
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.1/flowbite.min.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
