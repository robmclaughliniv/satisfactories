'use client'

import { HiMoon, HiSun } from 'react-icons/hi'
import { useTheme } from './ThemeProvider'

export function DarkModeToggle() {
  const { isDark, toggle } = useTheme()

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-4 left-4 z-[60] rounded-lg p-2.5 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
    >
      {isDark ? (
        <HiSun className="h-5 w-5" />
      ) : (
        <HiMoon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle dark mode</span>
    </button>
  )
}
