import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Linkedin, Twitter, Instagram, Facebook, Bot, MapPin, Mail, Phone } from 'lucide-react'
import Logo from './ui/Logo'

const navLinks = ['about', 'services', 'projects', 'technology', 'platform', 'contact'] as const
const serviceKeys = ['smart', 'development', 'irrigation', 'greenhouse', 'consulting', 'digital'] as const

export default function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()
  return (
    <footer className="relative overflow-hidden bg-neutral-dark text-neutral-light">
      <div className="pointer-events-none absolute inset-0 bg-mesh-green opacity-40" />
      <div className="container-px relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-5">
          <Logo light />
          <p className="max-w-xs text-sm leading-relaxed text-neutral-light/70">{t('footer.desc')}</p>
          <div className="flex gap-3">
            {[Linkedin, Twitter, Instagram, Facebook].map((Icon, i) => (
              <a key={i} href="#" aria-label="social" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-neutral-light/70 transition hover:border-accent hover:text-accent">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-accent">{t('footer.quickLinks')}</h4>
          <ul className="space-y-3 text-sm">
            {navLinks.map((l) => (
              <li key={l}><a href={`#${l}`} className="text-neutral-light/70 transition hover:text-white">{t(`nav.${l}`)}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-accent">{t('footer.servicesTitle')}</h4>
          <ul className="space-y-3 text-sm">
            {serviceKeys.map((k) => (
              <li key={k}><a href="#services" className="text-neutral-light/70 transition hover:text-white">{t(`services.items.${k}.title`)}</a></li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <Link to="/chat" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-400">
            <Bot className="h-4 w-4" /> {t('footer.assistant')}
          </Link>
          <ul className="space-y-3 pt-2 text-sm text-neutral-light/70">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> +966 50 000 0000</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> info@pureline.com</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> {t('contact.locationValue')}</li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-px flex flex-col items-center justify-between gap-3 py-6 text-xs text-neutral-light/50 md:flex-row">
          <p>© {year} PURE LINE. {t('footer.rights')}</p>
          <p>{t('footer.made')}</p>
        </div>
      </div>
    </footer>
  )
}
