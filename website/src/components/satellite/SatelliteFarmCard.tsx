import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import SatelliteImage from '../ui/SatelliteImage'
import GisFrame from '../ui/GisFrame'
import { ndviColor, ndviStatusStyles, ndviTrendStyles } from '../../lib/ndvi'
import type { NdviFarm } from '../../types/ndvi'

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus }

interface SatelliteFarmCardProps {
  farm: NdviFarm
  /** Manifest key for the regional satellite image used as visual context. */
  satelliteSource: string
  locale?: string
  className?: string
}

/**
 * Farm card with a real satellite-image backdrop (regional context, not a
 * literal photo of the field boundary) plus real NDVI%, status and
 * acquisition-date readouts. Visual base for Live NDVI Monitoring.
 */
export default function SatelliteFarmCard({ farm, satelliteSource, locale, className = '' }: SatelliteFarmCardProps) {
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
    <motion.div whileHover={{ y: -6 }} className={`h-full ${className}`}>
      <GisFrame className="h-full">
        <div className="relative">
          <SatelliteImage
            source={satelliteSource}
            variant="dark"
            alt={t('satelliteFarmCard.imageAlt', { name: displayName })}
            className="aspect-[4/3] w-full"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 pt-12">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-bold text-white">{displayName}</h3>
                <span className="gis-readout text-white/60">{farm.id}</span>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${ndviStatusStyles[farm.status]}`}>
                {t(`liveNdvi.status.${farm.status}`)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
          <div>
            <div className="text-2xl font-black" style={{ color }}>{pct}%</div>
            <div className="text-xs text-slate-400">{t('liveNdvi.card.ndviValue')}</div>
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-semibold ${ndviTrendStyles[farm.trend]}`}>
            <TrendIco className="h-4 w-4" />
            {t(`liveNdvi.trend.${farm.trend}`)}
          </div>
        </div>

        <div className="gis-readout border-t border-white/10 px-4 py-2">
          {t('liveNdvi.card.lastCaptured')}: <span className="text-slate-300">{captured}</span>
        </div>
      </GisFrame>
    </motion.div>
  )
}
