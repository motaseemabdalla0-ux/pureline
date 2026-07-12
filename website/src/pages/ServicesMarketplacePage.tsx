import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { SERVICES } from '../data/services'

export default function ServicesMarketplacePage() {
  const { t } = useTranslation()
  return (
    <PlatformPageShell title={`${t('servicesMarketplace.title')} — PURE LINE`} description={t('servicesMarketplace.subtitle')}>
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('servicesMarketplace.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h1 className="section-title mt-5">{t('servicesMarketplace.title')}</h1></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('servicesMarketplace.subtitle')}</p></Reveal>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((it, i) => (
            <Reveal key={it.key} delay={i * 0.05}>
              <Link to={`/services/${it.slug}`} className="block h-full">
                <motion.div whileHover={{ y: -8 }} className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-black/5 bg-white p-8 shadow-sm transition-shadow hover:shadow-2xl dark:border-white/10 dark:bg-white/5">
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />
                  <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-white shadow-lg shadow-primary/25">
                    <it.icon className="h-6 w-6" />
                  </div>
                  <h2 className="relative mt-6 text-xl font-bold">{t(`services.items.${it.key}.title`)}</h2>
                  <p className="relative mt-3 flex-1 text-sm leading-relaxed text-neutral-dark/60 dark:text-neutral-light/60">{t(`services.items.${it.key}.desc`)}</p>
                  <div className="relative mt-6 flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-secondary">
                    {t('servicesMarketplace.viewDetails')}
                    <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 rtl:-scale-x-100" />
                  </div>
                </motion.div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </PlatformPageShell>
  )
}
