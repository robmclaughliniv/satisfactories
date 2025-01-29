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
    setMounted(true)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return <ThemeProvider>{children}</ThemeProvider>
}
