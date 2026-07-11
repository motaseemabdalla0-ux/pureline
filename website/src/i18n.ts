import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ar from './locales/ar.json'

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : null
const initialLang = stored || 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export function applyLangSideEffects(lang: string) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.setAttribute('lang', lang)
  document.documentElement.setAttribute('dir', dir)
  try { localStorage.setItem('lang', lang) } catch { /* ignore */ }
}

applyLangSideEffects(initialLang)

export default i18n
