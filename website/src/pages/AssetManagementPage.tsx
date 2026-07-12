import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Wrench, Radio, Droplets, Truck, Plane, Activity, Package, Loader2, AlertTriangle, Plus, X, ChevronRight, MapPin, Calendar,
} from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import { createAsset, listAssets, listRegistryFarms } from '../lib/platformApi'
import { ASSET_CATEGORIES, ASSET_STATUSES, assetStatusDot, assetStatusStyles } from '../lib/assets'
import type { Asset, AssetCategory, AssetStatus, CreateAssetPayload, RegistryFarm } from '../types/platform'

const CATEGORY_ICONS: Record<AssetCategory, typeof Wrench> = {
  pump: Wrench,
  sensor: Radio,
  irrigation_equipment: Droplets,
  vehicle: Truck,
  drone: Plane,
  monitoring_device: Activity,
}

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

function NewAssetForm({
  farms, onCreated, onClose,
}: { farms: RegistryFarm[]; onCreated: () => void; onClose: () => void }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<AssetCategory>('pump')
  const [farmCode, setFarmCode] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  const submit = async () => {
    if (submitting || !name.trim()) return
    setSubmitting(true)
    setError(false)
    try {
      const payload: CreateAssetPayload = {
        name: name.trim(),
        category,
        farm_code: farmCode,
        purchase_date: purchaseDate || undefined,
      }
      await createAsset(payload)
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
        <h3 className="text-sm font-bold">{t('platformAssets.newForm.title')}</h3>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('platformAssets.newForm.name')}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value as AssetCategory)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {ASSET_CATEGORIES.map((c) => <option key={c} value={c}>{t(`platformAssets.category.${c}`)}</option>)}
        </select>
        <select value={farmCode} onChange={(e) => setFarmCode(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          <option value="">{t('platformAssets.newForm.noFarm')}</option>
          {farms.map((f) => <option key={f.farm_code} value={f.farm_code}>{f.name} ({f.farm_code})</option>)}
        </select>
        <input
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          type="date"
          placeholder={t('platformAssets.newForm.purchaseDate')}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
      </div>
      {error && <div className="mt-3 text-xs text-red-500">{t('common.error')}</div>}
      <button onClick={submit} disabled={submitting || !name.trim()} className="btn-primary mt-4">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('platformAssets.newForm.submit')}
      </button>
    </div>
  )
}

export default function AssetManagementPage() {
  const { t, i18n } = useTranslation()
  const { user } = usePlatformAuth()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const canManage = user?.role === 'admin' || user?.role === 'staff'

  const [assets, setAssets] = useState<Asset[] | null>(null)
  const [farms, setFarms] = useState<RegistryFarm[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all')
  const [farmFilter, setFarmFilter] = useState('all')

  const loadAll = () => {
    setLoading(true)
    setError(false)
    Promise.all([listAssets(), listRegistryFarms()])
      .then(([a, f]) => {
        setAssets(a)
        setFarms(f)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(loadAll, [])

  const reloadAssets = () => {
    listAssets({
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      farm_code: farmFilter !== 'all' ? farmFilter : undefined,
    }).then(setAssets).catch(() => setError(true))
  }

  useEffect(() => {
    if (assets === null) return
    reloadAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, statusFilter, farmFilter])

  const farmName = (code: string) => farms?.find((f) => f.farm_code === code)?.name ?? code

  if (loading) {
    return (
      <PlatformPageShell title={`${t('platformAssets.title')} — PURE LINE`}>
        <div className="container-px"><CenterLoader /></div>
      </PlatformPageShell>
    )
  }

  if (error && !assets) {
    return (
      <PlatformPageShell title={`${t('platformAssets.title')} — PURE LINE`}>
        <div className="container-px"><CenterError /></div>
      </PlatformPageShell>
    )
  }

  return (
    <PlatformPageShell title={`${t('platformAssets.title')} — PURE LINE`} description={t('platformAssets.subtitle')}>
      <div className="container-px">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">{t('platformAssets.eyebrow')}</span>
            <h1 className="mt-4 text-2xl font-black sm:text-3xl">{t('platformAssets.title')}</h1>
            <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('platformAssets.subtitle')}</p>
          </div>
          {canManage && farms && (
            <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
              <Plus className="h-4 w-4" /> {t('platformAssets.newAsset')}
            </button>
          )}
        </div>

        {canManage && showForm && farms && (
          <div className="mt-8">
            <NewAssetForm farms={farms} onCreated={() => { setShowForm(false); loadAll() }} onClose={() => setShowForm(false)} />
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as AssetCategory | 'all')} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5">
            <option value="all">{t('platformAssets.allCategories')}</option>
            {ASSET_CATEGORIES.map((c) => <option key={c} value={c}>{t(`platformAssets.category.${c}`)}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AssetStatus | 'all')} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5">
            <option value="all">{t('platformAssets.allStatuses')}</option>
            {ASSET_STATUSES.map((s) => <option key={s} value={s}>{t(`platformAssets.status.${s}`)}</option>)}
          </select>
          <select value={farmFilter} onChange={(e) => setFarmFilter(e.target.value)} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5">
            <option value="all">{t('platformAssets.allFarms')}</option>
            {(farms ?? []).map((f) => <option key={f.farm_code} value={f.farm_code}>{f.name}</option>)}
          </select>
        </div>

        <div className="mt-8">
          {!assets ? (
            <CenterLoader />
          ) : assets.length === 0 ? (
            <div className="py-16 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformAssets.empty')}</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((a, i) => {
                const Icon = CATEGORY_ICONS[a.category] ?? Package
                return (
                  <Reveal key={a.asset_code} delay={Math.min(i * 0.02, 0.3)}>
                    <Link
                      to={`/platform/assets/${a.asset_code}`}
                      className="flex h-full flex-col rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary dark:text-secondary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${assetStatusStyles[a.status]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${assetStatusDot[a.status]}`} />
                          {t(`platformAssets.status.${a.status}`)}
                        </span>
                      </div>
                      <h3 className="mt-3 truncate text-sm font-bold">{a.name}</h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-neutral-dark/50 dark:text-neutral-light/50">
                        <span className="font-mono text-[11px]">{a.asset_code}</span>
                        <span>·</span>
                        <span>{t(`platformAssets.category.${a.category}`)}</span>
                      </div>
                      <div className="mt-3 flex flex-1 flex-wrap items-end justify-between gap-2 text-xs text-neutral-dark/50 dark:text-neutral-light/50">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" /> {a.farm_code ? farmName(a.farm_code) : t('platformAssets.noFarm')}
                        </span>
                        {a.purchase_date && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(a.purchase_date))}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-dark/30 rtl:rotate-180 dark:text-neutral-light/30" />
                      </div>
                    </Link>
                  </Reveal>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PlatformPageShell>
  )
}
