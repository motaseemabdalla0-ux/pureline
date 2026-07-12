import { useParams, Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import GisFrame from '../components/ui/GisFrame'
import SatelliteImage from '../components/ui/SatelliteImage'
import FieldBoundary from '../components/ui/FieldBoundary'
import FarmHealthWidget from '../components/satellite/FarmHealthWidget'
import VegetationTrendChart from '../components/satellite/VegetationTrendChart'
import FarmComparisonPanel from '../components/satellite/FarmComparisonPanel'
import { regionalSourceForFarm } from '../lib/ndvi'
import { getRealFarmImagery, REAL_FARM_IMAGE_BASE_PATH } from '../lib/realFarmImagery'
import dataset from '../data/ndvi-farms.json'
import type { NdviDataset } from '../types/ndvi'

const ndviData = dataset as NdviDataset

export default function FarmMonitoringDetailPage() {
  const { farmId } = useParams<{ farmId: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'

  const farm = ndviData.farms.find((f) => f.id === farmId)
  if (!farm) return <Navigate to="/farm-monitoring" replace />

  const displayName = lang === 'ar' && farm.nameAr ? farm.nameAr : farm.name
  const real = getRealFarmImagery(farm.id)
  const others = ndviData.farms.filter((f) => f.id !== farm.id).slice(0, 2)

  return (
    <PlatformPageShell title={`${displayName} — PURE LINE`}>
      <div className="container-px">
        <Link to="/farm-monitoring" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-secondary">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('farmMonitoringPage.backToList')}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
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
            </GisFrame>
          </Reveal>

          <Reveal delay={0.05} className="lg:col-span-2">
            <h1 className="text-2xl font-black">{displayName}</h1>
            <p className="mt-1 font-mono text-xs text-neutral-dark/50 dark:text-neutral-light/50">{farm.id}</p>
            <div className="mt-6">
              <FarmHealthWidget farm={farm} />
            </div>
          </Reveal>
        </div>

        <div className="mt-16">
          <h2 className="text-lg font-bold">{t('farmMonitoringPage.historyTitle')}</h2>
          <Reveal delay={0.05} className="mt-6">
            <VegetationTrendChart farm={farm} />
          </Reveal>
        </div>

        {others.length > 0 && (
          <div className="mt-16">
            <h2 className="text-lg font-bold">{t('farmMonitoringPage.compareTitle')}</h2>
            <Reveal delay={0.05} className="mt-6">
              <FarmComparisonPanel farms={[farm, ...others]} />
            </Reveal>
          </div>
        )}
      </div>
    </PlatformPageShell>
  )
}
