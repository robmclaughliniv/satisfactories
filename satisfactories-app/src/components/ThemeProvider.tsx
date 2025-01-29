'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { DarkModeToggle } from './DarkModeToggle'
import { getInitialDarkMode, applyDarkMode, handleSystemThemeChange } from '../app/darkMode'

type ThemeContextType = {
  isDark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(getInitialDarkMode())

  useEffect(() => {
    setMounted(true)
    
    // Set up system theme change listener
    const cleanup = handleSystemThemeChange((newIsDark) => {
      setIsDark(newIsDark)
    })

    return cleanup
  }, [])

  const toggle = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    applyDarkMode(newIsDark)
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      <DarkModeToggle />
      {children}
    </ThemeContext.Provider>
  )
}
