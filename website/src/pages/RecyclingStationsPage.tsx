import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Recycle, Loader2, AlertTriangle, Plus, X, MapPin, Scale, Factory, PackagePlus } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import LazyFarmGisMap from '../components/gis/LazyFarmGisMap'
import type { GisMarker } from '../components/gis/FarmGisMap'
import { getGisFarms } from '../lib/gisData'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import {
  createRecyclingIntake, createRecyclingStation, getRecyclingDashboard,
  listRecyclingStations, listRegistryFarms, updateRecyclingStation, PlatformApiError,
} from '../lib/platformApi'
import type {
  CreateRecyclingStationPayload, RecyclingDashboard, RecyclingStation, RegistryFarm, StationStatus,
} from '../types/platform'

const STATION_STATUSES: StationStatus[] = ['operational', 'maintenance', 'closed']
const MATERIALS = ['palm_fronds', 'green_waste', 'compost_feedstock', 'plastic_mulch', 'irrigation_pipe', 'other']

const statusStyles: Record<StationStatus, string> = {
  operational: 'bg-secondary/15 text-primary dark:text-secondary',
  maintenance: 'bg-accent/15 text-accent',
  closed: 'bg-red-500/15 text-red-500',
}

const EMPTY_FORM: CreateRecyclingStationPayload = { station_code: '', name: '' }

export default function RecyclingStationsPage() {
  const { t, i18n } = useTranslation()
  const { user } = usePlatformAuth()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const canManage = user?.role === 'admin' || user?.role === 'staff'

  const [dash, setDash] = useState<RecyclingDashboard | null>(null)
  const [stations, setStations] = useState<RecyclingStation[] | null>(null)
  const [farms, setFarms] = useState<RegistryFarm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateRecyclingStationPayload>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [intakeFor, setIntakeFor] = useState<number | null>(null)
  const [intakeMaterial, setIntakeMaterial] = useState(MATERIALS[0])
  const [intakeKg, setIntakeKg] = useState('')
  const [intakeFarm, setIntakeFarm] = useState('')

  const load = () => {
    setLoading(true)
    setError(false)
    Promise.all([getRecyclingDashboard(), listRecyclingStations(), listRegistryFarms()])
      .then(([d, s, f]) => {
        setDash(d)
        setStations(s)
        setFarms(f)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const markers = useMemo<GisMarker[]>(
    () => (stations ?? [])
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => ({
        id: s.station_code,
        position: [s.lat as number, s.lng as number],
        kind: 'station' as const,
        label: lang === 'ar' && s.name_ar ? s.name_ar : s.name,
        sublabel: `${t(`recyclingPage.status.${s.status}`)} · ${Math.round(s.intake_month_kg)} kg / ${t('recyclingPage.month')}`,
      })),
    [stations, lang, t],
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    createRecyclingStation(form)
      .then(() => {
        setShowForm(false)
        setForm(EMPTY_FORM)
        load()
      })
      .catch((err) => setFormError(err instanceof PlatformApiError ? err.message : 'error'))
      .finally(() => setSaving(false))
  }

  const changeStatus = (s: RecyclingStation, status: StationStatus) => {
    setBusyId(s.id)
    updateRecyclingStation(s.id, { status })
      .then(load)
      .catch(() => undefined)
      .finally(() => setBusyId(null))
  }

  const logIntake = (s: RecyclingStation) => {
    const kg = Number(intakeKg)
    if (!kg || kg <= 0) return
    setBusyId(s.id)
    createRecyclingIntake(s.id, { material: intakeMaterial, quantity_kg: kg, source_farm_code: intakeFarm || undefined })
      .then(() => {
        setIntakeFor(null)
        setIntakeKg('')
        setIntakeFarm('')
        load()
      })
      .catch(() => undefined)
      .finally(() => setBusyId(null))
  }

  const inputCls = 'w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5'

  if (loading) {
    return (
      <PlatformPageShell title={`${t('recyclingPage.title')} — PURE LINE`}>
        <div className="container-px"><div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>
      </PlatformPageShell>
    )
  }

  if (error) {
    return (
      <PlatformPageShell title={`${t('recyclingPage.title')} — PURE LINE`}>
        <div className="container-px">
          <div className="flex flex-col items-center gap-2 py-24 text-red-500">
            <AlertTriangle className="h-6 w-6" />
            <p className="text-sm">{t('common.error')}</p>
          </div>
        </div>
      </PlatformPageShell>
    )
  }

  const materialsEntries = Object.entries(dash?.intake_by_material_kg ?? {}).sort((a, b) => b[1] - a[1])

  return (
    <PlatformPageShell title={`${t('recyclingPage.title')} — PURE LINE`} description={t('recyclingPage.subtitle')}>
      <div className="container-px">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">{t('recyclingPage.eyebrow')}</span>
            <h1 className="mt-4 flex items-center gap-2.5 text-2xl font-black sm:text-3xl">
              <Recycle className="h-7 w-7 text-primary dark:text-secondary" /> {t('recyclingPage.title')}
            </h1>
            <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('recyclingPage.subtitle')}</p>
          </div>
          {canManage && (
            <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? t('common.cancel') : t('recyclingPage.newStation')}
            </button>
          )}
        </div>

        {/* KPIs */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {([
            ['stations', dash?.total_stations ?? 0, Factory],
            ['operational', dash?.by_status?.operational ?? 0, Recycle],
            ['monthKg', Math.round(dash?.intake_month_kg ?? 0).toLocaleString(lang), Scale],
            ['materials', materialsEntries.length, PackagePlus],
          ] as const).map(([k, v, Icon], i) => (
            <Reveal key={k} delay={i * 0.03}>
              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <Icon className="h-5 w-5 text-primary dark:text-secondary" />
                <div className="mt-3 text-2xl font-black">{v}</div>
                <div className="mt-1 text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">{t(`recyclingPage.kpi.${k}`)}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Intake by material */}
        {materialsEntries.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {materialsEntries.map(([m, kg]) => (
              <span key={m} className="rounded-full bg-black/5 px-3 py-1.5 text-[11px] font-semibold text-neutral-dark/70 dark:bg-white/10 dark:text-neutral-light/70">
                {t(`recyclingPage.materials.${m}`, m)} · {Math.round(kg).toLocaleString(lang)} kg
              </span>
            ))}
          </div>
        )}

        {/* Create form */}
        {showForm && canManage && (
          <Reveal>
            <form onSubmit={submit} className="mt-8 rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">{t('recyclingPage.newStation')}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <input required value={form.station_code} onChange={(e) => setForm({ ...form, station_code: e.target.value })} placeholder={t('recyclingPage.fields.code')} className={inputCls} />
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('recyclingPage.fields.name')} className={inputCls} />
                <input value={form.region ?? ''} onChange={(e) => setForm({ ...form, region: e.target.value || undefined })} placeholder={t('recyclingPage.fields.region')} className={inputCls} />
                <input type="number" step="any" value={form.lat ?? ''} onChange={(e) => setForm({ ...form, lat: e.target.value ? Number(e.target.value) : undefined })} placeholder={t('trapsPage.fields.lat')} className={inputCls} />
                <input type="number" step="any" value={form.lng ?? ''} onChange={(e) => setForm({ ...form, lng: e.target.value ? Number(e.target.value) : undefined })} placeholder={t('trapsPage.fields.lng')} className={inputCls} />
                <input type="number" step="any" value={form.capacity_tons_month ?? ''} onChange={(e) => setForm({ ...form, capacity_tons_month: e.target.value ? Number(e.target.value) : undefined })} placeholder={t('recyclingPage.fields.capacity')} className={inputCls} />
              </div>
              {formError && <p className="mt-3 text-sm text-red-500">{formError}</p>}
              <button type="submit" disabled={saving} className="btn-primary mt-5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('recyclingPage.create')}
              </button>
            </form>
          </Reveal>
        )}

        {/* Map */}
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-bold">{t('recyclingPage.mapTitle')}</h2>
          <LazyFarmGisMap farms={getGisFarms()} markers={markers} height="400px" />
        </div>

        {/* Station cards */}
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {(stations ?? []).map((s, i) => (
            <Reveal key={s.id} delay={i * 0.04}>
              <div className="flex h-full flex-col rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] text-neutral-dark/40 dark:text-neutral-light/40">{s.station_code}</div>
                    <h3 className="mt-1 font-bold">{lang === 'ar' && s.name_ar ? s.name_ar : s.name}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-dark/50 dark:text-neutral-light/50">
                      <MapPin className="h-3.5 w-3.5" /> {s.region ?? '—'}
                    </div>
                  </div>
                  {canManage ? (
                    <select
                      value={s.status}
                      disabled={busyId === s.id}
                      onChange={(e) => changeStatus(s, e.target.value as StationStatus)}
                      className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
                    >
                      {STATION_STATUSES.map((st) => <option key={st} value={st}>{t(`recyclingPage.status.${st}`)}</option>)}
                    </select>
                  ) : (
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[s.status]}`}>{t(`recyclingPage.status.${s.status}`)}</span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-black/5 p-3 dark:bg-white/5">
                    <div className="text-sm font-black">{Math.round(s.intake_month_kg).toLocaleString(lang)}</div>
                    <div className="mt-0.5 text-[10px] text-neutral-dark/50 dark:text-neutral-light/50">{t('recyclingPage.card.monthKg')}</div>
                  </div>
                  <div className="rounded-xl bg-black/5 p-3 dark:bg-white/5">
                    <div className="text-sm font-black">{Math.round(s.intake_total_kg).toLocaleString(lang)}</div>
                    <div className="mt-0.5 text-[10px] text-neutral-dark/50 dark:text-neutral-light/50">{t('recyclingPage.card.totalKg')}</div>
                  </div>
                  <div className="rounded-xl bg-black/5 p-3 dark:bg-white/5">
                    <div className="text-sm font-black">{s.capacity_tons_month ?? '—'}</div>
                    <div className="mt-0.5 text-[10px] text-neutral-dark/50 dark:text-neutral-light/50">{t('recyclingPage.card.capacity')}</div>
                  </div>
                </div>

                {s.accepted_materials.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {s.accepted_materials.map((m) => (
                      <span key={m} className="rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-semibold text-primary dark:text-secondary">
                        {t(`recyclingPage.materials.${m}`, m)}
                      </span>
                    ))}
                  </div>
                )}

                {canManage && (
                  <div className="mt-auto pt-5">
                    {intakeFor === s.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <select value={intakeMaterial} onChange={(e) => setIntakeMaterial(e.target.value)} className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs outline-none dark:border-white/10 dark:bg-white/5">
                          {MATERIALS.map((m) => <option key={m} value={m}>{t(`recyclingPage.materials.${m}`, m)}</option>)}
                        </select>
                        <input type="number" min="1" value={intakeKg} onChange={(e) => setIntakeKg(e.target.value)} placeholder="kg" className="w-20 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs outline-none dark:border-white/10 dark:bg-white/5" />
                        <select value={intakeFarm} onChange={(e) => setIntakeFarm(e.target.value)} className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs outline-none dark:border-white/10 dark:bg-white/5">
                          <option value="">{t('recyclingPage.noSourceFarm')}</option>
                          {farms.map((f) => <option key={f.farm_code} value={f.farm_code}>{f.farm_code}</option>)}
                        </select>
                        <button type="button" disabled={busyId === s.id || !Number(intakeKg)} onClick={() => logIntake(s)} className="btn-primary !px-3 !py-1.5 text-xs">
                          {t('recyclingPage.saveIntake')}
                        </button>
                        <button type="button" onClick={() => setIntakeFor(null)} className="rounded-lg p-1.5 text-neutral-dark/40 hover:bg-black/5 dark:text-neutral-light/40">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setIntakeFor(s.id)} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline dark:text-secondary">
                        <PackagePlus className="h-4 w-4" /> {t('recyclingPage.logIntake')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </PlatformPageShell>
  )
}
