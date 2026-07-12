import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, FileText, Inbox, Loader2, AlertTriangle } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import StatusTimeline from '../components/platform/StatusTimeline'
import NdviStatusCard from '../components/satellite/NdviStatusCard'
import { getLastRememberedEmail, lookupRequestsByEmail, quotationPdfUrl } from '../lib/platformApi'
import type { ServiceRequest } from '../types/platform'
import dataset from '../data/ndvi-farms.json'
import type { NdviDataset } from '../types/ndvi'

const ndviData = dataset as NdviDataset

function matchFarm(req: ServiceRequest) {
  const needle = `${req.farm_name ?? ''} ${req.farm_location ?? ''}`.toLowerCase().trim()
  if (!needle) return undefined
  return ndviData.farms.find((f) => {
    const hay = `${f.name} ${f.nameAr ?? ''} ${f.id}`.toLowerCase()
    return needle.split(/\s+/).some((token) => token.length > 2 && hay.includes(token))
  })
}

export default function CustomerDashboardPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [requests, setRequests] = useState<ServiceRequest[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [searched, setSearched] = useState(false)

  const runLookup = async (targetEmail: string) => {
    if (!targetEmail.trim()) return
    setLoading(true)
    setError(false)
    setSearched(true)
    try {
      const res = await lookupRequestsByEmail(targetEmail.trim())
      setRequests(res)
    } catch {
      setError(true)
      setRequests(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const last = getLastRememberedEmail()
    if (last) {
      setEmail(last)
      void runLookup(last)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const kpis = useMemo(() => {
    if (!requests) return { total: 0, open: 0, completed: 0 }
    const completed = requests.filter((r) => r.status === 'completed').length
    return { total: requests.length, open: requests.length - completed, completed }
  }, [requests])

  return (
    <PlatformPageShell title={`${t('dashboardPage.title')} — PURE LINE`} description={t('dashboardPage.subtitle')}>
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('dashboardPage.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h1 className="section-title mt-5">{t('dashboardPage.title')}</h1></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('dashboardPage.subtitle')}</p></Reveal>
        </div>

        <Reveal delay={0.1} className="mx-auto mt-10 flex max-w-xl gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runLookup(email)}
            type="email"
            placeholder={t('dashboardPage.emailPlaceholder')}
            className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
          />
          <button onClick={() => runLookup(email)} disabled={loading} className="btn-primary shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="hidden sm:inline">{loading ? t('dashboardPage.looking') : t('dashboardPage.lookup')}</span>
          </button>
        </Reveal>

        {error && (
          <Reveal className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {t('common.error')}
          </Reveal>
        )}

        {searched && !loading && !error && requests && requests.length === 0 && (
          <Reveal className="mx-auto mt-16 max-w-md text-center">
            <Inbox className="mx-auto h-10 w-10 text-neutral-dark/30 dark:text-neutral-light/30" />
            <p className="mt-4 font-semibold">{t('dashboardPage.empty')}</p>
            <p className="mt-1.5 text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('dashboardPage.emptyHint')}</p>
          </Reveal>
        )}

        {requests && requests.length > 0 && (
          <>
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4">
              {([
                ['total', kpis.total],
                ['open', kpis.open],
                ['completed', kpis.completed],
              ] as const).map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-black/5 bg-white p-5 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="text-2xl font-black text-primary dark:text-secondary">{v}</div>
                  <div className="mt-1 text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">{t(`dashboardPage.kpi.${k}`)}</div>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-10 max-w-4xl space-y-6">
              {requests.map((r, i) => {
                const farm = matchFarm(r)
                return (
                  <Reveal key={r.request_id} delay={i * 0.05}>
                    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-8">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-mono text-xs text-neutral-dark/50 dark:text-neutral-light/50">{t('dashboardPage.requestId')}: {r.request_id}</div>
                          <h3 className="mt-1 text-lg font-bold">{r.service_name}</h3>
                          {r.created_at && (
                            <div className="mt-1 text-xs text-neutral-dark/50 dark:text-neutral-light/50">
                              {t('dashboardPage.submittedOn')}: {new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(r.created_at))}
                            </div>
                          )}
                        </div>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary dark:text-secondary">
                          {t(`dashboardPage.status.${r.status}`)}
                        </span>
                      </div>

                      <div className="mt-6 overflow-x-auto">
                        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-dark/40 dark:text-neutral-light/40">{t('dashboardPage.timelineTitle')}</div>
                        <StatusTimeline status={r.status} events={r.status_events} />
                      </div>

                      {r.quotations && r.quotations.length > 0 && (
                        <div className="mt-6 border-t border-black/5 pt-5 dark:border-white/10">
                          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-dark/40 dark:text-neutral-light/40">{t('dashboardPage.quotationsTitle')}</div>
                          <div className="flex flex-wrap gap-3">
                            {r.quotations.map((q) => (
                              <div key={q.quote_id} className="flex items-center gap-3 rounded-xl bg-black/5 px-4 py-2.5 text-sm dark:bg-white/10">
                                <FileText className="h-4 w-4 text-primary dark:text-secondary" />
                                <span className="font-mono text-xs">{q.quote_id}</span>
                                <Link to={`/quotations/${q.quote_id}`} className="font-semibold text-primary hover:underline dark:text-secondary">
                                  {t('dashboardPage.viewQuotation')}
                                </Link>
                                <a href={quotationPdfUrl(q.quote_id)} className="font-semibold text-primary hover:underline dark:text-secondary">
                                  {t('dashboardPage.downloadPdf')}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {farm && (
                        <div className="mt-6 border-t border-black/5 pt-5 dark:border-white/10">
                          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-dark/40 dark:text-neutral-light/40">{t('dashboardPage.farmDataTitle')}</div>
                          <NdviStatusCard farm={farm} className="max-w-sm" />
                        </div>
                      )}
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </>
        )}
      </div>
    </PlatformPageShell>
  )
}
