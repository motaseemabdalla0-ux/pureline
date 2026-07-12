import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import NdviStatusCard from '../components/satellite/NdviStatusCard'
import VegetationTrendChart from '../components/satellite/VegetationTrendChart'
import FarmComparisonPanel from '../components/satellite/FarmComparisonPanel'
import { ndviColor } from '../lib/ndvi'
import dataset from '../data/ndvi-farms.json'
import type { NdviDataset, NdviFarm, NdviStatus } from '../types/ndvi'

const ndviData = dataset as NdviDataset

export default function NdviAnalyticsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const [statusFilter, setStatusFilter] = useState<NdviStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState(ndviData.farms[0]?.id ?? '')
  const [compareIds, setCompareIds] = useState<string[]>(ndviData.farms.slice(0, 3).map((f) => f.id))

  const filteredFarms = useMemo(
    () => (statusFilter === 'all' ? ndviData.farms : ndviData.farms.filter((f) => f.status === statusFilter)),
    [statusFilter],
  )

  const selectedFarm = ndviData.farms.find((f) => f.id === selectedId) ?? ndviData.farms[0]

  const summary = useMemo(() => {
    const values = ndviData.farms.map((f) => f.ndviValue)
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    return {
      avg,
      min: Math.min(...values),
      max: Math.max(...values),
      count: ndviData.farms.length,
    }
  }, [])

  const compareFarms: NdviFarm[] = compareIds
    .map((id) => ndviData.farms.find((f) => f.id === id))
    .filter((f): f is NdviFarm => Boolean(f))
    .slice(0, 3)

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) return [...prev.slice(1), id]
      return [...prev, id]
    })
  }

  return (
    <PlatformPageShell title={`${t('ndviAnalyticsPage.title')} — PURE LINE`} description={t('ndviAnalyticsPage.subtitle')}>
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('ndviAnalyticsPage.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h1 className="section-title mt-5">{t('ndviAnalyticsPage.title')}</h1></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('ndviAnalyticsPage.subtitle')}</p></Reveal>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {([
            ['farms', summary.count, undefined],
            ['avg', summary.avg, undefined],
            ['max', summary.max, ndviColor(summary.max)],
            ['min', summary.min, ndviColor(summary.min)],
          ] as const).map(([k, v, color]) => (
            <Reveal key={k}>
              <div className="rounded-2xl border border-black/5 bg-white p-5 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="text-2xl font-black" style={color ? { color } : undefined}>
                  {k === 'farms' ? v : `${Math.round((v as number) * 100)}%`}
                </div>
                <div className="mt-1 text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">{t(`ndviAnalyticsPage.summary.${k}`)}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Farm grid */}
        <div className="mt-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{t('farmMonitoringPage.title')}</h2>
            <div className="flex flex-wrap gap-2">
              {(['all', 'healthy', 'moderate', 'degraded'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    statusFilter === s ? 'bg-primary text-white' : 'bg-black/5 text-neutral-dark/70 dark:bg-white/10 dark:text-neutral-light/70'
                  }`}
                >
                  {s === 'all' ? t('ndviAnalyticsPage.filterAll') : t(`liveNdvi.status.${s}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFarms.map((farm, i) => {
              const displayName = lang === 'ar' && farm.nameAr ? farm.nameAr : farm.name
              const inCompare = compareIds.includes(farm.id)
              return (
                <Reveal key={farm.id} delay={i * 0.04}>
                  <div
                    className={`cursor-pointer rounded-2xl transition ${selectedId === farm.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedId(farm.id)}
                  >
                    <NdviStatusCard farm={farm} />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleCompare(farm.id) }}
                      className={`mt-2 w-full rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                        inCompare
                          ? 'border-primary bg-primary/10 text-primary dark:text-secondary'
                          : 'border-black/10 text-neutral-dark/50 hover:border-primary/40 dark:border-white/10 dark:text-neutral-light/50'
                      }`}
                    >
                      {displayName} · {t('ndviAnalyticsPage.comparisonTitle')}
                    </button>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>

        {/* Trend chart for selected farm */}
        {selectedFarm && (
          <div className="mt-16">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{t('ndviAnalyticsPage.trendTitle')}</h2>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
              >
                {ndviData.farms.map((f) => (
                  <option key={f.id} value={f.id}>{lang === 'ar' && f.nameAr ? f.nameAr : f.name}</option>
                ))}
              </select>
            </div>
            <Reveal delay={0.05} className="mt-6">
              <VegetationTrendChart farm={selectedFarm} />
            </Reveal>
          </div>
        )}

        {/* Comparison panel */}
        <div className="mt-16">
          <h2 className="text-lg font-bold">{t('ndviAnalyticsPage.comparisonTitle')}</h2>
          <p className="mt-1.5 text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('ndviAnalyticsPage.comparisonHint')}</p>
          {compareFarms.length > 0 && (
            <Reveal delay={0.05} className="mt-6">
              <FarmComparisonPanel farms={compareFarms} />
            </Reveal>
          )}
        </div>
      </div>
    </PlatformPageShell>
  )
}
