import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ShieldCheck } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import GisFrame from '../components/ui/GisFrame'
import SatelliteImage from '../components/ui/SatelliteImage'
import FieldBoundary from '../components/ui/FieldBoundary'
import FarmHealthWidget from '../components/satellite/FarmHealthWidget'
import { ndviColor, regionalSourceForFarm } from '../lib/ndvi'
import { getRealFarmImagery, REAL_FARM_IMAGE_BASE_PATH } from '../lib/realFarmImagery'
import dataset from '../data/ndvi-farms.json'
import type { NdviDataset } from '../types/ndvi'

const ndviData = dataset as NdviDataset
const ALERT_THRESHOLD_PERCENT = 5

export default function SatelliteIntelligencePage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'

  const alerts = useMemo(
    () =>
      ndviData.farms
        .filter((f) => (f.ndvi12moTrendPercent ?? 0) <= -ALERT_THRESHOLD_PERCENT)
        .map((f) => ({
          farm: f,
          percent: Math.abs(f.ndvi12moTrendPercent ?? 0),
        }))
        .sort((a, b) => b.percent - a.percent),
    [],
  )

  const avgNdvi = useMemo(
    () => ndviData.farms.reduce((a, f) => a + f.ndviValue, 0) / ndviData.farms.length,
    [],
  )

  return (
    <PlatformPageShell dark title={`${t('satelliteIntelPage.title')} — PURE LINE`} description={t('satelliteIntelPage.subtitle')}>
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow text-secondary">{t('satelliteIntelPage.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h1 className="mt-5 text-3xl font-black sm:text-4xl">{t('satelliteIntelPage.title')}</h1></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-slate-400">{t('satelliteIntelPage.subtitle')}</p></Reveal>
        </div>

        {/* Alerts */}
        <div className="mx-auto mt-14 max-w-4xl">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <AlertTriangle className="h-5 w-5 text-accent" /> {t('satelliteIntelPage.alertsTitle')}
          </h2>
          <div className="mt-5 space-y-3">
            {alerts.length === 0 && (
              <Reveal className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-300">
                <ShieldCheck className="h-5 w-5 shrink-0 text-secondary" /> {t('satelliteIntelPage.alertsEmpty')}
              </Reveal>
            )}
            {alerts.map(({ farm, percent }, i) => {
              const displayName = lang === 'ar' && farm.nameAr ? farm.nameAr : farm.name
              return (
                <Reveal key={farm.id} delay={i * 0.05}>
                  <div className="flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white">{displayName} <span className="gis-readout text-slate-400">· {farm.id}</span></div>
                      <p className="mt-0.5 text-sm text-slate-300">{t('satelliteIntelPage.alertMessage', { percent: percent.toFixed(1) })}</p>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>

        {/* Health summary */}
        <div className="mx-auto mt-16 max-w-5xl">
          <h2 className="text-lg font-bold text-white">{t('satelliteIntelPage.healthTitle')}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ndviData.farms.map((farm, i) => (
              <Reveal key={farm.id} delay={i * 0.04}>
                <FarmHealthWidget farm={farm} />
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-300">
            {t('liveNdvi.stats.current')}: <span className="font-bold" style={{ color: ndviColor(avgNdvi) }}>{Math.round(avgNdvi * 100)}%</span>
          </Reveal>
        </div>

        {/* Imagery + boundaries */}
        <div className="mx-auto mt-16 max-w-5xl">
          <h2 className="text-lg font-bold text-white">{t('satelliteIntelPage.imageryTitle')}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ndviData.farms.map((farm, i) => {
              const displayName = lang === 'ar' && farm.nameAr ? farm.nameAr : farm.name
              const real = getRealFarmImagery(farm.id)
              return (
                <Reveal key={farm.id} delay={i * 0.04}>
                  <GisFrame scanline>
                    <div className="relative">
                      {real ? (
                        <SatelliteImage
                          real={{ variants: real.variants, basePath: REAL_FARM_IMAGE_BASE_PATH, attribution: `Esri World Imagery · ${t('satelliteFarmCard.realSourceLabel')}` }}
                          alt={t('satelliteFarmCard.realImageAlt', { name: displayName })}
                          className="aspect-[4/3] w-full"
                        >
                          <FieldBoundary polygon={real.polygon} bbox={real.bbox} />
                        </SatelliteImage>
                      ) : (
                        <SatelliteImage
                          source={regionalSourceForFarm(farm.id)}
                          variant="dark"
                          alt={t('satelliteFarmCard.imageAlt', { name: displayName })}
                          className="aspect-[4/3] w-full"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
                      <span className="text-sm font-bold text-white">{displayName}</span>
                      <span className="gis-readout text-slate-400">{farm.id}</span>
                    </div>
                  </GisFrame>
                </Reveal>
              )
            })}
          </div>
        </div>
      </div>
    </PlatformPageShell>
  )
}
