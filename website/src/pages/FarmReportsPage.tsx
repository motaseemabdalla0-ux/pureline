import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Printer } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { ndviColor } from '../lib/ndvi'
import { reportPdfUrl } from '../lib/platformApi'
import dataset from '../data/ndvi-farms.json'
import type { NdviDataset } from '../types/ndvi'
import type { ReportType } from '../types/platform'

const ndviData = dataset as NdviDataset
const REPORT_TYPES: ReportType[] = ['ndvi', 'satellite', 'health', 'operational']

export default function FarmReportsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const [selectedId, setSelectedId] = useState(ndviData.farms[0]?.id ?? '')
  const farm = ndviData.farms.find((f) => f.id === selectedId) ?? ndviData.farms[0]

  const paramsFor = () => ({
    name: farm.name,
    ndvi_value: farm.ndviValue,
    status: farm.status,
    trend: farm.trend,
    last_captured: farm.lastCaptured,
    previous_ndvi: farm.previousNdvi,
    trend_12mo_percent: farm.ndvi12moTrendPercent,
    trend_36mo_percent: farm.ndvi36moTrendPercent,
  })

  return (
    <PlatformPageShell title={`${t('farmReportsPage.title')} — PURE LINE`} description={t('farmReportsPage.subtitle')}>
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('farmReportsPage.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h1 className="section-title mt-5">{t('farmReportsPage.title')}</h1></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('farmReportsPage.subtitle')}</p></Reveal>
        </div>

        <Reveal delay={0.1} className="mx-auto mt-12 max-w-xl">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
          >
            {ndviData.farms.map((f) => (
              <option key={f.id} value={f.id}>{lang === 'ar' && f.nameAr ? f.nameAr : f.name}</option>
            ))}
          </select>
        </Reveal>

        {farm && (
          <>
            <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {REPORT_TYPES.map((rt, i) => (
                <Reveal key={rt} delay={i * 0.05}>
                  <a
                    href={reportPdfUrl(rt, farm.id, paramsFor())}
                    className="flex h-full flex-col items-center gap-3 rounded-2xl border border-black/5 bg-white p-6 text-center shadow-sm transition hover:shadow-lg dark:border-white/10 dark:bg-white/5"
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

            {/* Printable on-screen preview */}
            <Reveal delay={0.1} className="mx-auto mt-16 max-w-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{t('farmReportsPage.onScreenTitle')}</h2>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-ghost print:hidden"
                >
                  <Printer className="h-4 w-4" /> {t('farmReportsPage.printBtn')}
                </button>
              </div>

              <div className="mt-6 rounded-3xl border border-black/5 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between border-b border-black/10 pb-4 dark:border-white/10">
                  <h3 className="text-xl font-black">{lang === 'ar' && farm.nameAr ? farm.nameAr : farm.name}</h3>
                  <span className="font-mono text-xs text-neutral-dark/50 dark:text-neutral-light/50">{farm.id}</span>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-dark/40 dark:text-neutral-light/40">{t('liveNdvi.card.ndviValue')}</div>
                    <div className="mt-1 text-2xl font-black" style={{ color: ndviColor(farm.ndviValue) }}>{Math.round(farm.ndviValue * 100)}%</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-dark/40 dark:text-neutral-light/40">{t(`liveNdvi.status.${farm.status}`)}</div>
                    <div className="mt-1 text-sm font-semibold">{t(`liveNdvi.trend.${farm.trend}`)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-dark/40 dark:text-neutral-light/40">{t('liveNdvi.card.lastCaptured')}</div>
                    <div className="mt-1 text-sm font-semibold">
                      {new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(farm.lastCaptured))}
                    </div>
                  </div>
                  {farm.ndvi12moTrendPercent !== undefined && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-dark/40 dark:text-neutral-light/40">{t('liveNdvi.stats.trend12mo')}</div>
                      <div className="mt-1 text-sm font-semibold">{farm.ndvi12moTrendPercent > 0 ? '+' : ''}{farm.ndvi12moTrendPercent.toFixed(1)}%</div>
                    </div>
                  )}
                  {farm.ndvi36moTrendPercent !== undefined && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-dark/40 dark:text-neutral-light/40">{t('liveNdvi.stats.trend36mo')}</div>
                      <div className="mt-1 text-sm font-semibold">{farm.ndvi36moTrendPercent > 0 ? '+' : ''}{farm.ndvi36moTrendPercent.toFixed(1)}%</div>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </>
        )}
      </div>
    </PlatformPageShell>
  )
}
