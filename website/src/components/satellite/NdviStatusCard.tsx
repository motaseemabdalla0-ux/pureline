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

/** Compact status readout: NDVI value, status pill, trend arrow and a
 * small data-driven heatmap swatch (real NDVI%, not a photo). */
export default function NdviStatusCard({ farm, locale, className = '' }: NdviStatusCardProps) {
  const { t, i18n } = useTranslation()
  const lang = locale ?? (i18n.language.startsWith('ar') ? 'ar' : 'en')
  const displayName = lang === 'ar' && farm.nameAr ? farm.nameAr : farm.name
  const color = ndviColor(farm.ndviValue)
  const pct = Math.round(farm.ndviValue * 100)
  const TrendIco = trendIcon[farm.trend]

  return (
    <div className={`flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3 dark:border-white/10 dark:bg-white/5 ${className}`}>
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
  )
}
