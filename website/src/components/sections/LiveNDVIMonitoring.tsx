import { useTranslation } from 'react-i18next'
import { Satellite } from 'lucide-react'
import Reveal from '../ui/Reveal'
import SatelliteFarmCard from '../satellite/SatelliteFarmCard'
import NdviStatusCard from '../satellite/NdviStatusCard'
import VegetationTrendChart from '../satellite/VegetationTrendChart'
import dataset from '../../data/ndvi-farms.json'
import { regionalSourceForFarm } from '../../lib/ndvi'
import type { NdviDataset } from '../../types/ndvi'

const data = dataset as NdviDataset

export default function LiveNDVIMonitoring() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const updated = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(data.lastUpdated))

  return (
    <section id="live-ndvi" className="relative py-24 sm:py-32">
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('liveNdvi.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h2 className="section-title mt-5">{t('liveNdvi.title')}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('liveNdvi.subtitle')}</p></Reveal>
          <Reveal delay={0.15}>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 text-xs font-medium text-neutral-dark/60 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-neutral-light/60">
              <Satellite className="h-4 w-4 text-primary dark:text-secondary" />
              <span>{t('liveNdvi.caption', { source: data.source, date: updated })}</span>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.farms.map((farm, i) => (
            <Reveal key={farm.id} delay={i * 0.08} className="h-full">
              <div className="flex h-full flex-col gap-3">
                <SatelliteFarmCard farm={farm} satelliteSource={regionalSourceForFarm(farm.id)} locale={locale} className="flex-1" />
                <NdviStatusCard farm={farm} locale={locale} />
                <VegetationTrendChart farm={farm} locale={locale} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
