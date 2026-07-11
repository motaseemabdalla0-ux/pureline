import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Leaf, AlertTriangle, Droplets, Activity, TrendingUp, Map,
  Camera, Cpu, LineChart, BellRing, CheckCircle2,
} from 'lucide-react'
import Reveal from '../ui/Reveal'
import SatelliteImage from '../ui/SatelliteImage'
import GisFrame from '../ui/GisFrame'

const features = [
  { key: 'ndvi', icon: Leaf },
  { key: 'stress', icon: AlertTriangle },
  { key: 'irrigation', icon: Droplets },
  { key: 'vegetation', icon: Activity },
  { key: 'yield', icon: TrendingUp },
  { key: 'mapping', icon: Map },
]

const workflow = [
  { key: 'capture', icon: Camera },
  { key: 'process', icon: Cpu },
  { key: 'analyze', icon: LineChart },
  { key: 'alert', icon: BellRing },
  { key: 'act', icon: CheckCircle2 },
]

/* Real NASA satellite imagery of the AlUla valley, framed with GIS chrome. */
function SatelliteMap() {
  const { t } = useTranslation()
  return (
    <GisFrame scanline className="shadow-2xl shadow-primary/20">
      <SatelliteImage
        source="alula_valley"
        alt={t('satIntel.map.aria')}
        className="aspect-[700/460] w-full"
        showAttribution={false}
        priority
      />

      {/* HUD overlays */}
      <div className="pointer-events-none absolute start-4 top-4 flex items-center gap-2 rounded-lg bg-black/50 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
        <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" /> {t('satIntel.map.badge')}
      </div>
      <div className="pointer-events-none absolute end-4 top-4 rounded-lg bg-black/50 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
        {t('satIntel.map.resolution')}
      </div>
      <div className="gis-readout pointer-events-none absolute bottom-4 start-4 rounded-lg bg-black/50 px-3 py-1.5 text-white/80 backdrop-blur">
        {t('satIntel.map.source')}
      </div>
    </GisFrame>
  )
}

export default function SatelliteIntelligence() {
  const { t } = useTranslation()
  return (
    <section id="satellite" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-mesh-green opacity-30" />
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('satIntel.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h2 className="section-title mt-5">{t('satIntel.title')}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('satIntel.subtitle')}</p></Reveal>
        </div>

        {/* Map centerpiece + feature cards */}
        <div className="mt-16 grid items-start gap-8 lg:grid-cols-2">
          <Reveal><SatelliteMap /></Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {features.map((f, i) => (
              <Reveal key={f.key} delay={i * 0.05}>
                <motion.div whileHover={{ y: -6 }} className="group h-full rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl dark:border-white/10 dark:bg-white/5">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-secondary to-primary text-white shadow-lg shadow-primary/25">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-bold">{t(`satIntel.features.${f.key}.title`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-dark/60 dark:text-neutral-light/60">{t(`satIntel.features.${f.key}.desc`)}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Workflow */}
        <div className="mt-20">
          <Reveal><h3 className="text-center text-2xl font-bold">{t('satIntel.workflow.title')}</h3></Reveal>
          <div className="relative mt-12 grid gap-8 md:grid-cols-5">
            {/* connecting line (horizontal on desktop) */}
            <div className="absolute left-0 right-0 top-8 hidden h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />
            {workflow.map((s, i) => (
              <Reveal key={s.key} delay={i * 0.08} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-white text-primary shadow-lg shadow-primary/15 ring-1 ring-primary/15 dark:bg-slate-900 dark:text-secondary dark:ring-white/10">
                    <s.icon className="h-6 w-6" />
                    <span className="absolute -end-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">{i + 1}</span>
                  </div>
                  <h4 className="mt-4 font-bold">{t(`satIntel.workflow.steps.${s.key}.title`)}</h4>
                  <p className="mt-1.5 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t(`satIntel.workflow.steps.${s.key}.desc`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
