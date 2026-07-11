import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import SatelliteImage from '../ui/SatelliteImage'
import GisFrame from '../ui/GisFrame'

const YEARS = [
  { key: '2023', source: 'alula_valley_2023' },
  { key: '2024', source: 'alula_valley_2024' },
  { key: '2025', source: 'alula_valley' },
] as const

interface SatelliteTimelineViewerProps {
  className?: string
}

/**
 * Lets the viewer step between real regional captures of the AlUla valley
 * across three years. This shows the same real region across time -- it is
 * NOT per-farm imagery history (we only have two real NDVI% data points per
 * farm, in ndvi-farms.json's trendHistory).
 */
export default function SatelliteTimelineViewer({ className = '' }: SatelliteTimelineViewerProps) {
  const { t } = useTranslation()
  const [active, setActive] = useState(2)

  return (
    <GisFrame scanline className={className}>
      <div className="relative">
        <SatelliteImage
          key={YEARS[active].source}
          source={YEARS[active].source}
          alt={t('satelliteTimeline.imageAlt', { year: YEARS[active].key })}
          className="aspect-[16/10] w-full"
          priority={false}
        />
      </div>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="gis-readout text-slate-400">{t('satelliteTimeline.caption')}</p>
          <div className="flex shrink-0 gap-1.5 rounded-full bg-white/5 p-1">
            {YEARS.map((y, i) => (
              <button
                key={y.key}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={active === i}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  active === i ? 'bg-secondary text-slate-950' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                {y.key}
              </button>
            ))}
          </div>
        </div>
      </div>
    </GisFrame>
  )
}
