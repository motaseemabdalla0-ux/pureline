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

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  const toneClass = tone === 'up' ? 'text-secondary' : tone === 'down' ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'
  return (
    <div className="min-w-0">
      <div className="truncate text-[10px] text-slate-400">{label}</div>
      <div className={`text-xs font-bold ${toneClass}`}>{value}</div>
    </div>
  )
}

/** Small multi-metric sidebar stat block: current/previous NDVI, 12- and
 * 36-month real trend %, improvement/degradation %, and last-captured date. */
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
  const previousPct = farm.previousNdvi !== undefined ? Math.round(farm.previousNdvi * 100) : null

  const hasStats =
    previousPct !== null ||
    farm.ndvi12moTrendPercent !== undefined ||
    farm.ndvi36moTrendPercent !== undefined ||
    farm.improvementPercent !== undefined ||
    farm.degradationPercent !== undefined

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

      {hasStats && (
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-black/5 pt-3 dark:border-white/10">
          {previousPct !== null && (
            <MiniStat label={t('liveNdvi.stats.previous')} value={`${previousPct}%`} />
          )}
          {farm.ndvi12moTrendPercent !== undefined && (
            <MiniStat
              label={t('liveNdvi.stats.trend12mo')}
              value={`${farm.ndvi12moTrendPercent > 0 ? '+' : ''}${farm.ndvi12moTrendPercent.toFixed(1)}%`}
              tone={farm.ndvi12moTrendPercent >= 0 ? 'up' : 'down'}
            />
          )}
          {farm.ndvi36moTrendPercent !== undefined && (
            <MiniStat
              label={t('liveNdvi.stats.trend36mo')}
              value={`${farm.ndvi36moTrendPercent > 0 ? '+' : ''}${farm.ndvi36moTrendPercent.toFixed(1)}%`}
              tone={farm.ndvi36moTrendPercent >= 0 ? 'up' : 'down'}
            />
          )}
          {farm.improvementPercent !== undefined && (
            <MiniStat label={t('liveNdvi.stats.improvement')} value={`+${farm.improvementPercent.toFixed(1)}%`} tone="up" />
          )}
          {farm.degradationPercent !== undefined && (
            <MiniStat label={t('liveNdvi.stats.degradation')} value={`-${farm.degradationPercent.toFixed(1)}%`} tone="down" />
          )}
        </div>
      )}

      <div className="gis-readout mt-3 border-t border-black/5 pt-2 text-slate-400 dark:border-white/10">
        {t('liveNdvi.card.lastCaptured')}: <span className="text-slate-500 dark:text-slate-300">{captured}</span>
      </div>
    </div>
  )
}
