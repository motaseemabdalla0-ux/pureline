import { useTranslation } from 'react-i18next'
import { BadgeCheck, Lightbulb, Headphones, Leaf, Cpu, TrendingUp } from 'lucide-react'
import Reveal from '../ui/Reveal'

const items = [
  { key: 'expertise', icon: BadgeCheck },
  { key: 'innovative', icon: Lightbulb },
  { key: 'support', icon: Headphones },
  { key: 'sustainable', icon: Leaf },
  { key: 'technology', icon: Cpu },
  { key: 'results', icon: TrendingUp },
]

export default function WhyChooseUs() {
  const { t } = useTranslation()
  return (
    <section className="py-24 sm:py-32">
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('why.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h2 className="section-title mt-5">{t('why.title')}</h2></Reveal>
        </div>
        <div className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.key} delay={i * 0.06}>
              <div className="group flex gap-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/5 text-primary transition group-hover:bg-primary group-hover:text-white dark:text-secondary">
                  <it.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold">{t(`why.items.${it.key}.title`)}</h3>
                  <p className="mt-1.5 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t(`why.items.${it.key}.desc`)}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
