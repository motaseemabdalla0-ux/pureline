import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import SatelliteFarmCard from '../components/satellite/SatelliteFarmCard'
import { regionalSourceForFarm } from '../lib/ndvi'
import dataset from '../data/ndvi-farms.json'
import type { NdviDataset } from '../types/ndvi'

const ndviData = dataset as NdviDataset

export default function FarmMonitoringPage() {
  const { t } = useTranslation()

  return (
    <PlatformPageShell title={`${t('farmMonitoringPage.title')} — PURE LINE`} description={t('farmMonitoringPage.subtitle')}>
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('farmMonitoringPage.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h1 className="section-title mt-5">{t('farmMonitoringPage.title')}</h1></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('farmMonitoringPage.subtitle')}</p></Reveal>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ndviData.farms.map((farm, i) => (
            <Reveal key={farm.id} delay={i * 0.05}>
              <Link to={`/farm-monitoring/${farm.id}`} className="group block h-full">
                <SatelliteFarmCard farm={farm} satelliteSource={regionalSourceForFarm(farm.id)} />
                <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-secondary">
                  {t('farmMonitoringPage.viewDetails')}
                  <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 rtl:-scale-x-100" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </PlatformPageShell>
  )
}
