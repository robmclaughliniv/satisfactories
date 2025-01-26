'use client'

import { useEffect, useState } from 'react'
import { ThemeProvider } from './ThemeProvider'

export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Initialize dark mode
    const darkMode = localStorage.getItem('color-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (darkMode === 'dark' || (!darkMode && prefersDark)) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
      localStorage.setItem('color-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
      localStorage.setItem('color-theme', 'light')
    }

    setMounted(true)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return <ThemeProvider>{children}</ThemeProvider>
}
