import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Bug, ShieldAlert, Sprout, Loader2, AlertTriangle, Plus, X, ChevronRight, MapPin, Calendar, ScanLine,
} from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import {
  createPestDetection, createPestTrap, getPestDashboard, listPestDetections, listPestTraps, listPestTypes,
  listRegistryFarms,
} from '../lib/platformApi'
import { PEST_DETECTION_STATUSES, PEST_RISK_LEVELS, pestDetectionStatusStyles, pestRiskDot, pestRiskStyles } from '../lib/pests'
import type {
  CreatePestDetectionPayload, CreatePestTrapPayload, PestDashboard, PestDetection, PestDetectionStatus,
  PestRiskLevel, PestTrap, PestType, RegistryFarm,
} from '../types/platform'

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

function NewDetectionForm({
  farms, pestTypes, onCreated, onClose,
}: { farms: RegistryFarm[]; pestTypes: PestType[]; onCreated: () => void; onClose: () => void }) {
  const { t } = useTranslation()
  const [farmCode, setFarmCode] = useState(farms[0]?.farm_code ?? '')
  const [pestTypeId, setPestTypeId] = useState(pestTypes[0]?.id ?? 0)
  const [riskLevel, setRiskLevel] = useState<PestRiskLevel>('low')
  const [locationNotes, setLocationNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  const submit = async () => {
    if (submitting || !farmCode || !pestTypeId) return
    setSubmitting(true)
    setError(false)
    try {
      const payload: CreatePestDetectionPayload = {
        farm_code: farmCode,
        pest_type_id: Number(pestTypeId),
        risk_level: riskLevel,
        location_notes: locationNotes.trim() || undefined,
      }
      await createPestDetection(payload)
      onCreated()
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">{t('platformPests.newForm.title')}</h3>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select value={farmCode} onChange={(e) => setFarmCode(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {farms.map((f) => <option key={f.farm_code} value={f.farm_code}>{f.name} ({f.farm_code})</option>)}
        </select>
        <select value={pestTypeId} onChange={(e) => setPestTypeId(Number(e.target.value))} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {pestTypes.map((pt) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
        </select>
        <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as PestRiskLevel)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {PEST_RISK_LEVELS.map((r) => <option key={r} value={r}>{t(`platformPests.risk.${r}`)}</option>)}
        </select>
        <textarea
          value={locationNotes}
          onChange={(e) => setLocationNotes(e.target.value)}
          placeholder={t('platformPests.newForm.locationNotes')}
          rows={1}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 sm:col-span-2 lg:col-span-1"
        />
      </div>
      {error && <div className="mt-3 text-xs text-red-500">{t('common.error')}</div>}
      <button onClick={submit} disabled={submitting || !farmCode || !pestTypeId} className="btn-primary mt-4">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('platformPests.newForm.submit')}
      </button>
    </div>
  )
}

function NewTrapForm({
  farms, pestTypes, onCreated, onClose,
}: { farms: RegistryFarm[]; pestTypes: PestType[]; onCreated: () => void; onClose: () => void }) {
  const { t } = useTranslation()
  const [farmCode, setFarmCode] = useState(farms[0]?.farm_code ?? '')
  const [trapCode, setTrapCode] = useState('')
  const [pestTypeId, setPestTypeId] = useState(pestTypes[0]?.id ?? 0)
  const [count, setCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  const submit = async () => {
    if (submitting || !farmCode || !trapCode.trim() || !pestTypeId) return
    setSubmitting(true)
    setError(false)
    try {
      const payload: CreatePestTrapPayload = {
        farm_code: farmCode,
        trap_code: trapCode.trim(),
        pest_type_id: Number(pestTypeId),
        count: Number(count) || 0,
      }
      await createPestTrap(payload)
      onCreated()
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-accent/20 bg-accent/5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">{t('platformPests.trapForm.title')}</h3>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select value={farmCode} onChange={(e) => setFarmCode(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {farms.map((f) => <option key={f.farm_code} value={f.farm_code}>{f.name} ({f.farm_code})</option>)}
        </select>
        <input
          value={trapCode}
          onChange={(e) => setTrapCode(e.target.value)}
          placeholder={t('platformPests.trapForm.trapCode')}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <select value={pestTypeId} onChange={(e) => setPestTypeId(Number(e.target.value))} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {pestTypes.map((pt) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
        </select>
        <input
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          type="number"
          min={0}
          placeholder={t('platformPests.trapForm.count')}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
      </div>
      {error && <div className="mt-3 text-xs text-red-500">{t('common.error')}</div>}
      <button onClick={submit} disabled={submitting || !farmCode || !trapCode.trim()} className="btn-primary mt-4">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('platformPests.trapForm.submit')}
      </button>
    </div>
  )
}

export default function PestManagementPage() {
  const { t, i18n } = useTranslation()
  const { user } = usePlatformAuth()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const canManage = user?.role === 'admin' || user?.role === 'staff'

  const [dash, setDash] = useState<PestDashboard | null>(null)
  const [detections, setDetections] = useState<PestDetection[] | null>(null)
  const [traps, setTraps] = useState<PestTrap[] | null>(null)
  const [farms, setFarms] = useState<RegistryFarm[] | null>(null)
  const [pestTypes, setPestTypes] = useState<PestType[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const [showDetectionForm, setShowDetectionForm] = useState(false)
  const [showTrapForm, setShowTrapForm] = useState(false)

  const [farmFilter, setFarmFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState<PestRiskLevel | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<PestDetectionStatus | 'all'>('all')

  const loadAll = () => {
    setLoading(true)
    setError(false)
    Promise.all([
      getPestDashboard(),
      listPestDetections(),
      listPestTraps(),
      listRegistryFarms(),
      listPestTypes(),
    ])
      .then(([d, dets, tr, f, pt]) => {
        setDash(d)
        setDetections(dets)
        setTraps(tr)
        setFarms(f)
        setPestTypes(pt)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(loadAll, [])

  const reloadDetections = () => {
    listPestDetections({
      farm_code: farmFilter !== 'all' ? farmFilter : undefined,
      risk_level: riskFilter !== 'all' ? riskFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }).then(setDetections).catch(() => setError(true))
  }

  useEffect(() => {
    if (detections === null) return
    reloadDetections()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmFilter, riskFilter, statusFilter])

  const farmName = (code: string) => farms?.find((f) => f.farm_code === code)?.name ?? code
  const pestTypeName = (id: number) => pestTypes?.find((pt) => pt.id === id)?.name ?? `#${id}`

  const trendMax = useMemo(() => Math.max(1, ...(dash?.monthly_trend ?? []).map((m) => m.count)), [dash])

  if (loading) {
    return (
      <PlatformPageShell title={`${t('platformPests.title')} — PURE LINE`}>
        <div className="container-px"><CenterLoader /></div>
      </PlatformPageShell>
    )
  }

  if (error && !dash) {
    return (
      <PlatformPageShell title={`${t('platformPests.title')} — PURE LINE`}>
        <div className="container-px"><CenterError /></div>
      </PlatformPageShell>
    )
  }

  const kpis = [
    { key: 'activeInfestations', value: dash?.active_infestations ?? 0, icon: Bug },
    { key: 'highRiskFarms', value: dash?.high_risk_farms ?? 0, icon: ShieldAlert },
    { key: 'treatmentInProgress', value: dash?.treatment_in_progress ?? 0, icon: Sprout },
  ] as const

  return (
    <PlatformPageShell title={`${t('platformPests.title')} — PURE LINE`} description={t('platformPests.subtitle')}>
      <div className="container-px">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">{t('platformPests.eyebrow')}</span>
            <h1 className="mt-4 text-2xl font-black sm:text-3xl">{t('platformPests.title')}</h1>
            <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('platformPests.subtitle')}</p>
          </div>
        </div>

        {/* KPI cards + trend */}
        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-1">
            {kpis.map(({ key, value, icon: Icon }, i) => (
              <Reveal key={key} delay={i * 0.03}>
                <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <Icon className="h-5 w-5 text-primary dark:text-secondary" />
                  <div className="mt-3 text-2xl font-black">{value}</div>
                  <div className="mt-1 text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">
                    {t(`platformPests.kpi.${key}`)}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.05} className="lg:col-span-3">
            <div className="h-full rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">
                <ScanLine className="h-4 w-4" /> {t('platformPests.trendTitle')}
              </h2>
              {!dash || dash.monthly_trend.length === 0 ? (
                <p className="mt-6 text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformPests.noTrend')}</p>
              ) : (
                <div className="mt-6 flex h-40 items-end gap-3">
                  {dash.monthly_trend.map((m) => (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-xs font-bold text-neutral-dark/70 dark:text-neutral-light/70">{m.count}</span>
                      <div className="flex h-28 w-full items-end overflow-hidden rounded-lg bg-black/5 dark:bg-white/10">
                        <div
                          className="w-full rounded-lg bg-gradient-to-t from-primary to-secondary transition-all"
                          style={{ height: `${Math.max(4, Math.round((m.count / trendMax) * 100))}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-dark/40 dark:text-neutral-light/40">{m.month}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {/* Detections */}
        <div className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold">{t('platformPests.detectionsSection')}</h2>
            {canManage && farms && pestTypes && (
              <button onClick={() => setShowDetectionForm((v) => !v)} className="btn-primary">
                <Plus className="h-4 w-4" /> {t('platformPests.newDetection')}
              </button>
            )}
          </div>

          {canManage && showDetectionForm && farms && pestTypes && (
            <div className="mt-6">
              <NewDetectionForm
                farms={farms}
                pestTypes={pestTypes}
                onCreated={() => { setShowDetectionForm(false); reloadDetections(); loadAll() }}
                onClose={() => setShowDetectionForm(false)}
              />
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <select value={farmFilter} onChange={(e) => setFarmFilter(e.target.value)} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5">
              <option value="all">{t('platformPests.allFarms')}</option>
              {(farms ?? []).map((f) => <option key={f.farm_code} value={f.farm_code}>{f.name}</option>)}
            </select>
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as PestRiskLevel | 'all')} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5">
              <option value="all">{t('platformPests.allRiskLevels')}</option>
              {PEST_RISK_LEVELS.map((r) => <option key={r} value={r}>{t(`platformPests.risk.${r}`)}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PestDetectionStatus | 'all')} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5">
              <option value="all">{t('platformPests.allStatuses')}</option>
              {PEST_DETECTION_STATUSES.map((s) => <option key={s} value={s}>{t(`platformPests.status.${s}`)}</option>)}
            </select>
          </div>

          <div className="mt-6">
            {!detections ? (
              <CenterLoader />
            ) : detections.length === 0 ? (
              <div className="py-16 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformPests.empty')}</div>
            ) : (
              <div className="space-y-3">
                {detections.map((d, i) => (
                  <Reveal key={d.detection_id} delay={Math.min(i * 0.02, 0.3)}>
                    <Link
                      to={`/platform/pests/${d.detection_id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] text-neutral-dark/40 dark:text-neutral-light/40">{d.detection_id}</span>
                          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pestRiskStyles[d.risk_level]}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${pestRiskDot[d.risk_level]}`} />
                            {t(`platformPests.risk.${d.risk_level}`)}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pestDetectionStatusStyles[d.status]}`}>
                            {t(`platformPests.status.${d.status}`)}
                          </span>
                        </div>
                        <h3 className="mt-1.5 font-bold">{pestTypeName(d.pest_type_id)} · {farmName(d.farm_code)}</h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-neutral-dark/50 dark:text-neutral-light/50">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d.detected_date))}
                          </span>
                          {d.location_notes && (
                            <span className="flex items-center gap-1.5 truncate">
                              <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{d.location_notes}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-neutral-dark/30 rtl:rotate-180 dark:text-neutral-light/30" />
                    </Link>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trap monitoring */}
        <div className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold">{t('platformPests.trapsSection')}</h2>
            {canManage && farms && pestTypes && (
              <button onClick={() => setShowTrapForm((v) => !v)} className="btn-ghost">
                <Plus className="h-4 w-4" /> {t('platformPests.newTrapRecord')}
              </button>
            )}
          </div>

          {canManage && showTrapForm && farms && pestTypes && (
            <div className="mt-6">
              <NewTrapForm
                farms={farms}
                pestTypes={pestTypes}
                onCreated={() => { setShowTrapForm(false); loadAll() }}
                onClose={() => setShowTrapForm(false)}
              />
            </div>
          )}

          <div className="mt-6">
            {!traps || traps.length === 0 ? (
              <div className="py-12 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformPests.noTraps')}</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {traps.map((tr, i) => (
                  <Reveal key={tr.id} delay={Math.min(i * 0.02, 0.3)}>
                    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-neutral-dark/40 dark:text-neutral-light/40">{tr.trap_code}</span>
                        <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                          {t('platformPests.trapCount', { count: tr.count })}
                        </span>
                      </div>
                      <h3 className="mt-1.5 truncate text-sm font-bold">{pestTypeName(tr.pest_type_id)} · {farmName(tr.farm_code)}</h3>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-dark/50 dark:text-neutral-light/50">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(tr.checked_date))}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PlatformPageShell>
  )
}
