// Check if we're in the browser environment
const isBrowser = typeof window !== 'undefined';

// Function to get initial dark mode state
export function getInitialDarkMode(): boolean {
  if (!isBrowser) return false;
  
  const savedTheme = localStorage.getItem('color-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return savedTheme === 'dark' || (!savedTheme && prefersDark);
}

// Function to apply dark mode class
export function applyDarkMode(isDark: boolean): void {
  if (!isBrowser) return;
  
  if (isDark) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('color-theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('color-theme', 'light');
  }
}

// Function to initialize dark mode
export function initDarkMode(): boolean {
  if (!isBrowser) return false;
  
  const isDark = getInitialDarkMode();
  applyDarkMode(isDark);
  return isDark;
}

// Function to handle system theme changes
export function handleSystemThemeChange(callback: (isDark: boolean) => void): () => void {
  if (!isBrowser) return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('color-theme')) {
      const newIsDark = e.matches;
      applyDarkMode(newIsDark);
      callback(newIsDark);
    }
  };

  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}
