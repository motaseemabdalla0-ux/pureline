import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Printer, Loader2, AlertTriangle, ClipboardList, Bug, Droplets } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { reportPdfUrl, listOperations, listPestDetections, listIrrigationEvents } from '../lib/platformApi'
import { OPERATION_STATUSES, operationStatusStyles } from '../lib/operations'
import { PEST_RISK_LEVELS, pestRiskStyles } from '../lib/pests'
import dataset from '../data/ndvi-farms.json'
import type { NdviDataset } from '../types/ndvi'
import type { Operation, PestDetection, IrrigationEvent, ReportType } from '../types/platform'

const ndviData = dataset as NdviDataset
const REPORT_TYPES: ReportType[] = ['ndvi', 'satellite', 'health', 'operational']

function paramsForFarm(farm: NdviDataset['farms'][number]) {
  return {
    name: farm.name,
    ndvi_value: farm.ndviValue,
    status: farm.status,
    trend: farm.trend,
    last_captured: farm.lastCaptured,
    previous_ndvi: farm.previousNdvi,
    trend_12mo_percent: farm.ndvi12moTrendPercent,
    trend_36mo_percent: farm.ndvi36moTrendPercent,
  }
}

function SummaryCard({ icon: Icon, title, children }: { icon: typeof ClipboardList; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary dark:text-secondary">
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

export default function ReportingCenterPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'

  const [operations, setOperations] = useState<Operation[] | null>(null)
  const [detections, setDetections] = useState<PestDetection[] | null>(null)
  const [events, setEvents] = useState<IrrigationEvent[] | null>(null)
  const [error, setError] = useState(false)
  const [selectedFarmId, setSelectedFarmId] = useState(ndviData.farms[0]?.id ?? '')
  const farm = ndviData.farms.find((f) => f.id === selectedFarmId) ?? ndviData.farms[0]

  useEffect(() => {
    let cancelled = false
    Promise.all([listOperations(), listPestDetections(), listIrrigationEvents()])
      .then(([ops, pests, irr]) => {
        if (cancelled) return
        setOperations(ops)
        setDetections(pests)
        setEvents(irr)
      })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [])

  const opsByStatus = useMemo(() => {
    if (!operations) return null
    const counts = Object.fromEntries(OPERATION_STATUSES.map((s) => [s, 0])) as Record<string, number>
    operations.forEach((o) => { counts[o.status] = (counts[o.status] ?? 0) + 1 })
    return counts
  }, [operations])

  const pestsByRisk = useMemo(() => {
    if (!detections) return null
    const counts = Object.fromEntries(PEST_RISK_LEVELS.map((r) => [r, 0])) as Record<string, number>
    detections.forEach((d) => { counts[d.risk_level] = (counts[d.risk_level] ?? 0) + 1 })
    return counts
  }, [detections])

  const recentIrrigation = useMemo(() => {
    if (!events) return null
    return [...events]
      .sort((a, b) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime())
      .slice(0, 8)
  }, [events])

  const weekWater = useMemo(() => {
    if (!events) return null
    return events.reduce((sum, e) => sum + (e.water_volume_m3 ?? 0), 0)
  }, [events])

  return (
    <PlatformPageShell title={`${t('platformReports.title')} — PURE LINE`} description={t('platformReports.subtitle')}>
      <div className="container-px">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">{t('platformReports.eyebrow')}</span>
            <h1 className="mt-4 text-2xl font-black sm:text-3xl">{t('platformReports.title')}</h1>
            <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('platformReports.subtitle')}</p>
          </div>
          <button type="button" onClick={() => window.print()} className="btn-ghost print:hidden">
            <Printer className="h-4 w-4" /> {t('platformReports.printBtn')}
          </button>
        </div>

        {/* Per-farm PDF report hub */}
        <div className="mt-12">
          <h2 className="text-lg font-bold">{t('platformReports.farmReportsSection')}</h2>
          <div className="mt-4 max-w-sm">
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
            >
              {ndviData.farms.map((f) => (
                <option key={f.id} value={f.id}>{lang === 'ar' && f.nameAr ? f.nameAr : f.name}</option>
              ))}
            </select>
          </div>
          {farm && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {REPORT_TYPES.map((rt, i) => (
                <Reveal key={rt} delay={i * 0.05}>
                  <a
                    href={reportPdfUrl(rt, farm.id, paramsForFarm(farm))}
                    className="flex h-full flex-col items-center gap-3 rounded-2xl border border-black/5 bg-white p-6 text-center shadow-sm transition hover:shadow-lg dark:border-white/10 dark:bg-white/5 print:hidden"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary dark:text-secondary">
                      <Download className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold">{t(`farmReportsPage.reportTypes.${rt}`)}</span>
                    <span className="text-xs font-semibold text-primary dark:text-secondary">{t('farmReportsPage.generate')}</span>
                  </a>
                </Reveal>
              ))}
            </div>
          )}
        </div>

        {/* On-page operational summaries */}
        <div className="mt-14">
          <h2 className="text-lg font-bold">{t('platformReports.operationalSummarySection')}</h2>

          {error && (
            <div className="mt-6 flex flex-col items-center gap-2 py-12 text-red-500">
              <AlertTriangle className="h-6 w-6" />
              <p className="text-sm">{t('common.error')}</p>
            </div>
          )}

          {!error && (
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <SummaryCard icon={ClipboardList} title={t('platformReports.operationsByStatus')}>
                {!opsByStatus ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {OPERATION_STATUSES.map((s) => (
                      <li key={s} className="flex items-center justify-between">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${operationStatusStyles[s]}`}>
                          {t(`platformOperations.status.${s}`)}
                        </span>
                        <span className="font-bold">{opsByStatus[s] ?? 0}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </SummaryCard>

              <SummaryCard icon={Bug} title={t('platformReports.pestsByRisk')}>
                {!pestsByRisk ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {PEST_RISK_LEVELS.map((r) => (
                      <li key={r} className="flex items-center justify-between">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pestRiskStyles[r]}`}>
                          {t(`platformPests.risk.${r}`)}
                        </span>
                        <span className="font-bold">{pestsByRisk[r] ?? 0}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </SummaryCard>

              <SummaryCard icon={Droplets} title={t('platformReports.irrigationUsage')}>
                {weekWater === null ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : (
                  <>
                    <div className="text-2xl font-black text-primary dark:text-secondary">
                      {weekWater.toLocaleString(lang)} m&sup3;
                    </div>
                    <p className="mt-1 text-xs text-neutral-dark/50 dark:text-neutral-light/50">{t('platformReports.totalRecordedVolume')}</p>
                    {recentIrrigation && recentIrrigation.length > 0 && (
                      <ul className="mt-4 space-y-1.5 border-t border-black/5 pt-3 text-xs dark:border-white/10">
                        {recentIrrigation.map((e) => (
                          <li key={e.id} className="flex items-center justify-between">
                            <span className="text-neutral-dark/60 dark:text-neutral-light/60">
                              {new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric' }).format(new Date(e.scheduled_start))}
                            </span>
                            <span className="font-semibold">{e.water_volume_m3 ? `${e.water_volume_m3} m³` : '—'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </SummaryCard>
            </div>
          )}
        </div>
      </div>
    </PlatformPageShell>
  )
}
