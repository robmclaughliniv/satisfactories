// This script runs before React hydration to prevent flash of wrong theme
export const darkModeInitScript = `
if (typeof window !== 'undefined') {
  (function() {
    function getInitialColorMode() {
      const persistedColorPreference = window.localStorage.getItem('color-theme');
      const hasPersistedPreference = typeof persistedColorPreference === 'string';

      if (hasPersistedPreference) {
        return persistedColorPreference;
      }

      // Check system preference
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const hasMediaQueryPreference = typeof mql.matches === 'boolean';

      if (hasMediaQueryPreference) {
        return mql.matches ? 'dark' : 'light';
      }

      // Default to light
      return 'light';
    }

    const colorMode = getInitialColorMode();
    const root = document.documentElement;

    // Add class and store preference
    if (colorMode === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('color-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('color-theme', 'light');
    }

    // Add attribute to prevent flash
    root.style.colorScheme = colorMode;
  })();
}
`;
