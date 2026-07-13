import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Crosshair, Loader2, AlertTriangle, Plus, X, Bug, Activity, ClipboardCheck, Download } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import LazyFarmGisMap from '../components/gis/LazyFarmGisMap'
import type { GisMarker } from '../components/gis/FarmGisMap'
import { getGisFarms } from '../lib/gisData'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import {
  createTrap, getTrapsDashboard, listPestTypes, listRegistryFarms, listTraps, updateTrap,
  PlatformApiError,
} from '../lib/platformApi'
import { exportRowsAsCsv } from '../lib/exportCsv'
import type {
  CreateTrapPayload, PestType, RegistryFarm, Trap, TrapStatus, TrapsDashboard,
} from '../types/platform'

const TRAP_STATUSES: TrapStatus[] = ['active', 'needs_service', 'damaged', 'removed']

const statusStyles: Record<TrapStatus, string> = {
  active: 'bg-secondary/15 text-primary dark:text-secondary',
  needs_service: 'bg-accent/15 text-accent',
  damaged: 'bg-red-500/15 text-red-500',
  removed: 'bg-black/5 text-neutral-dark/50 dark:bg-white/10 dark:text-neutral-light/50',
}

const EMPTY_FORM: CreateTrapPayload = { trap_code: '', farm_code: '', pest_type_id: 0 }

export default function TrapsManagementPage() {
  const { t, i18n } = useTranslation()
  const { user } = usePlatformAuth()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const canManage = user?.role === 'admin' || user?.role === 'staff'

  const [dash, setDash] = useState<TrapsDashboard | null>(null)
  const [traps, setTraps] = useState<Trap[] | null>(null)
  const [pestTypes, setPestTypes] = useState<PestType[]>([])
  const [farms, setFarms] = useState<RegistryFarm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | TrapStatus>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateTrapPayload>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyCode, setBusyCode] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(false)
    Promise.all([getTrapsDashboard(), listTraps(), listPestTypes(), listRegistryFarms()])
      .then(([d, tr, pt, f]) => {
        setDash(d)
        setTraps(tr)
        setPestTypes(pt)
        setFarms(f)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const pestName = useMemo(() => {
    const map = new Map<number, string>()
    pestTypes.forEach((p) => map.set(p.id, p.name))
    return (id: number) => map.get(id) ?? `#${id}`
  }, [pestTypes])

  const filtered = useMemo(
    () => (traps ?? []).filter((tr) => statusFilter === 'all' || tr.status === statusFilter),
    [traps, statusFilter],
  )

  const markers = useMemo<GisMarker[]>(
    () => (traps ?? [])
      .filter((tr) => tr.lat != null && tr.lng != null && tr.status !== 'removed')
      .map((tr) => ({
        id: tr.trap_code,
        position: [tr.lat as number, tr.lng as number],
        kind: 'trap' as const,
        label: tr.trap_code,
        sublabel: `${pestName(tr.pest_type_id)} · ${t(`trapsPage.status.${tr.status}`)}`,
      })),
    [traps, pestName, t],
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.pest_type_id) {
      setFormError(t('trapsPage.pickPest'))
      return
    }
    setSaving(true)
    setFormError(null)
    createTrap(form)
      .then(() => {
        setShowForm(false)
        setForm(EMPTY_FORM)
        load()
      })
      .catch((err) => setFormError(err instanceof PlatformApiError ? err.message : 'error'))
      .finally(() => setSaving(false))
  }

  const changeStatus = (tr: Trap, status: TrapStatus) => {
    setBusyCode(tr.trap_code)
    updateTrap(tr.trap_code, { status })
      .then(load)
      .catch(() => undefined)
      .finally(() => setBusyCode(null))
  }

  const inputCls = 'w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5'

  if (loading) {
    return (
      <PlatformPageShell title={`${t('trapsPage.title')} — PURE LINE`}>
        <div className="container-px"><div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>
      </PlatformPageShell>
    )
  }

  if (error) {
    return (
      <PlatformPageShell title={`${t('trapsPage.title')} — PURE LINE`}>
        <div className="container-px">
          <div className="flex flex-col items-center gap-2 py-24 text-red-500">
            <AlertTriangle className="h-6 w-6" />
            <p className="text-sm">{t('common.error')}</p>
          </div>
        </div>
      </PlatformPageShell>
    )
  }

  return (
    <PlatformPageShell title={`${t('trapsPage.title')} — PURE LINE`} description={t('trapsPage.subtitle')}>
      <div className="container-px">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">{t('trapsPage.eyebrow')}</span>
            <h1 className="mt-4 flex items-center gap-2.5 text-2xl font-black sm:text-3xl">
              <Crosshair className="h-7 w-7 text-primary dark:text-secondary" /> {t('trapsPage.title')}
            </h1>
            <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('trapsPage.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => exportRowsAsCsv('pureline-traps', ['trap_code', 'farm', 'pest', 'status', 'lat', 'lng', 'last_checked', 'last_count'],
                filtered.map((tr) => [tr.trap_code, tr.farm_code, pestName(tr.pest_type_id), tr.status, tr.lat, tr.lng, tr.last_checked, tr.last_count]))}
              className="btn-ghost"
            >
              <Download className="h-4 w-4" /> {t('common.export')}
            </button>
            {canManage && (
              <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
                {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showForm ? t('common.cancel') : t('trapsPage.newTrap')}
              </button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {([
            ['total', dash?.total_traps ?? 0, Crosshair],
            ['active', dash?.by_status?.active ?? 0, Activity],
            ['checksWeek', dash?.checks_this_week ?? 0, ClipboardCheck],
            ['catchWeek', dash?.catch_this_week ?? 0, Bug],
          ] as const).map(([k, v, Icon], i) => (
            <Reveal key={k} delay={i * 0.03}>
              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <Icon className="h-5 w-5 text-primary dark:text-secondary" />
                <div className="mt-3 text-2xl font-black">{v}</div>
                <div className="mt-1 text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">{t(`trapsPage.kpi.${k}`)}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Create form */}
        {showForm && canManage && (
          <Reveal>
            <form onSubmit={submit} className="mt-8 rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">{t('trapsPage.newTrap')}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <input required value={form.trap_code} onChange={(e) => setForm({ ...form, trap_code: e.target.value })} placeholder={t('trapsPage.fields.code')} className={inputCls} />
                <select required value={form.farm_code} onChange={(e) => setForm({ ...form, farm_code: e.target.value })} className={inputCls}>
                  <option value="">{t('trapsPage.fields.farm')}</option>
                  {farms.map((f) => <option key={f.farm_code} value={f.farm_code}>{f.name}</option>)}
                </select>
                <select required value={form.pest_type_id || ''} onChange={(e) => setForm({ ...form, pest_type_id: Number(e.target.value) })} className={inputCls}>
                  <option value="">{t('trapsPage.fields.pestType')}</option>
                  {pestTypes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" step="any" value={form.lat ?? ''} onChange={(e) => setForm({ ...form, lat: e.target.value ? Number(e.target.value) : undefined })} placeholder={t('trapsPage.fields.lat')} className={inputCls} />
                <input type="number" step="any" value={form.lng ?? ''} onChange={(e) => setForm({ ...form, lng: e.target.value ? Number(e.target.value) : undefined })} placeholder={t('trapsPage.fields.lng')} className={inputCls} />
                <input value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value || undefined })} placeholder={t('trapsPage.fields.notes')} className={inputCls} />
              </div>
              {formError && <p className="mt-3 text-sm text-red-500">{formError}</p>}
              <button type="submit" disabled={saving} className="btn-primary mt-5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('trapsPage.create')}
              </button>
            </form>
          </Reveal>
        )}

        {/* GIS map with trap markers */}
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-bold">{t('trapsPage.mapTitle')}</h2>
          <LazyFarmGisMap farms={getGisFarms()} markers={markers} height="420px" />
        </div>

        {/* Filter + table */}
        <div className="mt-12 flex flex-wrap gap-2">
          {(['all', ...TRAP_STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${statusFilter === s ? 'bg-primary text-white' : 'bg-black/5 text-neutral-dark/70 dark:bg-white/10 dark:text-neutral-light/70'}`}
            >
              {s === 'all' ? t('trapsPage.allStatuses') : t(`trapsPage.status.${s}`)}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('trapsPage.empty')}</div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-neutral-dark/40 dark:border-white/10 dark:text-neutral-light/40">
                    <th className="px-5 py-4 text-start">{t('trapsPage.columns.trap')}</th>
                    <th className="px-5 py-4 text-start">{t('trapsPage.columns.farm')}</th>
                    <th className="px-5 py-4 text-start">{t('trapsPage.columns.pest')}</th>
                    <th className="px-5 py-4 text-start">{t('trapsPage.columns.lastCheck')}</th>
                    <th className="px-5 py-4 text-start">{t('trapsPage.columns.installed')}</th>
                    <th className="px-5 py-4 text-start">{t('trapsPage.columns.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tr) => (
                    <tr key={tr.trap_code} className="border-b border-black/5 last:border-0 dark:border-white/5">
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-bold">{tr.trap_code}</div>
                        {tr.notes && <div className="mt-0.5 text-[11px] text-neutral-dark/40 dark:text-neutral-light/40">{tr.notes}</div>}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs">{tr.farm_code}</td>
                      <td className="px-5 py-4 text-xs">{pestName(tr.pest_type_id)}</td>
                      <td className="px-5 py-4 text-xs text-neutral-dark/60 dark:text-neutral-light/60">
                        {tr.last_checked
                          ? `${new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric' }).format(new Date(tr.last_checked))} · ${t('trapsPage.count', { count: tr.last_count ?? 0 })}`
                          : t('trapsPage.neverChecked')}
                      </td>
                      <td className="px-5 py-4 text-xs text-neutral-dark/60 dark:text-neutral-light/60">
                        {new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(tr.installed_date))}
                      </td>
                      <td className="px-5 py-4">
                        {canManage ? (
                          <select
                            value={tr.status}
                            disabled={busyCode === tr.trap_code}
                            onChange={(e) => changeStatus(tr, e.target.value as TrapStatus)}
                            className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
                          >
                            {TRAP_STATUSES.map((s) => <option key={s} value={s}>{t(`trapsPage.status.${s}`)}</option>)}
                          </select>
                        ) : (
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[tr.status]}`}>{t(`trapsPage.status.${tr.status}`)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PlatformPageShell>
  )
}
