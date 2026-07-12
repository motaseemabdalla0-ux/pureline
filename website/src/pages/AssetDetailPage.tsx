import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, Loader2, AlertTriangle, Calendar, MapPin, Wrench, DollarSign, User,
} from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import {
  createAssetMaintenance, getAsset, getRegistryFarm, listAssetMaintenance, updateAssetStatus, PlatformApiError,
} from '../lib/platformApi'
import { ASSET_STATUSES, assetStatusDot, assetStatusStyles } from '../lib/assets'
import type {
  Asset, AssetMaintenance, AssetStatus, CreateAssetMaintenancePayload, RegistryFarm,
} from '../types/platform'

function StatusChangeControl({ asset, onChanged }: { asset: Asset; onChanged: (a: Asset) => void }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<AssetStatus>(asset.status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const save = async () => {
    if (saving) return
    setSaving(true)
    setError(false)
    try {
      const updated = await updateAssetStatus(asset.asset_code, status)
      onChanged(updated)
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <h3 className="text-sm font-bold">{t('platformAssetDetail.changeStatus')}</h3>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value as AssetStatus)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {ASSET_STATUSES.map((s) => <option key={s} value={s}>{t(`platformAssets.status.${s}`)}</option>)}
        </select>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('platformAssetDetail.updateStatus')}
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red-500">{t('common.error')}</div>}
    </div>
  )
}

function LogMaintenanceForm({ assetCode, onCreated }: { assetCode: string; onCreated: () => void }) {
  const { t } = useTranslation()
  const [serviceDate, setServiceDate] = useState('')
  const [performedBy, setPerformedBy] = useState('')
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState('')
  const [nextDueDate, setNextDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  const submit = async () => {
    if (submitting || !serviceDate || !performedBy.trim() || !description.trim()) return
    setSubmitting(true)
    setError(false)
    try {
      const payload: CreateAssetMaintenancePayload = {
        service_date: new Date(serviceDate).toISOString(),
        performed_by: performedBy.trim(),
        description: description.trim(),
        cost: cost ? Number(cost) : undefined,
        next_due_date: nextDueDate ? new Date(nextDueDate).toISOString() : undefined,
      }
      await createAssetMaintenance(assetCode, payload)
      setServiceDate('')
      setPerformedBy('')
      setDescription('')
      setCost('')
      setNextDueDate('')
      onCreated()
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Wrench className="h-4 w-4 text-primary dark:text-secondary" /> {t('platformAssetDetail.logMaintenance.title')}
      </h3>
      <div className="mt-4 space-y-3">
        <input
          value={serviceDate}
          onChange={(e) => setServiceDate(e.target.value)}
          type="date"
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={performedBy}
          onChange={(e) => setPerformedBy(e.target.value)}
          placeholder={t('platformAssetDetail.logMaintenance.performedBy')}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('platformAssetDetail.logMaintenance.description')}
          rows={2}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          type="number"
          min={0}
          step="0.01"
          placeholder={t('platformAssetDetail.logMaintenance.cost')}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">
            {t('platformAssetDetail.logMaintenance.nextDueDate')}
          </label>
          <input
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
            type="date"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          />
        </div>
      </div>
      {error && <div className="mt-2 text-xs text-red-500">{t('common.error')}</div>}
      <button
        onClick={submit}
        disabled={submitting || !serviceDate || !performedBy.trim() || !description.trim()}
        className="btn-primary mt-4 w-full justify-center"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('platformAssetDetail.logMaintenance.submit')}
      </button>
    </div>
  )
}

export default function AssetDetailPage() {
  const { assetCode } = useParams<{ assetCode: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const { user } = usePlatformAuth()
  const canManage = user?.role === 'admin' || user?.role === 'staff'

  const [asset, setAsset] = useState<Asset | null>(null)
  const [farm, setFarm] = useState<RegistryFarm | null>(null)
  const [maintenance, setMaintenance] = useState<AssetMaintenance[]>([])
  const [error, setError] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadMaintenance = (code: string) => {
    listAssetMaintenance(code)
      .then(setMaintenance)
      .catch(() => { /* non-fatal: maintenance history simply stays empty */ })
  }

  const load = () => {
    if (!assetCode) return
    setLoading(true)
    setError(false)
    setNotFound(false)
    getAsset(assetCode)
      .then((a) => {
        setAsset(a)
        loadMaintenance(a.asset_code)
        if (a.farm_code) {
          getRegistryFarm(a.farm_code).then(setFarm).catch(() => setFarm(null))
        } else {
          setFarm(null)
        }
      })
      .catch((err) => {
        if (err instanceof PlatformApiError && err.status === 404) setNotFound(true)
        else setError(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [assetCode])

  const dateFmt = (iso?: string) => (iso ? new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(iso)) : null)

  if (loading) {
    return (
      <PlatformPageShell title={`${t('platformAssetDetail.title')} — PURE LINE`}>
        <div className="container-px"><div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>
      </PlatformPageShell>
    )
  }

  if (notFound || (error && !asset)) {
    return (
      <PlatformPageShell title={`${t('platformAssetDetail.title')} — PURE LINE`}>
        <div className="container-px">
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-neutral-dark/60 dark:text-neutral-light/60">
              {notFound ? t('platformAssetDetail.notFound') : t('common.error')}
            </p>
            <Link to="/platform/assets" className="btn-ghost mt-2">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('platformAssetDetail.backToList')}
            </Link>
          </div>
        </div>
      </PlatformPageShell>
    )
  }

  if (!asset) return null

  return (
    <PlatformPageShell title={`${asset.name} — PURE LINE`}>
      <div className="container-px">
        <Link to="/platform/assets" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-secondary">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('platformAssetDetail.backToList')}
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-neutral-dark/40 dark:text-neutral-light/40">{asset.asset_code}</span>
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${assetStatusStyles[asset.status]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${assetStatusDot[asset.status]}`} />
                {t(`platformAssets.status.${asset.status}`)}
              </span>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-neutral-dark/60 dark:bg-white/10 dark:text-neutral-light/60">
                {t(`platformAssets.category.${asset.category}`)}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">{asset.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-neutral-dark/60 dark:text-neutral-light/60">
              {asset.farm_code ? (
                <Link to={`/platform/farms/${asset.farm_code}`} className="flex items-center gap-1.5 font-semibold text-primary hover:underline dark:text-secondary">
                  <MapPin className="h-4 w-4" /> {farm?.name ?? asset.farm_code}
                </Link>
              ) : (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {t('platformAssets.noFarm')}
                </span>
              )}
              {asset.purchase_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {t('platformAssetDetail.purchasedOn')}: {dateFmt(asset.purchase_date)}
                </span>
              )}
              {asset.last_service_date && (
                <span className="flex items-center gap-1.5">
                  <Wrench className="h-4 w-4" /> {t('platformAssetDetail.lastServiceOn')}: {dateFmt(asset.last_service_date)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">
                {t('platformAssetDetail.maintenanceSection')}
              </h2>
              {maintenance.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformAssetDetail.noMaintenance')}</p>
              ) : (
                <ol className="mt-5 space-y-0">
                  {maintenance.map((m, i) => (
                    <li key={m.id} className="relative ps-6 pb-5 last:pb-0">
                      {i < maintenance.length - 1 && (
                        <span className="absolute start-[5px] top-3 h-full w-px bg-black/10 dark:bg-white/10" />
                      )}
                      <span className="absolute start-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary dark:bg-secondary" />
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-neutral-dark/85 dark:text-neutral-light/85">{m.description}</div>
                        {typeof m.cost === 'number' && (
                          <span className="flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-[11px] font-semibold text-secondary">
                            <DollarSign className="h-3 w-3" /> {m.cost.toLocaleString(lang)}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-dark/45 dark:text-neutral-light/45">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {dateFmt(m.service_date)}</span>
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {m.performed_by}</span>
                        {m.next_due_date && (
                          <span>{t('platformAssetDetail.nextDue')}: {dateFmt(m.next_due_date)}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Reveal>

          <div className="space-y-6 lg:col-span-2">
            {canManage && (
              <Reveal delay={0.05}>
                <StatusChangeControl asset={asset} onChanged={setAsset} />
              </Reveal>
            )}
            {canManage && (
              <Reveal delay={0.1}>
                <LogMaintenanceForm assetCode={asset.asset_code} onCreated={() => loadMaintenance(asset.asset_code)} />
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </PlatformPageShell>
  )
}
