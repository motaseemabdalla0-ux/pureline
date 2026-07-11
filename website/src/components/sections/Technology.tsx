import { useTranslation } from 'react-i18next'
import { Radio, Droplets, Satellite, BrainCircuit, Crosshair } from 'lucide-react'
import Reveal from '../ui/Reveal'

const items = [
  { key: 'iot', icon: Radio },
  { key: 'irrigation', icon: Droplets },
  { key: 'satellite', icon: Satellite },
  { key: 'ai', icon: BrainCircuit },
  { key: 'precision', icon: Crosshair },
]

export default function Technology() {
  const { t } = useTranslation()
  return (
    <section id="technology" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-mesh-green opacity-40" />
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('tech.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h2 className="section-title mt-5">{t('tech.title')}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('tech.subtitle')}</p></Reveal>
        </div>

        <div className="relative mt-20">
          {/* connecting circuit line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/30 to-transparent lg:block" />
          <div className="grid gap-8 lg:grid-cols-5">
            {items.map((it, i) => (
              <Reveal key={it.key} delay={i * 0.08}>
                <div className="group relative flex h-full flex-col items-center rounded-3xl border border-black/5 bg-white p-7 text-center shadow-sm transition-all hover:-translate-y-2 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
                  <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-white shadow-lg shadow-primary/25">
                    <it.icon className="h-7 w-7" />
                    <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-accent" />
                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent" />
                  </div>
                  <h3 className="mt-5 font-bold">{t(`tech.items.${it.key}.title`)}</h3>
                  <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t(`tech.items.${it.key}.desc`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
