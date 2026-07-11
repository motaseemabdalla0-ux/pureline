import { useTranslation } from 'react-i18next'
import Sparkline from '../ui/Sparkline'
import { ndviColor } from '../../lib/ndvi'
import type { NdviFarm } from '../../types/ndvi'

interface VegetationTrendChartProps {
  farm: NdviFarm
  locale?: string
  className?: string
}

/** Small SVG line chart rendering a farm's real trendHistory readings. */
export default function VegetationTrendChart({ farm, locale, className = '' }: VegetationTrendChartProps) {
  const { t, i18n } = useTranslation()
  const lang = locale ?? (i18n.language.startsWith('ar') ? 'ar' : 'en')
  const displayName = lang === 'ar' && farm.nameAr ? farm.nameAr : farm.name
  const color = ndviColor(farm.ndviValue)
  const first = Math.round(farm.trendHistory[0] * 100)
  const last = Math.round(farm.trendHistory[farm.trendHistory.length - 1] * 100)

  return (
    <div className={`rounded-xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="truncate text-sm font-bold">{displayName}</h4>
        <span className="gis-readout text-neutral-dark/50 dark:text-neutral-light/50">
          {t('vegetationTrendChart.range', { first, last })}
        </span>
      </div>
      <div className="mt-3">
        <Sparkline series={farm.trendHistory} color={color} />
      </div>
    </div>
  )
}
