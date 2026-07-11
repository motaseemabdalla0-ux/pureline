import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Satellite } from 'lucide-react'
import Reveal from '../ui/Reveal'
import dataset from '../../data/ndvi-farms.json'
import type { NdviDataset, NdviFarm } from '../../types/ndvi'

const data = dataset as NdviDataset

/* NDVI color scale: red (low) -> yellow (moderate) -> green (healthy).
   Calibrated to AlUla's real arid-farm NDVI band (RCU portal readings run
   roughly 8%-28%, well below generic cropland NDVI) rather than the 0-1
   scale used for illustrative content in NDVIAnalytics.tsx. */
function ndviColor(v: number) {
  if (v >= 0.22) return '#2f9e5c'
  if (v >= 0.15) return '#7cc24a'
  if (v >= 0.10) return '#d8c53a'
  if (v >= 0.07) return '#e0913a'
  return '#d15236'
}

const statusStyles: Record<string, string> = {
  healthy: 'bg-secondary/15 text-primary dark:text-secondary',
  moderate: 'bg-accent/15 text-accent',
  degraded: 'bg-red-500/15 text-red-500',
}

const trendIcon = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
}

const trendStyles: Record<string, string> = {
  up: 'text-secondary',
  down: 'text-red-500',
  stable: 'text-neutral-dark/50 dark:text-neutral-light/50',
}

/* Compact satellite thumbnail — a simplified, chrome-free version of the
   SatelliteIntelligence.tsx aerial-map SVG. Deterministic per farm id. */
function SatelliteThumb({ id }: { id: string }) {
  const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const pivotX = 60 + (seed % 40)
  const pivotY = 70 + (seed % 30)
  return (
    <svg viewBox="0 0 160 160" className="block h-full w-full" aria-hidden="true">
      {/* aerial base — parceled fields */}
      <rect width="160" height="160" fill="#0a3d24" />
      <rect x="0" y="0" width="80" height="80" fill="#12603a" />
      <rect x="80" y="0" width="80" height="80" fill="#0f5233" />
      <rect x="0" y="80" width="80" height="80" fill="#0d4a2d" />
      <rect x="80" y="80" width="80" height="80" fill="#14663d" />
      {/* soil / crop texture rows */}
      <g opacity="0.18">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1={i * 14} y1="0" x2={i * 14} y2="160" stroke="#fff" strokeWidth="1" />
        ))}
      </g>
      {/* crop-health patches */}
      <g opacity="0.55">
        <path d="M12 14 L64 10 L74 52 L20 60 Z" fill="#3CB371" />
        <path d="M92 16 L146 22 L138 58 L96 54 Z" fill="#c9d64a" />
        <path d="M18 92 L70 88 L80 138 L26 146 Z" fill="#c9d64a" />
        <path d="M96 92 L146 96 L140 144 L100 140 Z" fill="#3CB371" />
      </g>
      {/* field-boundary dashed polygons */}
      <g fill="none" stroke="#ffffff" strokeWidth="1.4" strokeDasharray="5 4" opacity="0.8">
        <path d="M12 14 L64 10 L74 52 L20 60 Z" />
        <path d="M96 92 L146 96 L140 144 L100 140 Z" />
      </g>
      {/* center-pivot irrigation */}
      <g fill="none" stroke="#8fe3ff" strokeWidth="1.4" opacity="0.75">
        <circle cx={pivotX} cy={pivotY} r="26" strokeDasharray="3 4" />
        <circle cx={pivotX} cy={pivotY} r="14" strokeDasharray="3 4" opacity="0.6" />
        <line x1={pivotX} y1={pivotY} x2={pivotX + 26} y2={pivotY} strokeWidth="1.6" />
      </g>
      {/* sensor markers */}
      <g>
        <circle cx="120" cy="40" r="3.5" fill="#D4AF37" />
        <circle cx="120" cy="40" r="7" fill="none" stroke="#D4AF37" strokeWidth="1.2" opacity="0.6" />
        <circle cx="40" cy="120" r="3.5" fill="#D4AF37" />
        <circle cx="40" cy="120" r="7" fill="none" stroke="#D4AF37" strokeWidth="1.2" opacity="0.6" />
      </g>
    </svg>
  )
}

/* Compact single-farm NDVI heatmap tile — color-graded cells derived from the
   farm's NDVI value using the shared ndviColor() scale. */
function NdviThumb({ value }: { value: number }) {
  const grid = 4
  const cells = Array.from({ length: grid * grid }, (_, i) => {
    // deterministic spread of readings around the farm's mean value
    const jitter = (((i * 37) % 21) - 10) / 100
    return Math.max(0.05, Math.min(0.95, value + jitter))
  })
  const size = 40
  return (
    <svg viewBox={`0 0 ${grid * size} ${grid * size}`} className="block h-full w-full" aria-hidden="true">
      {cells.map((v, i) => {
        const x = (i % grid) * size
        const y = Math.floor(i / grid) * size
        return (
          <g key={i}>
            <rect x={x + 2} y={y + 2} width={size - 4} height={size - 4} rx="5" fill={ndviColor(v)} />
            <rect
              x={x + 2} y={y + 2} width={size - 4} height={size - 4}
              rx="5" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="4 3" opacity="0.45"
            />
          </g>
        )
      })}
    </svg>
  )
}

/* Sparkline reused from NDVIAnalytics.tsx technique. */
function Sparkline({ series, color }: { series: number[]; color: string }) {
  const max = Math.max(...series)
  const min = Math.min(...series)
  const pts = series
    .map((d, i) => {
      const x = (i / (series.length - 1)) * 100
      const y = 32 - ((d - min) / (max - min || 1)) * 28 - 2
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg viewBox="0 0 100 34" className="h-10 w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FarmCard({ farm, locale }: { farm: NdviFarm; locale: string }) {
  const { t } = useTranslation()
  const pct = Math.round(farm.ndviValue * 100)
  const color = ndviColor(farm.ndviValue)
  const TrendIco = trendIcon[farm.trend]
  const displayName = locale === 'ar' && farm.nameAr ? farm.nameAr : farm.name
  const captured = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(farm.lastCaptured))

  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="group h-full rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-shadow hover:shadow-xl dark:border-white/10 dark:bg-white/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold">{displayName}</h3>
          <span className="font-mono text-xs text-neutral-dark/50 dark:text-neutral-light/50">{farm.id}</span>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[farm.status]}`}>
          {t(`liveNdvi.status.${farm.status}`)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          <SatelliteThumb id={farm.id} />
        </div>
        <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          <NdviThumb value={farm.ndviValue} />
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 text-center text-[11px] font-medium text-neutral-dark/50 dark:text-neutral-light/50">
        <span>{t('liveNdvi.card.satellite')}</span>
        <span>{t('liveNdvi.card.ndviMap')}</span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-3xl font-black" style={{ color }}>{pct}%</div>
          <div className="text-xs text-neutral-dark/50 dark:text-neutral-light/50">{t('liveNdvi.card.ndviValue')}</div>
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-semibold ${trendStyles[farm.trend]}`}>
          <TrendIco className="h-4 w-4" />
          {t(`liveNdvi.trend.${farm.trend}`)}
        </div>
      </div>

      <div className="mt-3">
        <Sparkline series={farm.trendHistory} color={color} />
      </div>

      <div className="mt-3 border-t border-black/5 pt-3 text-xs text-neutral-dark/50 dark:border-white/10 dark:text-neutral-light/50">
        {t('liveNdvi.card.lastCaptured')}: <span className="font-medium text-neutral-dark/70 dark:text-neutral-light/70">{captured}</span>
      </div>
    </motion.div>
  )
}

export default function LiveNDVIMonitoring() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const updated = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(data.lastUpdated))

  return (
    <section id="live-ndvi" className="relative py-24 sm:py-32">
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('liveNdvi.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h2 className="section-title mt-5">{t('liveNdvi.title')}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('liveNdvi.subtitle')}</p></Reveal>
          <Reveal delay={0.15}>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 text-xs font-medium text-neutral-dark/60 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-neutral-light/60">
              <Satellite className="h-4 w-4 text-primary dark:text-secondary" />
              <span>{t('liveNdvi.caption', { source: data.source, date: updated })}</span>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.farms.map((farm, i) => (
            <Reveal key={farm.id} delay={i * 0.08} className="h-full">
              <FarmCard farm={farm} locale={locale} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
