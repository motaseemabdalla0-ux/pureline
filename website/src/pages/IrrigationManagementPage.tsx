import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Droplets, CalendarClock, Gauge, Loader2, AlertTriangle, Plus, X, Pencil, Check, MapPin, Ruler, Waves,
} from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import LazyFarmGisMap from '../components/gis/LazyFarmGisMap'
import WeatherWidget from '../components/gis/WeatherWidget'
import { getGisFarms } from '../lib/gisData'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import {
  createIrrigationEvent, createIrrigationZone, getIrrigationDashboard, listIrrigationEvents, listIrrigationZones,
  listRegistryFarms, updateIrrigationEvent,
} from '../lib/platformApi'
import {
  IRRIGATION_EQUIPMENT_TYPES, IRRIGATION_EVENT_STATUSES, IRRIGATION_ZONE_STATUSES,
  irrigationEventStatusDot, irrigationEventStatusStyles, irrigationZoneStatusDot, irrigationZoneStatusStyles,
} from '../lib/irrigation'
import type {
  CreateIrrigationEventPayload, CreateIrrigationZonePayload, IrrigationDashboard, IrrigationEquipment,
  IrrigationEvent, IrrigationEventStatus, IrrigationZone, RegistryFarm,
  UpdateIrrigationEventPayload,
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

function NewZoneForm({
  farms, onCreated, onClose,
}: { farms: RegistryFarm[]; onCreated: () => void; onClose: () => void }) {
  const { t } = useTranslation()
  const [farmCode, setFarmCode] = useState(farms[0]?.farm_code ?? '')
  const [zoneName, setZoneName] = useState('')
  const [areaHectares, setAreaHectares] = useState('')
  const [equipmentType, setEquipmentType] = useState<IrrigationEquipment>('drip')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  const submit = async () => {
    if (submitting || !farmCode || !zoneName.trim() || !areaHectares) return
    setSubmitting(true)
    setError(false)
    try {
      const payload: CreateIrrigationZonePayload = {
        farm_code: farmCode,
        zone_name: zoneName.trim(),
        area_hectares: Number(areaHectares),
        equipment_type: equipmentType,
      }
      await createIrrigationZone(payload)
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
        <h3 className="text-sm font-bold">{t('platformIrrigation.newZoneForm.title')}</h3>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select value={farmCode} onChange={(e) => setFarmCode(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {farms.map((f) => <option key={f.farm_code} value={f.farm_code}>{f.name} ({f.farm_code})</option>)}
        </select>
        <input
          value={zoneName}
          onChange={(e) => setZoneName(e.target.value)}
          placeholder={t('platformIrrigation.newZoneForm.zoneName')}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={areaHectares}
          onChange={(e) => setAreaHectares(e.target.value)}
          type="number"
          min={0}
          step="0.01"
          placeholder={t('platformIrrigation.newZoneForm.area')}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <select value={equipmentType} onChange={(e) => setEquipmentType(e.target.value as IrrigationEquipment)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {IRRIGATION_EQUIPMENT_TYPES.map((eq) => <option key={eq} value={eq}>{t(`platformIrrigation.equipment.${eq}`)}</option>)}
        </select>
      </div>
      {error && <div className="mt-3 text-xs text-red-500">{t('common.error')}</div>}
      <button onClick={submit} disabled={submitting || !farmCode || !zoneName.trim() || !areaHectares} className="btn-primary mt-4">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('platformIrrigation.newZoneForm.submit')}
      </button>
    </div>
  )
}

function NewEventForm({
  zones, username, onCreated, onClose,
}: { zones: IrrigationZone[]; username: string; onCreated: () => void; onClose: () => void }) {
  const { t } = useTranslation()
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? '')
  const [scheduledStart, setScheduledStart] = useState('')
  const [scheduledEnd, setScheduledEnd] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  const submit = async () => {
    if (submitting || !zoneId || !scheduledStart || !scheduledEnd) return
    setSubmitting(true)
    setError(false)
    try {
      const payload: CreateIrrigationEventPayload = {
        zone_id: zoneId,
        scheduled_start: new Date(scheduledStart).toISOString(),
        scheduled_end: new Date(scheduledEnd).toISOString(),
        created_by: username,
      }
      await createIrrigationEvent(payload)
      onCreated()
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-accent/20 bg-accent/5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">{t('platformIrrigation.newEventForm.title')}</h3>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {zones.map((z) => <option key={z.id} value={z.id}>{z.zone_name} · {z.farm_code}</option>)}
        </select>
        <input
          value={scheduledStart}
          onChange={(e) => setScheduledStart(e.target.value)}
          type="datetime-local"
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={scheduledEnd}
          onChange={(e) => setScheduledEnd(e.target.value)}
          type="datetime-local"
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
      </div>
      {error && <div className="mt-3 text-xs text-red-500">{t('common.error')}</div>}
      <button onClick={submit} disabled={submitting || !zoneId || !scheduledStart || !scheduledEnd} className="btn-primary mt-4">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('platformIrrigation.newEventForm.submit')}
      </button>
    </div>
  )
}

function EventEditRow({ event, onSaved, onCancel }: { event: IrrigationEvent; onSaved: () => void; onCancel: () => void }) {
  const { t } = useTranslation()
  const toLocalInput = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 16) : '')
  const [actualStart, setActualStart] = useState(toLocalInput(event.actual_start))
  const [actualEnd, setActualEnd] = useState(toLocalInput(event.actual_end))
  const [waterVolume, setWaterVolume] = useState(event.water_volume_m3 != null ? String(event.water_volume_m3) : '')
  const [status, setStatus] = useState<IrrigationEventStatus>(event.status)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  const submit = async () => {
    if (submitting) return
    setSubmitting(true)
    setError(false)
    try {
      const payload: UpdateIrrigationEventPayload = {
        status,
        actual_start: actualStart ? new Date(actualStart).toISOString() : undefined,
        actual_end: actualEnd ? new Date(actualEnd).toISOString() : undefined,
        water_volume_m3: waterVolume ? Number(waterVolume) : undefined,
      }
      await updateIrrigationEvent(event.id, payload)
      onSaved()
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select value={status} onChange={(e) => setStatus(e.target.value as IrrigationEventStatus)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {IRRIGATION_EVENT_STATUSES.map((s) => <option key={s} value={s}>{t(`platformIrrigation.eventStatus.${s}`)}</option>)}
        </select>
        <input
          value={actualStart}
          onChange={(e) => setActualStart(e.target.value)}
          type="datetime-local"
          placeholder={t('platformIrrigation.editForm.actualStart')}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={actualEnd}
          onChange={(e) => setActualEnd(e.target.value)}
          type="datetime-local"
          placeholder={t('platformIrrigation.editForm.actualEnd')}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={waterVolume}
          onChange={(e) => setWaterVolume(e.target.value)}
          type="number"
          min={0}
          step="0.1"
          placeholder={t('platformIrrigation.editForm.waterVolume')}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
      </div>
      {error && <div className="mt-3 text-xs text-red-500">{t('common.error')}</div>}
      <div className="mt-4 flex items-center gap-2">
        <button onClick={submit} disabled={submitting} className="btn-primary !py-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> {t('platformIrrigation.editForm.save')}</>}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost !py-2">
          <X className="h-4 w-4" /> {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}

export default function IrrigationManagementPage() {
  const { t, i18n } = useTranslation()
  const { user } = usePlatformAuth()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const canManage = user?.role === 'admin' || user?.role === 'staff'

  const [dash, setDash] = useState<IrrigationDashboard | null>(null)
  const [zones, setZones] = useState<IrrigationZone[] | null>(null)
  const [events, setEvents] = useState<IrrigationEvent[] | null>(null)
  const [farms, setFarms] = useState<RegistryFarm[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const [showZoneForm, setShowZoneForm] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  const [zoneFilter, setZoneFilter] = useState('all')
  const [farmFilter, setFarmFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<IrrigationEventStatus | 'all'>('all')

  const loadAll = () => {
    setLoading(true)
    setError(false)
    Promise.all([getIrrigationDashboard(), listIrrigationZones(), listIrrigationEvents(), listRegistryFarms()])
      .then(([d, z, ev, f]) => {
        setDash(d)
        setZones(z)
        setEvents(ev)
        setFarms(f)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(loadAll, [])

  const reloadEvents = () => {
    listIrrigationEvents({
      zone_id: zoneFilter !== 'all' ? zoneFilter : undefined,
      farm_code: farmFilter !== 'all' ? farmFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }).then(setEvents).catch(() => setError(true))
  }

  useEffect(() => {
    if (events === null) return
    reloadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneFilter, farmFilter, statusFilter])

  const farmName = (code: string) => farms?.find((f) => f.farm_code === code)?.name ?? code
  const zoneLabel = (zoneId: string) => {
    const z = zones?.find((zz) => zz.id === zoneId)
    return z ? `${z.zone_name} · ${farmName(z.farm_code)}` : zoneId
  }

  const zonesByFarm = useMemo(() => {
    const groups = new Map<string, IrrigationZone[]>()
    ;(zones ?? []).forEach((z) => {
      if (!groups.has(z.farm_code)) groups.set(z.farm_code, [])
      groups.get(z.farm_code)!.push(z)
    })
    return Array.from(groups.entries())
  }, [zones])

  const sortedEvents = useMemo(
    () => [...(events ?? [])].sort((a, b) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime()),
    [events],
  )

  const dateFmt = (iso?: string) => (iso ? new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : null)

  if (loading) {
    return (
      <PlatformPageShell title={`${t('platformIrrigation.title')} — PURE LINE`}>
        <div className="container-px"><CenterLoader /></div>
      </PlatformPageShell>
    )
  }

  if (error && !dash) {
    return (
      <PlatformPageShell title={`${t('platformIrrigation.title')} — PURE LINE`}>
        <div className="container-px"><CenterError /></div>
      </PlatformPageShell>
    )
  }

  const zoneStatusEntries = IRRIGATION_ZONE_STATUSES.map((s) => ({ status: s, count: dash?.zones_by_status?.[s] ?? 0 }))

  return (
    <PlatformPageShell title={`${t('platformIrrigation.title')} — PURE LINE`} description={t('platformIrrigation.subtitle')}>
      <div className="container-px">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">{t('platformIrrigation.eyebrow')}</span>
            <h1 className="mt-4 text-2xl font-black sm:text-3xl">{t('platformIrrigation.title')}</h1>
            <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('platformIrrigation.subtitle')}</p>
          </div>
        </div>

        {/* Dashboard cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Reveal>
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <CalendarClock className="h-5 w-5 text-primary dark:text-secondary" />
              <div className="mt-3 text-2xl font-black">{dash?.today_scheduled_count ?? 0}</div>
              <div className="mt-1 text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">{t('platformIrrigation.kpi.todayScheduled')}</div>
            </div>
          </Reveal>
          <Reveal delay={0.03}>
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <Waves className="h-5 w-5 text-primary dark:text-secondary" />
              <div className="mt-3 text-2xl font-black">{(dash?.week_total_water_volume_m3 ?? 0).toLocaleString(lang)} m³</div>
              <div className="mt-1 text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">{t('platformIrrigation.kpi.weeklyUsage')}</div>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <Gauge className="h-5 w-5 text-primary dark:text-secondary" />
              <div className="mt-1 text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">{t('platformIrrigation.kpi.zonesByStatus')}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {zoneStatusEntries.map(({ status, count }) => (
                  <span key={status} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${irrigationZoneStatusStyles[status]}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${irrigationZoneStatusDot[status]}`} />
                    {t(`platformIrrigation.zoneStatus.${status}`)}: {count}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Irrigated farms GIS map + ET0 weather */}
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-bold">{t('gisMap.irrigationMapTitle')}</h2>
            <LazyFarmGisMap farms={getGisFarms()} height="380px" />
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mb-4 text-lg font-bold">{t('weather.sectionTitle')}</h2>
            <div className="space-y-4">
              {getGisFarms().slice(0, 2).map((f) => (
                <WeatherWidget key={f.id} lat={f.center[0]} lng={f.center[1]} label={lang === 'ar' && f.nameAr ? f.nameAr : f.name} />
              ))}
            </div>
          </Reveal>
        </div>

        {/* Zones */}
        <div className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold">{t('platformIrrigation.zonesSection')}</h2>
            {canManage && farms && (
              <button onClick={() => setShowZoneForm((v) => !v)} className="btn-primary">
                <Plus className="h-4 w-4" /> {t('platformIrrigation.newZone')}
              </button>
            )}
          </div>

          {canManage && showZoneForm && farms && (
            <div className="mt-6">
              <NewZoneForm farms={farms} onCreated={() => { setShowZoneForm(false); loadAll() }} onClose={() => setShowZoneForm(false)} />
            </div>
          )}

          <div className="mt-6">
            {zonesByFarm.length === 0 ? (
              <div className="py-16 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformIrrigation.noZones')}</div>
            ) : (
              <div className="space-y-8">
                {zonesByFarm.map(([farmCode, list]) => (
                  <div key={farmCode}>
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">
                      <MapPin className="h-3.5 w-3.5" /> {farmName(farmCode)}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((z, i) => (
                        <Reveal key={z.id} delay={Math.min(i * 0.02, 0.3)}>
                          <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="truncate text-sm font-bold">{z.zone_name}</h3>
                              <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${irrigationZoneStatusStyles[z.status]}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${irrigationZoneStatusDot[z.status]}`} />
                                {t(`platformIrrigation.zoneStatus.${z.status}`)}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-dark/50 dark:text-neutral-light/50">
                              <span className="flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5" /> {t('platformFarms.hectares', { count: z.area_hectares })}</span>
                              <span className="flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5" /> {t(`platformIrrigation.equipment.${z.equipment_type}`)}</span>
                            </div>
                          </div>
                        </Reveal>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Events */}
        <div className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold">{t('platformIrrigation.eventsSection')}</h2>
            {canManage && zones && zones.length > 0 && (
              <button onClick={() => setShowEventForm((v) => !v)} className="btn-primary">
                <Plus className="h-4 w-4" /> {t('platformIrrigation.scheduleEvent')}
              </button>
            )}
          </div>

          {canManage && showEventForm && zones && zones.length > 0 && (
            <div className="mt-6">
              <NewEventForm
                zones={zones}
                username={user?.username ?? user?.id ?? ''}
                onCreated={() => { setShowEventForm(false); reloadEvents(); loadAll() }}
                onClose={() => setShowEventForm(false)}
              />
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <select value={farmFilter} onChange={(e) => { setFarmFilter(e.target.value); setZoneFilter('all') }} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5">
              <option value="all">{t('platformIrrigation.allFarms')}</option>
              {(farms ?? []).map((f) => <option key={f.farm_code} value={f.farm_code}>{f.name}</option>)}
            </select>
            <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5">
              <option value="all">{t('platformIrrigation.allZones')}</option>
              {(zones ?? []).filter((z) => farmFilter === 'all' || z.farm_code === farmFilter).map((z) => (
                <option key={z.id} value={z.id}>{z.zone_name}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as IrrigationEventStatus | 'all')} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5">
              <option value="all">{t('platformIrrigation.allStatuses')}</option>
              {IRRIGATION_EVENT_STATUSES.map((s) => <option key={s} value={s}>{t(`platformIrrigation.eventStatus.${s}`)}</option>)}
            </select>
          </div>

          <div className="mt-6">
            {!events ? (
              <CenterLoader />
            ) : sortedEvents.length === 0 ? (
              <div className="py-16 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformIrrigation.noEvents')}</div>
            ) : (
              <div className="space-y-3">
                {sortedEvents.map((ev, i) => (
                  <Reveal key={ev.id} delay={Math.min(i * 0.02, 0.3)}>
                    {editingEventId === ev.id ? (
                      <EventEditRow
                        event={ev}
                        onSaved={() => { setEditingEventId(null); reloadEvents(); loadAll() }}
                        onCancel={() => setEditingEventId(null)}
                      />
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] text-neutral-dark/40 dark:text-neutral-light/40">{ev.id}</span>
                            <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${irrigationEventStatusStyles[ev.status]}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${irrigationEventStatusDot[ev.status]}`} />
                              {t(`platformIrrigation.eventStatus.${ev.status}`)}
                            </span>
                          </div>
                          <h3 className="mt-1.5 font-bold">{zoneLabel(ev.zone_id)}</h3>
                          <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-neutral-dark/50 dark:text-neutral-light/50">
                            <span>{t('platformIrrigation.scheduled')}: {dateFmt(ev.scheduled_start)} → {dateFmt(ev.scheduled_end)}</span>
                            {(ev.actual_start || ev.actual_end) && (
                              <span>{t('platformIrrigation.actual')}: {dateFmt(ev.actual_start) ?? '—'} → {dateFmt(ev.actual_end) ?? '—'}</span>
                            )}
                            {ev.water_volume_m3 != null && (
                              <span className="flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5" /> {ev.water_volume_m3} m³</span>
                            )}
                          </div>
                        </div>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => setEditingEventId(ev.id)}
                            className="btn-ghost shrink-0 !py-2"
                          >
                            <Pencil className="h-4 w-4" /> {t('platformIrrigation.editForm.edit')}
                          </button>
                        )}
                      </div>
                    )}
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
