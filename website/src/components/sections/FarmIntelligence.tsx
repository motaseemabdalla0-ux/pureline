import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Satellite, ScanLine, Map, Radar, BrainCircuit, Crosshair,
  ImageDown, Cpu, LayoutDashboard, ChevronRight,
} from 'lucide-react'
import Reveal from '../ui/Reveal'

const stack = [
  { key: 'satellite', icon: Satellite },
  { key: 'ndvi', icon: ScanLine },
  { key: 'gis', icon: Map },
  { key: 'remote', icon: Radar },
  { key: 'ai', icon: BrainCircuit },
  { key: 'precision', icon: Crosshair },
]

const flow = [
  { key: 'satellite', icon: Satellite },
  { key: 'processing', icon: ImageDown },
  { key: 'ai', icon: Cpu },
  { key: 'gis', icon: Map },
  { key: 'dashboard', icon: LayoutDashboard },
]

export default function FarmIntelligence() {
  const { t } = useTranslation()
  return (
    <section id="farm-intelligence" className="relative py-24 sm:py-32">
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('farmIntel.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h2 className="section-title mt-5">{t('farmIntel.title')}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('farmIntel.subtitle')}</p></Reveal>
        </div>

        {/* Tech stack grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stack.map((s, i) => (
            <Reveal key={s.key} delay={i * 0.05}>
              <motion.div whileHover={{ y: -6 }} className="group flex h-full gap-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl dark:border-white/10 dark:bg-white/5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-secondary to-primary text-white shadow-lg shadow-primary/25">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold">{t(`farmIntel.stack.${s.key}.title`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-dark/60 dark:text-neutral-light/60">{t(`farmIntel.stack.${s.key}.desc`)}</p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>

        {/* Data-flow diagram */}
        <div className="mt-20 rounded-3xl border border-black/5 bg-neutral-light p-8 dark:border-white/10 dark:bg-white/[0.02] sm:p-12">
          <Reveal><h3 className="text-center text-2xl font-bold">{t('farmIntel.flow.title')}</h3></Reveal>
          <div className="mt-10 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:justify-between">
            {flow.map((f, i) => (
              <div key={f.key} className="flex flex-col items-center gap-4 lg:flex-row">
                <Reveal delay={i * 0.08}>
                  <div className="flex w-40 flex-col items-center rounded-2xl border border-black/5 bg-white p-5 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-white shadow-lg shadow-primary/25">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <span className="mt-3 text-sm font-bold">{t(`farmIntel.flow.steps.${f.key}`)}</span>
                  </div>
                </Reveal>
                {i < flow.length - 1 && (
                  <ChevronRight className="h-6 w-6 rotate-90 text-primary/50 dark:text-secondary/50 lg:rotate-0 rtl:lg:-scale-x-100" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
