import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Bell, BellRing, Loader2, AlertTriangle, CheckCheck, Bug, ScanLine, Droplets, Crosshair, Factory, ArrowUpRight,
} from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import {
  listNotifications, markAllNotificationsRead, markNotificationRead,
  listOperations, listTraps, listRecyclingStations, listPestDetections,
} from '../lib/platformApi'
import dataset from '../data/ndvi-farms.json'
import type { NdviDataset } from '../types/ndvi'
import type { PlatformNotification } from '../types/platform'

const ndviData = dataset as NdviDataset

const kindColors: Record<string, string> = {
  pest: 'bg-red-500', operation: 'bg-accent', irrigation: 'bg-blue-500',
  recycling: 'bg-secondary', user: 'bg-purple-500', system: 'bg-neutral-dark/40', info: 'bg-primary',
}

interface LiveAlert {
  id: string
  icon: typeof Bug
  severity: 'critical' | 'warning'
  title: string
  hint: string
  link: string
}

export default function NotificationsCenterPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'

  const [tab, setTab] = useState<'notifications' | 'alerts'>('notifications')
  const [items, setItems] = useState<PlatformNotification[] | null>(null)
  const [alerts, setAlerts] = useState<LiveAlert[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [marking, setMarking] = useState(false)

  const load = () => {
    setLoading(true)
    setError(false)
    Promise.all([
      listNotifications(),
      Promise.allSettled([listOperations(), listTraps(), listRecyclingStations(), listPestDetections()]),
    ])
      .then(([n, settled]) => {
        setItems(n)
        const [ops, traps, stations, detections] = settled
        const live: LiveAlert[] = []
        ndviData.farms
          .filter((f) => f.status === 'degraded' || (f.ndvi12moTrendPercent ?? 0) < 0)
          .forEach((f) => live.push({
            id: `ndvi-${f.id}`, icon: ScanLine, severity: f.status === 'degraded' ? 'critical' : 'warning',
            title: t('notificationsCenter.alert.ndvi', { name: lang === 'ar' && f.nameAr ? f.nameAr : f.name }),
            hint: t('notificationsCenter.alert.ndviHint', { pct: f.ndvi12moTrendPercent ?? 0 }),
            link: `/ndvi-analytics?farm=${encodeURIComponent(f.id)}`,
          }))
        if (ops.status === 'fulfilled') {
          ops.value.filter((o) => o.status === 'delayed').forEach((o) => live.push({
            id: `op-${o.operation_id}`, icon: Droplets, severity: 'critical',
            title: t('notificationsCenter.alert.delayedOp', { farm: o.farm_code }),
            hint: o.operation_id, link: `/platform/operations/${o.operation_id}`,
          }))
        }
        if (detections.status === 'fulfilled') {
          detections.value.filter((d) => d.status === 'active').forEach((d) => live.push({
            id: `pest-${d.detection_id}`, icon: Bug, severity: d.risk_level === 'high' || d.risk_level === 'critical' ? 'critical' : 'warning',
            title: t('notificationsCenter.alert.pest', { farm: d.farm_code }),
            hint: `${d.detection_id} · ${d.risk_level}`, link: `/platform/pests/${d.detection_id}`,
          }))
        }
        if (traps.status === 'fulfilled') {
          traps.value.filter((tr) => tr.status === 'needs_service' || tr.status === 'damaged').forEach((tr) => live.push({
            id: `trap-${tr.trap_code}`, icon: Crosshair, severity: 'warning',
            title: t('notificationsCenter.alert.trap', { code: tr.trap_code }),
            hint: `${tr.farm_code} · ${t(`trapsPage.status.${tr.status}`)}`, link: '/platform/traps',
          }))
        }
        if (stations.status === 'fulfilled') {
          stations.value.filter((s) => s.status !== 'operational').forEach((s) => live.push({
            id: `st-${s.station_code}`, icon: Factory, severity: 'warning',
            title: t('notificationsCenter.alert.station', { name: s.name }),
            hint: t(`recyclingPage.status.${s.status}`), link: '/platform/recycling',
          }))
        }
        setAlerts(live)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const unreadCount = useMemo(() => (items ?? []).filter((n) => !n.read).length, [items])

  const readOne = (n: PlatformNotification) => {
    if (n.read) return
    markNotificationRead(n.id)
      .then(() => setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null))
      .catch(() => undefined)
  }

  const readAll = () => {
    setMarking(true)
    markAllNotificationsRead()
      .then(() => setItems((prev) => prev?.map((x) => ({ ...x, read: true })) ?? null))
      .catch(() => undefined)
      .finally(() => setMarking(false))
  }

  return (
    <PlatformPageShell title={`${t('notificationsCenter.title')} — PURE LINE`} description={t('notificationsCenter.subtitle')}>
      <div className="container-px">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">{t('notificationsCenter.eyebrow')}</span>
            <h1 className="mt-4 flex items-center gap-2.5 text-2xl font-black sm:text-3xl">
              <BellRing className="h-7 w-7 text-primary dark:text-secondary" /> {t('notificationsCenter.title')}
            </h1>
            <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('notificationsCenter.subtitle')}</p>
          </div>
          {tab === 'notifications' && unreadCount > 0 && (
            <button onClick={readAll} disabled={marking} className="btn-primary">
              {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              {t('notificationsCenter.markAllRead')}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('notifications')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${tab === 'notifications' ? 'bg-primary text-white' : 'bg-black/5 text-neutral-dark/70 dark:bg-white/10 dark:text-neutral-light/70'}`}
          >
            <Bell className="h-3.5 w-3.5" /> {t('notificationsCenter.tabNotifications')}{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setTab('alerts')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${tab === 'alerts' ? 'bg-primary text-white' : 'bg-black/5 text-neutral-dark/70 dark:bg-white/10 dark:text-neutral-light/70'}`}
          >
            <AlertTriangle className="h-3.5 w-3.5" /> {t('notificationsCenter.tabAlerts')}{alerts ? ` (${alerts.length})` : ''}
          </button>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-24 text-red-500">
              <AlertTriangle className="h-6 w-6" />
              <p className="text-sm">{t('common.error')}</p>
            </div>
          ) : tab === 'notifications' ? (
            (items ?? []).length === 0 ? (
              <div className="py-24 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('notifications.empty')}</div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
                {(items ?? []).map((n) => (
                  <div key={n.id} className={`flex items-start gap-3 border-b border-black/5 px-5 py-4 last:border-0 dark:border-white/5 ${n.read ? 'opacity-55' : ''}`}>
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${kindColors[n.kind] ?? kindColors.info}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        {n.link ? (
                          <Link to={n.link} onClick={() => readOne(n)} className="text-sm font-bold hover:text-primary dark:hover:text-secondary">{n.title}</Link>
                        ) : (
                          <span className="text-sm font-bold">{n.title}</span>
                        )}
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-dark/35 dark:text-neutral-light/35">{n.kind}</span>
                      </div>
                      {n.body && <div className="mt-0.5 text-xs text-neutral-dark/55 dark:text-neutral-light/55">{n.body}</div>}
                      <div className="mt-1 text-[11px] text-neutral-dark/35 dark:text-neutral-light/35">
                        {new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(n.created_at))}
                      </div>
                    </div>
                    {!n.read && (
                      <button type="button" onClick={() => readOne(n)} className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10 dark:text-secondary">
                        {t('notifications.markRead')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            (alerts ?? []).length === 0 ? (
              <div className="py-24 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('notificationsCenter.noAlerts')}</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(alerts ?? []).map((a, i) => {
                  const Icon = a.icon
                  const critical = a.severity === 'critical'
                  return (
                    <Reveal key={a.id} delay={i * 0.02}>
                      <Link
                        to={a.link}
                        className={`flex h-full items-start gap-3 rounded-2xl border p-5 transition ${critical ? 'border-red-500/20 bg-red-500/5 hover:border-red-500/40' : 'border-accent/30 bg-accent/5 hover:border-accent/60'}`}
                      >
                        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${critical ? 'text-red-500' : 'text-accent'}`} />
                        <div className="min-w-0">
                          <div className={`text-sm font-bold ${critical ? 'text-red-500' : 'text-accent'}`}>{a.title}</div>
                          <p className="mt-1 text-xs text-neutral-dark/60 dark:text-neutral-light/60">{a.hint}</p>
                          <span className={`mt-2 flex items-center gap-1 text-xs font-semibold ${critical ? 'text-red-500' : 'text-accent'}`}>
                            {t('notificationsCenter.open')} <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                          </span>
                        </div>
                      </Link>
                    </Reveal>
                  )
                })}
              </div>
            )
          )}
        </div>
      </div>
    </PlatformPageShell>
  )
}
