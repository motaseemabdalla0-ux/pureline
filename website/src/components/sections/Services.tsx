import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import Reveal from '../ui/Reveal'
import { SERVICES } from '../../data/services'

export default function Services() {
  const { t } = useTranslation()
  return (
    <section id="services" className="relative bg-neutral-light py-24 dark:bg-white/[0.02] sm:py-32">
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('services.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h2 className="section-title mt-5">{t('services.title')}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('services.subtitle')}</p></Reveal>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((it, i) => (
            <Reveal key={it.key} delay={i * 0.06}>
              <Link to={`/services/${it.slug}`} className="block h-full">
                <motion.div whileHover={{ y: -8 }} className="group relative h-full overflow-hidden rounded-3xl border border-black/5 bg-white p-8 shadow-sm transition-shadow hover:shadow-2xl dark:border-white/10 dark:bg-white/5">
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />
                  <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-white shadow-lg shadow-primary/25">
                    <it.icon className="h-6 w-6" />
                  </div>
                  <h3 className="relative mt-6 text-xl font-bold">{t(`services.items.${it.key}.title`)}</h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-neutral-dark/60 dark:text-neutral-light/60">{t(`services.items.${it.key}.desc`)}</p>
                  <ArrowUpRight className="relative mt-6 h-5 w-5 text-primary opacity-0 transition group-hover:opacity-100 dark:text-secondary rtl:-scale-x-100" />
                </motion.div>
              </Link>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1} className="mt-12 text-center">
          <Link to="/services" className="btn-ghost">{t('services.viewAll')}</Link>
        </Reveal>
      </div>
    </section>
  )
}
