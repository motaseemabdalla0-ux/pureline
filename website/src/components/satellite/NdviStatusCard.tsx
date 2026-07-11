import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import NdviHeatmapSwatch from '../ui/NdviHeatmapSwatch'
import { ndviColor, ndviStatusStyles, ndviTrendStyles } from '../../lib/ndvi'
import type { NdviFarm } from '../../types/ndvi'

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus }

interface NdviStatusCardProps {
  farm: NdviFarm
  locale?: string
  className?: string
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  const toneClass = tone === 'up' ? 'text-secondary' : tone === 'down' ? 'text-red-500' : 'text-neutral-dark/80 dark:text-neutral-light/80'
  return (
    <div className="min-w-0">
      <div className="truncate text-[10px] text-neutral-dark/50 dark:text-neutral-light/50">{label}</div>
      <div className={`text-xs font-bold ${toneClass}`}>{value}</div>
    </div>
  )
}

/** Compact status readout: NDVI value, status pill, trend arrow, a small
 * data-driven heatmap swatch, and — when available — the real 12/36-month
 * NDVI trend stats pulled from the RCU portal's own 36-month series. */
export default function NdviStatusCard({ farm, locale, className = '' }: NdviStatusCardProps) {
  const { t, i18n } = useTranslation()
  const lang = locale ?? (i18n.language.startsWith('ar') ? 'ar' : 'en')
  const displayName = lang === 'ar' && farm.nameAr ? farm.nameAr : farm.name
  const color = ndviColor(farm.ndviValue)
  const pct = Math.round(farm.ndviValue * 100)
  const TrendIco = trendIcon[farm.trend]
  const previousPct = farm.previousNdvi !== undefined ? Math.round(farm.previousNdvi * 100) : null

  const hasStats =
    previousPct !== null ||
    farm.ndvi12moTrendPercent !== undefined ||
    farm.ndvi36moTrendPercent !== undefined ||
    farm.improvementPercent !== undefined ||
    farm.degradationPercent !== undefined

  return (
    <div className={`rounded-xl border border-black/5 bg-white p-3 dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          <NdviHeatmapSwatch value={farm.ndviValue} grid={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{displayName}</div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ndviStatusStyles[farm.status]}`}>
              {t(`liveNdvi.status.${farm.status}`)}
            </span>
            <span className={`flex items-center gap-1 text-[11px] font-semibold ${ndviTrendStyles[farm.trend]}`}>
              <TrendIco className="h-3 w-3" />
              {t(`liveNdvi.trend.${farm.trend}`)}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-lg font-black" style={{ color }}>{pct}%</div>
      </div>

      {hasStats && (
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-black/5 pt-3 dark:border-white/10">
          <Stat label={t('liveNdvi.stats.current')} value={`${pct}%`} />
          {previousPct !== null && (
            <Stat label={t('liveNdvi.stats.previous')} value={`${previousPct}%`} />
          )}
          {farm.ndvi12moTrendPercent !== undefined && (
            <Stat
              label={t('liveNdvi.stats.trend12mo')}
              value={`${farm.ndvi12moTrendPercent > 0 ? '+' : ''}${farm.ndvi12moTrendPercent.toFixed(1)}%`}
              tone={farm.ndvi12moTrendPercent >= 0 ? 'up' : 'down'}
            />
          )}
          {farm.ndvi36moTrendPercent !== undefined && (
            <Stat
              label={t('liveNdvi.stats.trend36mo')}
              value={`${farm.ndvi36moTrendPercent > 0 ? '+' : ''}${farm.ndvi36moTrendPercent.toFixed(1)}%`}
              tone={farm.ndvi36moTrendPercent >= 0 ? 'up' : 'down'}
            />
          )}
          {farm.improvementPercent !== undefined && (
            <Stat label={t('liveNdvi.stats.improvement')} value={`+${farm.improvementPercent.toFixed(1)}%`} tone="up" />
          )}
          {farm.degradationPercent !== undefined && (
            <Stat label={t('liveNdvi.stats.degradation')} value={`-${farm.degradationPercent.toFixed(1)}%`} tone="down" />
          )}
        </div>
      )}
    </div>
  )
}
