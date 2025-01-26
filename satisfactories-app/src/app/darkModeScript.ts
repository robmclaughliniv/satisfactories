export const darkModeScript = `
// On page load or when changing themes, best to add inline in head to avoid FOUC
(function() {
  function getInitialColorMode() {
    const persistedColorPreference = window.localStorage.getItem('color-theme');
    const hasPersistedPreference = typeof persistedColorPreference === 'string';

    if (hasPersistedPreference) {
      return persistedColorPreference;
    }

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const hasMediaQueryPreference = typeof mql.matches === 'boolean';

    if (hasMediaQueryPreference) {
      return mql.matches ? 'dark' : 'light';
    }

    return 'light';
  }

  const colorMode = getInitialColorMode();
  
  if (colorMode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();
`;
