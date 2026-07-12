import { useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, CircleDollarSign } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { getServiceBySlug } from '../data/services'
import { getProjectImagery, PROJECT_IMAGE_BASE_PATH } from '../lib/projectImagery'

interface FaqItem { q: string; a: string }

const PROCESS_STEPS = ['step1', 'step2', 'step3', 'step4', 'step5'] as const

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const service = slug ? getServiceBySlug(slug) : undefined
  if (!service) return <Navigate to="/services" replace />

  const { key, icon: Icon, heroImage } = service
  const imagery = getProjectImagery(heroImage)
  const sortedVariants = imagery ? [...imagery.variants].sort((a, b) => a.width - b.width) : []
  const largest = sortedVariants[sortedVariants.length - 1]
  const srcSet = sortedVariants.map((v) => `${PROJECT_IMAGE_BASE_PATH}${v.file} ${v.width}w`).join(', ')

  const title = t(`services.items.${key}.title`)
  const benefits = t(`services.items.${key}.benefits`, { returnObjects: true }) as string[]
  const specs = t(`services.items.${key}.specs`, { returnObjects: true }) as string[]
  const deliverables = t(`services.items.${key}.deliverables`, { returnObjects: true }) as string[]
  const faq = t(`services.items.${key}.faq`, { returnObjects: true }) as FaqItem[]

  return (
    <PlatformPageShell title={`${title} — PURE LINE`} description={t(`services.items.${key}.heroDesc`)}>
      <div className="container-px">
        <Link to="/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-secondary">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('serviceDetail.backToServices')}
        </Link>

        {/* Hero */}
        <div className="mt-6 grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-white shadow-lg shadow-primary/25">
              <Icon className="h-7 w-7" />
            </div>
            <h1 className="section-title mt-6">{title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-neutral-dark/60 dark:text-neutral-light/60">
              {t(`services.items.${key}.heroDesc`)}
            </p>
            <Link to={`/request-service?service=${service.slug}`} className="btn-primary mt-8">
              {t('serviceDetail.requestCta')} <ArrowUpRight className="h-4 w-4 rtl:-scale-x-90" />
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            {imagery && largest && (
              <div className="relative overflow-hidden rounded-3xl shadow-xl">
                <img
                  src={`${PROJECT_IMAGE_BASE_PATH}${largest.file}`}
                  srcSet={srcSet}
                  sizes="(min-width: 1024px) 560px, 100vw"
                  alt={imagery.title}
                  className="aspect-[4/3] w-full object-cover"
                  loading="eager"
                />
                <div className="pointer-events-none absolute bottom-2 end-2 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] text-white/90 backdrop-blur-sm">
                  {t('projects.photoCredit', { credit: imagery.credit })}
                </div>
              </div>
            )}
          </Reveal>
        </div>

        {/* Full description */}
        <Reveal delay={0.05} className="mx-auto mt-16 max-w-3xl">
          <p className="text-base leading-relaxed text-neutral-dark/75 dark:text-neutral-light/75">
            {t(`services.items.${key}.fullDescription`)}
          </p>
        </Reveal>

        {/* Benefits + Specs + Deliverables */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          <Reveal>
            <div className="h-full rounded-3xl border border-black/5 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-bold">{t('serviceDetail.benefitsTitle')}</h2>
              <ul className="mt-4 space-y-3">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-dark/70 dark:text-neutral-light/70">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="h-full rounded-3xl border border-black/5 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-bold">{t('serviceDetail.specsTitle')}</h2>
              <ul className="mt-4 space-y-3">
                {specs.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-dark/70 dark:text-neutral-light/70">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-3xl border border-black/5 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-bold">{t('serviceDetail.deliverablesTitle')}</h2>
              <ul className="mt-4 space-y-3">
                {deliverables.map((d, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-dark/70 dark:text-neutral-light/70">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> {d}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* Process */}
        <div className="mt-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="section-title text-2xl sm:text-3xl">{t('serviceDetail.processTitle')}</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS_STEPS.map((s, i) => (
              <Reveal key={s} delay={i * 0.06}>
                <div className="relative h-full rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</div>
                  <h3 className="mt-3 text-sm font-bold">{t(`serviceDetail.process.${s}.title`)}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-dark/60 dark:text-neutral-light/60">{t(`serviceDetail.process.${s}.desc`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <Reveal className="mx-auto mt-16 max-w-3xl rounded-3xl bg-gradient-to-br from-primary to-primary-700 p-8 text-white shadow-xl">
          <div className="flex items-start gap-4">
            <CircleDollarSign className="h-8 w-8 shrink-0 text-accent-light" />
            <div>
              <h2 className="text-lg font-bold">{t('serviceDetail.pricingLabel')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/85">{t(`services.items.${key}.pricing`)}</p>
            </div>
          </div>
        </Reveal>

        {/* FAQ */}
        <div className="mx-auto mt-16 max-w-3xl">
          <Reveal><h2 className="section-title text-2xl sm:text-3xl">{t('serviceDetail.faqTitle')}</h2></Reveal>
          <div className="mt-8 space-y-3">
            {faq.map((f, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="overflow-hidden rounded-2xl border border-black/5 bg-white dark:border-white/10 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start text-sm font-semibold"
                  >
                    {f.q}
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-4 text-sm leading-relaxed text-neutral-dark/65 dark:text-neutral-light/65">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="mx-auto mt-16 max-w-3xl text-center">
          <Link to={`/request-service?service=${service.slug}`} className="btn-primary">
            {t('serviceDetail.requestCta')} <ArrowUpRight className="h-4 w-4 rtl:-scale-x-90" />
          </Link>
        </Reveal>
      </div>
    </PlatformPageShell>
  )
}
