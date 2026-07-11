import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Minus, Satellite } from 'lucide-react'
import { ndviColor, ndviStatusStyles, ndviTrendStyles } from '../../lib/ndvi'
import type { NdviFarm } from '../../types/ndvi'

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus }

interface FarmHealthWidgetProps {
  farm: NdviFarm
  locale?: string
  className?: string
}

/** Small multi-metric sidebar stat block: NDVI, trend, status, last-captured. */
export default function FarmHealthWidget({ farm, locale, className = '' }: FarmHealthWidgetProps) {
  const { t, i18n } = useTranslation()
  const lang = locale ?? (i18n.language.startsWith('ar') ? 'ar' : 'en')
  const displayName = lang === 'ar' && farm.nameAr ? farm.nameAr : farm.name
  const color = ndviColor(farm.ndviValue)
  const pct = Math.round(farm.ndviValue * 100)
  const TrendIco = trendIcon[farm.trend]
  const captured = new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(farm.lastCaptured))

  return (
    <div className={`rounded-xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-slate-900 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Satellite className="h-4 w-4 shrink-0 text-primary dark:text-secondary" />
          <span className="truncate text-sm font-bold text-slate-900 dark:text-white">{displayName}</span>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ndviStatusStyles[farm.status]}`}>
          {t(`liveNdvi.status.${farm.status}`)}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-2xl font-black" style={{ color }}>{pct}%</div>
          <div className="text-[11px] text-slate-400">{t('liveNdvi.card.ndviValue')}</div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${ndviTrendStyles[farm.trend]}`}>
          <TrendIco className="h-3.5 w-3.5" />
          {t(`liveNdvi.trend.${farm.trend}`)}
        </div>
      </div>

      <div className="gis-readout mt-3 border-t border-black/5 pt-2 text-slate-400 dark:border-white/10">
        {t('liveNdvi.card.lastCaptured')}: <span className="text-slate-500 dark:text-slate-300">{captured}</span>
      </div>
    </div>
  )
}
