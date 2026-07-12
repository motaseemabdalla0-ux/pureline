import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, Moon, Sun, Languages, Bot, ChevronDown, LayoutGrid, Send, Gauge,
  ScanLine, Satellite, Map, FileText, ClipboardList, ShieldCheck,
} from 'lucide-react'
import Logo from './ui/Logo'
import { applyLangSideEffects } from '../i18n'
import { toggleTheme, isDarkMode } from '../lib/theme'

const links = ['about', 'services', 'projects', 'technology', 'platform', 'contact'] as const

const platformLinks = [
  { to: '/services', key: 'servicesMarketplace', icon: LayoutGrid },
  { to: '/request-service', key: 'requestService', icon: Send },
  { to: '/dashboard', key: 'dashboard', icon: Gauge },
  { to: '/ndvi-analytics', key: 'ndviAnalytics', icon: ScanLine },
  { to: '/satellite-intelligence', key: 'satelliteIntelligence', icon: Satellite },
  { to: '/farm-monitoring', key: 'farmMonitoring', icon: Map },
  { to: '/farm-reports', key: 'farmReports', icon: FileText },
  { to: '/consultancy', key: 'consultancy', icon: ClipboardList },
  { to: '/admin', key: 'admin', icon: ShieldCheck },
] as const

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [platformOpen, setPlatformOpen] = useState(false)
  const [mobilePlatformOpen, setMobilePlatformOpen] = useState(false)
  const platformRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDark(isDarkMode())
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (platformRef.current && !platformRef.current.contains(e.target as Node)) setPlatformOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const switchLang = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(next)
    applyLangSideEffects(next)
  }

  const goHomeAnchor = (l: string) => {
    if (window.location.pathname !== '/') {
      navigate(`/#${l}`)
    }
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
            <a key={l} href={`#${l}`} onClick={() => goHomeAnchor(l)} className="text-sm font-semibold text-neutral-dark/80 transition-colors hover:text-primary dark:text-neutral-light/80 dark:hover:text-secondary">
              {t(`nav.${l}`)}
            </a>
          ))}
          <div ref={platformRef} className="relative">
            <button
              type="button"
              onClick={() => setPlatformOpen((v) => !v)}
              aria-expanded={platformOpen}
              className="flex items-center gap-1 text-sm font-semibold text-neutral-dark/80 transition-colors hover:text-primary dark:text-neutral-light/80 dark:hover:text-secondary"
            >
              {t('navPlatform.menu')}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${platformOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {platformOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="glass absolute top-full mt-3 w-72 rounded-2xl border border-black/5 p-2 shadow-xl dark:border-white/10 start-0"
                >
                  {platformLinks.map((p) => (
                    <Link
                      key={p.to}
                      to={p.to}
                      onClick={() => setPlatformOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-dark/80 transition hover:bg-primary/10 hover:text-primary dark:text-neutral-light/80 dark:hover:text-secondary"
                    >
                      <p.icon className="h-4 w-4 shrink-0" />
                      {t(`navPlatform.${p.key}`)}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
            <div className="container-px flex max-h-[70vh] flex-col gap-1 overflow-y-auto py-4">
              {links.map((l) => (
                <a key={l} href={`#${l}`} onClick={() => { setOpen(false); goHomeAnchor(l) }} className="rounded-lg px-3 py-3 font-semibold text-neutral-dark/80 hover:bg-primary/10 dark:text-neutral-light/80">
                  {t(`nav.${l}`)}
                </a>
              ))}
              <button
                type="button"
                onClick={() => setMobilePlatformOpen((v) => !v)}
                className="flex items-center justify-between rounded-lg px-3 py-3 text-start font-semibold text-neutral-dark/80 hover:bg-primary/10 dark:text-neutral-light/80"
              >
                {t('navPlatform.menu')}
                <ChevronDown className={`h-4 w-4 transition-transform ${mobilePlatformOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {mobilePlatformOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden ps-3"
                  >
                    {platformLinks.map((p) => (
                      <Link
                        key={p.to}
                        to={p.to}
                        onClick={() => { setOpen(false); setMobilePlatformOpen(false) }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-dark/70 hover:bg-primary/10 dark:text-neutral-light/70"
                      >
                        <p.icon className="h-4 w-4 shrink-0" />
                        {t(`navPlatform.${p.key}`)}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <Link to="/chat" onClick={() => setOpen(false)} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-semibold text-white">
                <Bot className="h-4 w-4" /> {t('nav.assistant')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
