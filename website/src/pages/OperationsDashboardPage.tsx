import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Tractor, Activity, ClipboardList, CheckCircle2, Droplets, Bug, ScanLine, Users,
  AlertTriangle, Loader2, MapPin, ArrowUpRight,
} from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import { getOpsDashboard, listOperations, listRegistryFarms, PlatformApiError } from '../lib/platformApi'
import { OPERATION_STATUSES, operationStatusChartColor, operationStatusDot } from '../lib/operations'
import LazyFarmGisMap from '../components/gis/LazyFarmGisMap'
import WeatherWidget from '../components/gis/WeatherWidget'
import { getGisFarms } from '../lib/gisData'
import dataset from '../data/ndvi-farms.json'
import type { NdviDataset } from '../types/ndvi'
import type { Operation, OpsDashboard, RegistryFarm } from '../types/platform'

const ndviData = dataset as NdviDataset

function CenterLoader() {
  return (
    <div className="flex justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function CenterError() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-2 py-24 text-red-500">
      <AlertTriangle className="h-6 w-6" />
      <p className="text-sm">{t('common.error')}</p>
    </div>
  )
}

export default function OperationsDashboardPage() {
  const { t, i18n } = useTranslation()
  const { user } = usePlatformAuth()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'

  const [dash, setDash] = useState<OpsDashboard | null>(null)
  const [operations, setOperations] = useState<Operation[] | null>(null)
  const [farms, setFarms] = useState<RegistryFarm[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(false)
    Promise.all([getOpsDashboard(), listOperations(), listRegistryFarms()])
      .then(([d, ops, f]) => {
        setDash(d)
        setOperations(ops)
        setFarms(f)
      })
      .catch((err) => {
        // A 401 here means the session went stale mid-visit; surface a plain error,
        // ProtectedRoute + the auth context will handle redirecting on next nav.
        if (err instanceof PlatformApiError) setError(true)
        else setError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  const ndviAlerts = useMemo(
    () => ndviData.farms.filter((f) => f.status === 'degraded' || (f.ndvi12moTrendPercent ?? 0) < 0),
    [],
  )

  const delayedOperations = useMemo(() => (operations ?? []).filter((o) => o.status === 'delayed'), [operations])

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    OPERATION_STATUSES.forEach((s) => { counts[s] = 0 })
    ;(operations ?? []).forEach((o) => { counts[o.status] = (counts[o.status] ?? 0) + 1 })
    const max = Math.max(1, ...Object.values(counts))
    return { counts, max }
  }, [operations])

  const farmsByRegion = useMemo(() => {
    const groups = new Map<string, RegistryFarm[]>()
    ;(farms ?? []).forEach((f) => {
      const key = f.region || t('platformDashboard.unspecifiedRegion')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(f)
    })
    return Array.from(groups.entries())
  }, [farms, t])

  if (loading) {
    return (
      <PlatformPageShell title={`${t('platformDashboard.title')} — PURE LINE`}>
        <div className="container-px"><CenterLoader /></div>
      </PlatformPageShell>
    )
  }

  if (error || !dash) {
    return (
      <PlatformPageShell title={`${t('platformDashboard.title')} — PURE LINE`}>
        <div className="container-px"><CenterError /></div>
      </PlatformPageShell>
    )
  }

  const kpis = [
    { key: 'totalFarms', value: dash.total_farms, icon: Tractor },
    { key: 'activeOperations', value: dash.active_operations, icon: Activity },
    { key: 'completedThisMonth', value: dash.completed_operations_this_month, icon: CheckCircle2 },
    { key: 'openTasks', value: dash.open_tasks, icon: ClipboardList },
    { key: 'irrigationToday', value: dash.irrigation_events_today, icon: Droplets },
    { key: 'pestAlerts', value: dash.active_pest_alerts, icon: Bug },
    { key: 'ndviAlerts', value: ndviAlerts.length, icon: ScanLine },
    { key: 'teamActivities', value: dash.recent_activity.length, icon: Users },
  ] as const

  return (
    <PlatformPageShell title={`${t('platformDashboard.title')} — PURE LINE`} description={t('platformDashboard.subtitle')}>
      <div className="container-px">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">{t('platformDashboard.eyebrow')}</span>
            <h1 className="mt-4 text-2xl font-black sm:text-3xl">
              {t('platformDashboard.greeting', { name: user?.full_name ?? user?.username ?? '' })}
            </h1>
            <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('platformDashboard.subtitle')}</p>
          </div>
          <Link to="/platform/operations" className="btn-primary">
            <ClipboardList className="h-4 w-4" /> {t('platformDashboard.viewOperations')}
          </Link>
        </div>

        {/* KPI cards */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {kpis.map(({ key, value, icon: Icon }, i) => (
            <Reveal key={key} delay={i * 0.03}>
              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <Icon className="h-5 w-5 text-primary dark:text-secondary" />
                <div className="mt-3 text-2xl font-black">{value}</div>
                <div className="mt-1 text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">
                  {t(`platformDashboard.kpi.${key}`)}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-5">
          {/* Operations by status chart */}
          <Reveal className="lg:col-span-2">
            <div className="h-full rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">
                {t('platformDashboard.statusBreakdown')}
              </h2>
              <div className="mt-5 space-y-3">
                {OPERATION_STATUSES.map((s) => {
                  const count = statusBreakdown.counts[s] ?? 0
                  const widthPct = Math.round((count / statusBreakdown.max) * 100)
                  return (
                    <div key={s}>
                      <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-neutral-dark/70 dark:text-neutral-light/70">
                          <span className={`h-2 w-2 rounded-full ${operationStatusDot[s]}`} />
                          {t(`platformOperations.status.${s}`)}
                        </span>
                        <span>{count}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${widthPct}%`, backgroundColor: operationStatusChartColor[s] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Reveal>

          {/* Activity timeline */}
          <Reveal delay={0.05} className="lg:col-span-3">
            <div className="h-full rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">
                {t('platformDashboard.activityTimeline')}
              </h2>
              {dash.recent_activity.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformDashboard.noActivity')}</p>
              ) : (
                <ol className="mt-5 space-y-0">
                  {dash.recent_activity.map((a, i) => (
                    <li key={`${a.timestamp}-${i}`} className="relative ps-6 pb-5 last:pb-0">
                      {i < dash.recent_activity.length - 1 && (
                        <span className="absolute start-[5px] top-3 h-full w-px bg-black/10 dark:bg-white/10" />
                      )}
                      <span className="absolute start-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary dark:bg-secondary" />
                      <div className="text-sm font-semibold text-neutral-dark/85 dark:text-neutral-light/85">{a.description}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-neutral-dark/45 dark:text-neutral-light/45">
                        <span className="rounded-full bg-black/5 px-2 py-0.5 font-semibold dark:bg-white/10">{a.type}</span>
                        <span>{a.status}</span>
                        <span>· {new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(a.timestamp))}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Reveal>
        </div>

        {/* Live GIS overview + agro-weather */}
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-bold">{t('gisMap.overviewTitle')}</h2>
            <LazyFarmGisMap farms={getGisFarms()} height="400px" />
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mb-4 text-lg font-bold">{t('weather.sectionTitle')}</h2>
            <div className="space-y-4">
              {getGisFarms().slice(0, 3).map((f) => (
                <WeatherWidget key={f.id} lat={f.center[0]} lng={f.center[1]} label={lang === 'ar' && f.nameAr ? f.nameAr : f.name} />
              ))}
            </div>
          </Reveal>
        </div>

        {/* Alerts center */}
        <div className="mt-14">
          <h2 className="text-lg font-bold">{t('platformDashboard.alertsCenter')}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dash.active_pest_alerts > 0 && (
              <Reveal>
                <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                  <Bug className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div>
                    <div className="text-sm font-bold text-red-500">{t('platformDashboard.alerts.pest', { count: dash.active_pest_alerts })}</div>
                    <p className="mt-1 text-xs text-neutral-dark/60 dark:text-neutral-light/60">{t('platformDashboard.alerts.pestHint')}</p>
                  </div>
                </div>
              </Reveal>
            )}
            {ndviAlerts.map((f, i) => (
              <Reveal key={f.id} delay={0.03 * (i + 1)}>
                <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5">
                  <ScanLine className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-accent">{lang === 'ar' && f.nameAr ? f.nameAr : f.name}</div>
                    <p className="mt-1 text-xs text-neutral-dark/60 dark:text-neutral-light/60">{t('platformDashboard.alerts.ndviHint')}</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <Link to={`/ndvi-analytics?farm=${encodeURIComponent(f.id)}`} className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                        {t('platformDashboard.alerts.viewNdvi')} <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                      </Link>
                      <Link to={`/satellite-intelligence?farm=${encodeURIComponent(f.id)}`} className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                        {t('platformDashboard.alerts.viewSatellite')} <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
            {delayedOperations.map((o, i) => (
              <Reveal key={o.operation_id} delay={0.03 * (i + 1)}>
                <Link to={`/platform/operations/${o.operation_id}`} className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 transition hover:border-red-500/40">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div>
                    <div className="text-sm font-bold text-red-500">{t(`platformOperations.type.${o.operation_type}`)} · {o.farm_code}</div>
                    <p className="mt-1 text-xs text-neutral-dark/60 dark:text-neutral-light/60">{t('platformDashboard.alerts.delayedHint')}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
            {dash.active_pest_alerts === 0 && ndviAlerts.length === 0 && delayedOperations.length === 0 && (
              <div className="col-span-full rounded-2xl border border-black/5 bg-white p-6 text-center text-sm text-neutral-dark/50 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-neutral-light/50">
                {t('platformDashboard.alerts.none')}
              </div>
            )}
          </div>
        </div>

        {/* Farm overview */}
        <div className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{t('platformDashboard.farmOverview')}</h2>
            <Link to="/platform/farms" className="flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-secondary">
              {t('platformDashboard.viewAllFarms')}
              <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          </div>
          {farmsByRegion.length === 0 ? (
            <p className="mt-6 text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformDashboard.noFarms')}</p>
          ) : (
            <div className="mt-6 space-y-8">
              {farmsByRegion.map(([region, list]) => (
                <div key={region}>
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">
                    <MapPin className="h-3.5 w-3.5" /> {region}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {list.map((f, i) => (
                      <Reveal key={f.farm_code} delay={i * 0.03}>
                        <Link to={`/platform/farms/${f.farm_code}`} className="block rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/5">
                          <div className="font-mono text-[11px] text-neutral-dark/40 dark:text-neutral-light/40">{f.farm_code}</div>
                          <div className="mt-1 truncate text-sm font-bold">{f.name}</div>
                          <div className="mt-2 truncate text-xs text-neutral-dark/50 dark:text-neutral-light/50">
                            {f.crop_type ?? t('platformFarms.notRecorded')}
                          </div>
                        </Link>
                      </Reveal>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PlatformPageShell>
  )
}
