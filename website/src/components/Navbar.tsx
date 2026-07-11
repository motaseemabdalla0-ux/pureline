import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Moon, Sun, Languages, Bot } from 'lucide-react'
import Logo from './ui/Logo'
import { applyLangSideEffects } from '../i18n'
import { toggleTheme, isDarkMode } from '../lib/theme'

const links = ['about', 'services', 'projects', 'technology', 'platform', 'contact'] as const

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(isDarkMode())
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const switchLang = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(next)
    applyLangSideEffects(next)
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-lg shadow-black/5' : 'bg-transparent'
      }`}
    >
      <nav className="container-px flex h-18 items-center justify-between py-3">
        <a href="#top" aria-label="PURE LINE"><Logo /></a>

        <div className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <a key={l} href={`#${l}`} className="text-sm font-semibold text-neutral-dark/80 transition-colors hover:text-primary dark:text-neutral-light/80 dark:hover:text-secondary">
              {t(`nav.${l}`)}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={switchLang} aria-label="Language" className="flex items-center gap-1.5 rounded-full p-2 px-3 text-sm font-semibold text-neutral-dark/80 transition hover:bg-primary/10 dark:text-neutral-light/80">
            <Languages className="h-4 w-4" /> {t('common.language')}
          </button>
          <button onClick={() => setDark(toggleTheme())} aria-label={t('common.toggleTheme')} className="rounded-full p-2.5 text-neutral-dark/80 transition hover:bg-primary/10 dark:text-neutral-light/80">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link to="/chat" className="hidden items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-600 md:inline-flex">
            <Bot className="h-4 w-4" /> {t('nav.assistant')}
          </Link>
          <button onClick={() => setOpen(!open)} aria-label="Menu" className="rounded-full p-2.5 lg:hidden">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden glass lg:hidden"
          >
            <div className="container-px flex flex-col gap-1 py-4">
              {links.map((l) => (
                <a key={l} href={`#${l}`} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-semibold text-neutral-dark/80 hover:bg-primary/10 dark:text-neutral-light/80">
                  {t(`nav.${l}`)}
                </a>
              ))}
              <Link to="/chat" className="mt-2 flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-semibold text-white">
                <Bot className="h-4 w-4" /> {t('nav.assistant')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
