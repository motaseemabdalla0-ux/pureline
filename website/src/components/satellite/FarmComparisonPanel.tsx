import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ndviColor, ndviStatusStyles, ndviTrendStyles } from '../../lib/ndvi'
import type { NdviFarm } from '../../types/ndvi'

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus }

interface FarmComparisonPanelProps {
  /** 2-3 real farms from ndvi-farms.json to compare side by side. */
  farms: NdviFarm[]
  locale?: string
  className?: string
}

/** Side-by-side comparison of real farms (id, name, NDVI%, trend, status). */
export default function FarmComparisonPanel({ farms, locale, className = '' }: FarmComparisonPanelProps) {
  const { t, i18n } = useTranslation()
  const lang = locale ?? (i18n.language.startsWith('ar') ? 'ar' : 'en')

  return (
    <div className={`overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="grid divide-y divide-black/5 dark:divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:rtl:divide-x-reverse">
        {farms.map((farm) => {
          const displayName = lang === 'ar' && farm.nameAr ? farm.nameAr : farm.name
          const color = ndviColor(farm.ndviValue)
          const pct = Math.round(farm.ndviValue * 100)
          const TrendIco = trendIcon[farm.trend]
          return (
            <div key={farm.id} className="p-5">
              <div className="min-w-0">
                <h4 className="truncate font-bold">{displayName}</h4>
                <span className="gis-readout text-neutral-dark/50 dark:text-neutral-light/50">{farm.id}</span>
              </div>
              <div className="mt-3 text-3xl font-black" style={{ color }}>{pct}%</div>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ndviStatusStyles[farm.status]}`}>
                  {t(`liveNdvi.status.${farm.status}`)}
                </span>
                <span className={`flex items-center gap-1 text-xs font-semibold ${ndviTrendStyles[farm.trend]}`}>
                  <TrendIco className="h-3.5 w-3.5" />
                  {t(`liveNdvi.trend.${farm.trend}`)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
