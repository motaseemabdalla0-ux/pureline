export function initTheme() {
  const stored = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = stored ? stored === 'dark' : prefersDark
  document.documentElement.classList.toggle('dark', dark)
}

export function toggleTheme(): boolean {
  const isDark = document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
  return isDark
}

export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}
