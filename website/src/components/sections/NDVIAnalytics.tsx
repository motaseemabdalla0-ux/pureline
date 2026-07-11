import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CalendarDays, Sprout, TrendingUp } from 'lucide-react'
import Reveal from '../ui/Reveal'

/* NDVI color scale: red (low) -> yellow (moderate) -> green (healthy) */
function ndviColor(v: number) {
  if (v >= 0.6) return '#2f9e5c'
  if (v >= 0.45) return '#7cc24a'
  if (v >= 0.3) return '#d8c53a'
  if (v >= 0.15) return '#e0913a'
  return '#d15236'
}

/* Deterministic irregular field grid: varied cell spans mimic real field boundaries. */
const cells: { x: number; y: number; w: number; h: number; v: number }[] = [
  { x: 0, y: 0, w: 2, h: 2, v: 0.72 }, { x: 2, y: 0, w: 2, h: 1, v: 0.64 },
  { x: 4, y: 0, w: 1, h: 2, v: 0.31 }, { x: 5, y: 0, w: 2, h: 1, v: 0.55 },
  { x: 7, y: 0, w: 1, h: 3, v: 0.78 }, { x: 2, y: 1, w: 1, h: 2, v: 0.48 },
  { x: 3, y: 1, w: 1, h: 1, v: 0.22 }, { x: 5, y: 1, w: 1, h: 2, v: 0.68 },
  { x: 6, y: 1, w: 1, h: 1, v: 0.4 }, { x: 0, y: 2, w: 1, h: 2, v: 0.58 },
  { x: 1, y: 2, w: 1, h: 1, v: 0.35 }, { x: 3, y: 2, w: 2, h: 2, v: 0.7 },
  { x: 6, y: 2, w: 1, h: 2, v: 0.26 }, { x: 1, y: 3, w: 2, h: 1, v: 0.52 },
  { x: 5, y: 3, w: 2, h: 1, v: 0.63 }, { x: 7, y: 3, w: 1, h: 1, v: 0.44 },
  { x: 0, y: 4, w: 2, h: 1, v: 0.75 }, { x: 2, y: 4, w: 1, h: 1, v: 0.6 },
  { x: 3, y: 4, w: 1, h: 1, v: 0.18 }, { x: 4, y: 4, w: 2, h: 1, v: 0.5 },
  { x: 6, y: 4, w: 2, h: 1, v: 0.67 },
]
const U = 60 // cell unit px

const legend = [
  { key: 'healthy', color: '#2f9e5c', range: '0.6 – 0.9' },
  { key: 'moderate', color: '#d8c53a', range: '0.3 – 0.6' },
  { key: 'low', color: '#d15236', range: '0.0 – 0.3' },
]

const scores = [
  { key: 'north', score: 87, status: 'excellent' },
  { key: 'west', score: 72, status: 'good' },
  { key: 'south', score: 54, status: 'fair' },
  { key: 'east', score: 38, status: 'poor' },
]

const statusColor: Record<string, string> = {
  excellent: 'text-secondary', good: 'text-primary dark:text-secondary',
  fair: 'text-accent', poor: 'text-red-500',
}
const ringColor: Record<string, string> = {
  excellent: '#3CB371', good: '#0F6B3A', fair: '#D4AF37', poor: '#ef4444',
}

const useCases = [
  { key: 'weekly', icon: CalendarDays, spark: [30, 42, 38, 55, 60, 72, 78] },
  { key: 'seasonal', icon: Sprout, spark: [20, 35, 55, 70, 82, 74, 60] },
  { key: 'trend', icon: TrendingUp, spark: [48, 46, 52, 58, 55, 66, 80] },
]

function RingGauge({ value, color }: { value: number; color: string }) {
  const r = 34
  const c = 2 * Math.PI * r
  const offset = c * (1 - value / 100)
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
      <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-black/10 dark:text-white/10" />
      <motion.circle
        cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} whileInView={{ strokeDashoffset: offset }}
        viewport={{ once: true }} transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  )
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 32 - ((d - min) / (max - min || 1)) * 28 - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox="0 0 100 34" className="h-10 w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function NDVIAnalytics() {
  const { t } = useTranslation()
  const gridW = 8 * U
  const gridH = 5 * U
  return (
    <section id="ndvi" className="relative bg-neutral-light py-24 dark:bg-white/[0.02] sm:py-32">
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('ndvi.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h2 className="section-title mt-5">{t('ndvi.title')}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('ndvi.subtitle')}</p></Reveal>
        </div>

        <div className="mt-16 grid items-center gap-8 lg:grid-cols-5">
          {/* Heatmap */}
          <Reveal className="lg:col-span-3">
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-slate-900">
              <svg viewBox={`0 0 ${gridW} ${gridH}`} className="block w-full rounded-2xl" role="img" aria-label={t('ndvi.map.aria')}>
                {cells.map((csx, i) => (
                  <g key={i}>
                    <rect
                      x={csx.x * U + 2} y={csx.y * U + 2} width={csx.w * U - 4} height={csx.h * U - 4}
                      rx="6" fill={ndviColor(csx.v)}
                    />
                    <rect
                      x={csx.x * U + 2} y={csx.y * U + 2} width={csx.w * U - 4} height={csx.h * U - 4}
                      rx="6" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.5"
                    />
                    <text x={csx.x * U + 10} y={csx.y * U + 20} fontFamily="Inter, sans-serif" fontSize="12" fontWeight="700" fill="#ffffff" opacity="0.9">
                      {csx.v.toFixed(2)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </Reveal>

          {/* Legend + score cards */}
          <div className="space-y-6 lg:col-span-2">
            <Reveal delay={0.05}>
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <h3 className="font-bold">{t('ndvi.legend.title')}</h3>
                <div className="mt-4 space-y-3">
                  {legend.map((l) => (
                    <div key={l.key} className="flex items-center gap-3">
                      <span className="h-5 w-5 shrink-0 rounded-md" style={{ backgroundColor: l.color }} />
                      <span className="flex-1 text-sm font-medium">{t(`ndvi.legend.${l.key}`)}</span>
                      <span className="font-mono text-xs text-neutral-dark/50 dark:text-neutral-light/50">{l.range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid grid-cols-2 gap-4">
                {scores.map((s) => (
                  <div key={s.key} className="rounded-2xl border border-black/5 bg-white p-4 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                    <div className="relative mx-auto grid place-items-center">
                      <RingGauge value={s.score} color={ringColor[s.status]} />
                      <span className="absolute text-lg font-black">{s.score}</span>
                    </div>
                    <div className="mt-2 truncate text-sm font-bold">{t(`ndvi.scores.${s.key}`)}</div>
                    <div className={`text-xs font-semibold ${statusColor[s.status]}`}>{t(`ndvi.status.${s.status}`)}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        {/* Use cases */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {useCases.map((u, i) => (
            <Reveal key={u.key} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-secondary to-primary text-white">
                    <u.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold">{t(`ndvi.useCases.${u.key}.title`)}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-dark/60 dark:text-neutral-light/60">{t(`ndvi.useCases.${u.key}.desc`)}</p>
                <div className="mt-4">
                  <Sparkline data={u.spark} color="#3CB371" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
