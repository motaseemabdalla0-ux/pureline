import { useTranslation } from 'react-i18next'
import Counter from '../ui/Counter'
import Reveal from '../ui/Reveal'

type Stat = { to?: number; suffix?: string; static?: string; label: string }

const stats: Stat[] = [
  { to: 100, suffix: '+', label: 'stats.projects' },
  { to: 50, suffix: '+', label: 'stats.clients' },
  { to: 10, suffix: '+', label: 'stats.experience' },
  { to: 95, suffix: '%', label: 'stats.satisfaction' },
  { to: 10000, suffix: '+', label: 'stats.hectares' },
  { to: 500, suffix: '+', label: 'stats.reports' },
  { to: 95, suffix: '%', label: 'stats.accuracy' },
  { static: '24/7', label: 'stats.monitoring' },
]

export default function Stats() {
  const { t } = useTranslation()
  return (
    <section className="relative overflow-hidden bg-primary py-20 text-white">
      <div className="absolute inset-0 bg-mesh-green opacity-30" />
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="container-px relative grid grid-cols-2 gap-10 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.1} className="text-center">
            <div className="text-5xl font-black tracking-tight sm:text-6xl gold-text">
              {s.static ? s.static : <Counter to={s.to ?? 0} suffix={s.suffix} />}
            </div>
            <div className="mt-2 text-sm font-medium text-white/80">{t(s.label)}</div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
