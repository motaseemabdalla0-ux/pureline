import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Search, Loader2, AlertTriangle, MapPin, Tractor, User, Ruler, ArrowUpRight, Map, LayoutGrid } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import LazyFarmGisMap from '../components/gis/LazyFarmGisMap'
import { getGisFarms } from '../lib/gisData'
import { listRegistryFarms } from '../lib/platformApi'
import type { RegistryFarm } from '../types/platform'

export default function FarmRegistryPage() {
  const { t } = useTranslation()
  const [farms, setFarms] = useState<RegistryFarm[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('all')
  const [cropType, setCropType] = useState('all')
  const [view, setView] = useState<'grid' | 'map'>('grid')

  const load = () => {
    setLoading(true)
    setError(false)
    listRegistryFarms()
      .then(setFarms)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const regions = useMemo(() => Array.from(new Set((farms ?? []).map((f) => f.region).filter(Boolean))).sort(), [farms])
  const cropTypes = useMemo(() => Array.from(new Set((farms ?? []).map((f) => f.crop_type).filter((c): c is string => Boolean(c)))).sort(), [farms])

  const filtered = useMemo(() => {
    if (!farms) return []
    const q = search.trim().toLowerCase()
    return farms.filter((f) => {
      if (region !== 'all' && f.region !== region) return false
      if (cropType !== 'all' && f.crop_type !== cropType) return false
      if (q && !`${f.farm_code} ${f.name} ${f.owner_name ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [farms, search, region, cropType])

  return (
    <PlatformPageShell title={`${t('platformFarms.title')} — PURE LINE`} description={t('platformFarms.subtitle')}>
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('platformFarms.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h1 className="section-title mt-5">{t('platformFarms.title')}</h1></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('platformFarms.subtitle')}</p></Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-dark/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('platformFarms.searchPlaceholder')}
                className="w-full rounded-xl border border-black/10 bg-white py-2.5 ps-10 pe-4 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5">
              <option value="all">{t('platformFarms.allRegions')}</option>
              {regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={cropType} onChange={(e) => setCropType(e.target.value)} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5">
              <option value="all">{t('platformFarms.allCrops')}</option>
              {cropTypes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold transition ${view === 'grid' ? 'bg-primary text-white' : 'bg-white text-neutral-dark/60 dark:bg-white/5 dark:text-neutral-light/60'}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> {t('gisMap.gridView')}
              </button>
              <button
                type="button"
                onClick={() => setView('map')}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold transition ${view === 'map' ? 'bg-primary text-white' : 'bg-white text-neutral-dark/60 dark:bg-white/5 dark:text-neutral-light/60'}`}
              >
                <Map className="h-3.5 w-3.5" /> {t('gisMap.mapView')}
              </button>
            </div>
          </div>
        </Reveal>

        {view === 'map' && (
          <Reveal delay={0.1}>
            <div className="mx-auto mt-10 max-w-6xl">
              <LazyFarmGisMap farms={getGisFarms()} height="520px" />
            </div>
          </Reveal>
        )}

        <div className={view === 'map' ? 'hidden' : 'mt-12'}>
          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-24 text-red-500">
              <AlertTriangle className="h-6 w-6" />
              <p className="text-sm">{t('common.error')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformFarms.empty')}</div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((f, i) => (
                <Reveal key={f.farm_code} delay={i * 0.03}>
                  <Link
                    to={`/platform/farms/${f.farm_code}`}
                    className="group flex h-full flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] text-neutral-dark/40 dark:text-neutral-light/40">{f.farm_code}</div>
                        <h3 className="mt-1 truncate font-bold">{f.name}</h3>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-primary opacity-0 transition group-hover:opacity-100 dark:text-secondary rtl:-scale-x-100" />
                    </div>
                    <div className="mt-4 space-y-2 text-xs text-neutral-dark/60 dark:text-neutral-light/60">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70 dark:text-secondary/70" />
                        {f.region || t('platformFarms.notRecorded')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Tractor className="h-3.5 w-3.5 shrink-0 text-primary/70 dark:text-secondary/70" />
                        {f.crop_type ?? t('platformFarms.notRecorded')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Ruler className="h-3.5 w-3.5 shrink-0 text-primary/70 dark:text-secondary/70" />
                        {f.area_hectares != null ? t('platformFarms.hectares', { count: f.area_hectares }) : t('platformFarms.notRecorded')}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 shrink-0 text-primary/70 dark:text-secondary/70" />
                        {f.owner_name ?? t('platformFarms.notRecorded')}
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </PlatformPageShell>
  )
}
