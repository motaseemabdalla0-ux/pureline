import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowUpRight, Loader2, AlertTriangle, MapPin, Tractor, User, Ruler, Calendar, ScanLine, PenLine, Save, Trash2, X } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import GisFrame from '../components/ui/GisFrame'
import SatelliteImage from '../components/ui/SatelliteImage'
import FieldBoundary from '../components/ui/FieldBoundary'
import FarmHealthWidget from '../components/satellite/FarmHealthWidget'
import VegetationTrendChart from '../components/satellite/VegetationTrendChart'
import { clearFarmBoundary, getRegistryFarm, saveFarmBoundary, PlatformApiError } from '../lib/platformApi'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import { regionalSourceForFarm } from '../lib/ndvi'
import { getRealFarmImagery, REAL_FARM_IMAGE_BASE_PATH } from '../lib/realFarmImagery'
import LazyFarmGisMap from '../components/gis/LazyFarmGisMap'
import WeatherWidget from '../components/gis/WeatherWidget'
import { getGisFarm, getGisFarms } from '../lib/gisData'
import dataset from '../data/ndvi-farms.json'
import type { NdviDataset } from '../types/ndvi'
import type { RegistryFarm } from '../types/platform'

const ndviData = dataset as NdviDataset

function Field({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary dark:text-secondary" />
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-dark/40 dark:text-neutral-light/40">{label}</div>
        <div className="mt-0.5 truncate text-sm font-bold">{value}</div>
      </div>
    </div>
  )
}

export default function FarmRegistryDetailPage() {
  const { farmCode } = useParams<{ farmCode: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'

  const [farm, setFarm] = useState<RegistryFarm | null>(null)
  const [error, setError] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = usePlatformAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'staff'
  const [drawing, setDrawing] = useState(false)
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([])
  const [savingBoundary, setSavingBoundary] = useState(false)

  useEffect(() => {
    if (!farmCode) return
    setLoading(true)
    setError(false)
    setNotFound(false)
    getRegistryFarm(farmCode)
      .then(setFarm)
      .catch((err) => {
        if (err instanceof PlatformApiError && err.status === 404) setNotFound(true)
        else setError(true)
      })
      .finally(() => setLoading(false))
  }, [farmCode])

  const ndviFarm = ndviData.farms.find((f) => f.id === farmCode)
  const real = ndviFarm ? getRealFarmImagery(ndviFarm.id) : undefined

  if (loading) {
    return (
      <PlatformPageShell title={`${t('platformFarms.detailTitle')} — PURE LINE`}>
        <div className="container-px"><div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>
      </PlatformPageShell>
    )
  }

  if (notFound || (error && !farm)) {
    return (
      <PlatformPageShell title={`${t('platformFarms.detailTitle')} — PURE LINE`}>
        <div className="container-px">
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-neutral-dark/60 dark:text-neutral-light/60">
              {notFound ? t('platformFarms.notFound') : t('common.error')}
            </p>
            <Link to="/platform/farms" className="btn-ghost mt-2">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('platformFarms.backToRegistry')}
            </Link>
          </div>
        </div>
      </PlatformPageShell>
    )
  }

  if (!farm) return null

  return (
    <PlatformPageShell title={`${farm.name} — PURE LINE`}>
      <div className="container-px">
        <Link to="/platform/farms" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-secondary">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('platformFarms.backToRegistry')}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <GisFrame scanline>
              <div className="relative">
                {real ? (
                  <SatelliteImage
                    real={{ variants: real.variants, basePath: REAL_FARM_IMAGE_BASE_PATH, attribution: `Esri World Imagery · ${t('satelliteFarmCard.realSourceLabel')}` }}
                    alt={t('satelliteFarmCard.realImageAlt', { name: farm.name })}
                    className="aspect-[4/3] w-full"
                  >
                    <FieldBoundary polygon={real.polygon} bbox={real.bbox} />
                  </SatelliteImage>
                ) : (
                  <SatelliteImage
                    source={regionalSourceForFarm(farm.farm_code)}
                    variant="dark"
                    alt={t('satelliteFarmCard.imageAlt', { name: farm.name })}
                    className="aspect-[4/3] w-full"
                  />
                )}
              </div>
            </GisFrame>
          </Reveal>

          <Reveal delay={0.05} className="lg:col-span-2">
            <p className="font-mono text-xs text-neutral-dark/50 dark:text-neutral-light/50">{farm.farm_code}</p>
            <h1 className="mt-1 text-2xl font-black">{farm.name}</h1>

            <div className="mt-6 grid gap-3">
              <Field icon={MapPin} label={t('platformFarms.fields.region')} value={farm.region || t('platformFarms.notRecorded')} />
              <Field icon={Tractor} label={t('platformFarms.fields.cropType')} value={farm.crop_type ?? t('platformFarms.notRecorded')} />
              <Field icon={Ruler} label={t('platformFarms.fields.area')} value={farm.area_hectares != null ? t('platformFarms.hectares', { count: farm.area_hectares }) : t('platformFarms.notRecorded')} />
              <Field icon={User} label={t('platformFarms.fields.owner')} value={farm.owner_name ?? t('platformFarms.notRecorded')} />
              <Field
                icon={MapPin}
                label={t('platformFarms.fields.coordinates')}
                value={farm.coordinates_lat != null && farm.coordinates_lng != null
                  ? `${farm.coordinates_lat.toFixed(4)}, ${farm.coordinates_lng.toFixed(4)}`
                  : t('platformFarms.notRecorded')}
              />
              <Field
                icon={Calendar}
                label={t('platformFarms.fields.registered')}
                value={new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(farm.created_at))}
              />
            </div>
          </Reveal>
        </div>

        {/* Interactive GIS + live agro-weather */}
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <MapPin className="h-5 w-5 text-primary dark:text-secondary" /> {t('gisMap.farmMapTitle')}
            </h2>
            <LazyFarmGisMap
              farms={getGisFarms()}
              focusFarmId={getGisFarm(farm.farm_code) ? farm.farm_code : undefined}
              height="380px"
              drawMode={drawing}
              drawPoints={drawPoints}
              onDrawPointsChange={setDrawPoints}
              customRings={farm.boundary_json && !drawing
                ? [{ id: 'custom', ring: farm.boundary_json, label: t('boundaryEditor.customLabel') }]
                : []}
            />
            {canEdit && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!drawing ? (
                  <>
                    <button type="button" onClick={() => { setDrawing(true); setDrawPoints(farm.boundary_json ?? []) }} className="btn-ghost !px-3.5 !py-2 text-xs">
                      <PenLine className="h-3.5 w-3.5" /> {farm.boundary_json ? t('boundaryEditor.edit') : t('boundaryEditor.draw')}
                    </button>
                    {farm.boundary_json && (
                      <button
                        type="button"
                        disabled={savingBoundary}
                        onClick={() => {
                          setSavingBoundary(true)
                          clearFarmBoundary(farm.farm_code).then(setFarm).catch(() => undefined).finally(() => setSavingBoundary(false))
                        }}
                        className="btn-ghost !px-3.5 !py-2 text-xs !text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> {t('boundaryEditor.clear')}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">
                      {t('boundaryEditor.points', { count: drawPoints.length })}
                    </span>
                    <button
                      type="button"
                      disabled={drawPoints.length < 3 || savingBoundary}
                      onClick={() => {
                        setSavingBoundary(true)
                        saveFarmBoundary(farm.farm_code, drawPoints)
                          .then((f) => { setFarm(f); setDrawing(false); setDrawPoints([]) })
                          .catch(() => undefined)
                          .finally(() => setSavingBoundary(false))
                      }}
                      className="btn-primary !px-3.5 !py-2 text-xs"
                    >
                      {savingBoundary ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {t('boundaryEditor.save')}
                    </button>
                    {drawPoints.length > 0 && (
                      <button type="button" onClick={() => setDrawPoints(drawPoints.slice(0, -1))} className="btn-ghost !px-3.5 !py-2 text-xs">
                        {t('boundaryEditor.undo')}
                      </button>
                    )}
                    <button type="button" onClick={() => { setDrawing(false); setDrawPoints([]) }} className="btn-ghost !px-3.5 !py-2 text-xs">
                      <X className="h-3.5 w-3.5" /> {t('common.cancel')}
                    </button>
                  </>
                )}
              </div>
            )}
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mb-4 text-lg font-bold">{t('weather.sectionTitle')}</h2>
            {(() => {
              const gis = getGisFarm(farm.farm_code)
              const lat = farm.coordinates_lat ?? gis?.center[0]
              const lng = farm.coordinates_lng ?? gis?.center[1]
              return lat != null && lng != null
                ? <WeatherWidget lat={lat} lng={lng} label={farm.name} />
                : <p className="text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformFarms.notRecorded')}</p>
            })()}
          </Reveal>
        </div>

        <div className="mt-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <ScanLine className="h-5 w-5 text-primary dark:text-secondary" /> {t('platformFarms.ndviSection')}
            </h2>
            {ndviFarm && (
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/ndvi-analytics?farm=${encodeURIComponent(ndviFarm.id)}`}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-secondary"
                >
                  {t('platformFarms.viewNdviAnalytics')} <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
                </Link>
                <Link
                  to={`/satellite-intelligence?farm=${encodeURIComponent(ndviFarm.id)}`}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-secondary"
                >
                  {t('platformFarms.viewSatelliteIntel')} <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
                </Link>
              </div>
            )}
          </div>
          {ndviFarm ? (
            <>
              <Reveal delay={0.05} className="mt-6 max-w-sm">
                <FarmHealthWidget farm={ndviFarm} />
              </Reveal>
              <Reveal delay={0.1} className="mt-6">
                <VegetationTrendChart farm={ndviFarm} />
              </Reveal>
            </>
          ) : (
            <Reveal delay={0.05} className="mt-6">
              <p className="rounded-2xl border border-black/5 bg-white p-6 text-sm text-neutral-dark/50 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-neutral-light/50">
                {t('platformFarms.noNdviMatch')}
              </p>
            </Reveal>
          )}
        </div>
      </div>
    </PlatformPageShell>
  )
}
