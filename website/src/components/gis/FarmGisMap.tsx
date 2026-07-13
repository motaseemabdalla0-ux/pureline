import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Maximize2, Minimize2, Ruler, X } from 'lucide-react'
import {
  MapContainer, TileLayer, LayersControl, Polygon, Polyline, CircleMarker, Popup, Tooltip,
  useMap, useMapEvents,
} from 'react-leaflet'
import { ndviColor } from '../../lib/ndvi'
import type { GisFarm } from '../../lib/gisData'

/** Extra point overlay (trap, recycling station, ...) rendered on top of farms. */
export interface GisMarker {
  id: string
  position: [number, number]
  kind: 'trap' | 'station' | 'generic'
  label: string
  sublabel?: string
  /** dot color; defaults per kind */
  color?: string
}

export interface FarmGisMapProps {
  farms: GisFarm[]
  /** When set, the map zooms to this farm and dims the others. */
  focusFarmId?: string
  height?: string
  /** Show "open farm page / NDVI / satellite" links inside popups. */
  showLinks?: boolean
  markers?: GisMarker[]
  /** Enable the advanced toolbar (fullscreen + measure). Default true. */
  tools?: boolean
  className?: string
}

const MARKER_COLORS: Record<GisMarker['kind'], string> = {
  trap: '#e0913a',
  station: '#3b82f6',
  generic: '#ffffff',
}

/** Fits the viewport to the rendered farm geometry (or the focused farm). */
function FitBounds({ farms, focusFarmId }: { farms: GisFarm[]; focusFarmId?: string }) {
  const map = useMap()
  useEffect(() => {
    const target = focusFarmId ? farms.filter((f) => f.id === focusFarmId) : farms
    const rings = (target.length > 0 ? target : farms).map((f) => f.ring)
    if (rings.length === 0) return
    const bounds = L.latLngBounds(rings.flat())
    map.fitBounds(bounds.pad(focusFarmId ? 0.4 : 0.15))
  }, [map, farms, focusFarmId])
  return null
}

/** Re-measures the container after fullscreen toggles. */
function InvalidateOnResize({ dep }: { dep: boolean }) {
  const map = useMap()
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 150)
    return () => clearTimeout(id)
  }, [map, dep])
  return null
}

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLng = ((b[1] - a[1]) * Math.PI) / 180
  const la1 = (a[0] * Math.PI) / 180
  const la2 = (b[0] * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Click-to-measure distance tool. */
function MeasureLayer({ active, points, setPoints }: {
  active: boolean
  points: [number, number][]
  setPoints: (p: [number, number][]) => void
}) {
  useMapEvents({
    click(e) {
      if (active) setPoints([...points, [e.latlng.lat, e.latlng.lng]])
    },
  })
  if (points.length === 0) return null
  let total = 0
  for (let i = 1; i < points.length; i++) total += haversineMeters(points[i - 1], points[i])
  const label = total >= 1000 ? `${(total / 1000).toFixed(2)} km` : `${Math.round(total)} m`
  return (
    <>
      <Polyline positions={points} pathOptions={{ color: '#D4AF37', weight: 2.5, dashArray: '6 6' }}>
        {points.length > 1 && (
          <Tooltip permanent direction="top" offset={[0, -6]}>{label}</Tooltip>
        )}
      </Polyline>
      {points.map((p, i) => (
        <CircleMarker key={i} center={p} radius={3.5}
          pathOptions={{ color: '#D4AF37', weight: 2, fillColor: '#0b1512', fillOpacity: 1 }} />
      ))}
    </>
  )
}

/**
 * Interactive GIS map (Leaflet): real Esri World Imagery / OSM base layers,
 * real field-boundary polygons colored by each farm's latest NDVI reading,
 * clickable popups with live vegetation stats and cross-module links, plus
 * advanced tools: point overlays (traps / recycling stations), fullscreen,
 * and click-to-measure distances.
 */
export default function FarmGisMap({
  farms, focusFarmId, height = '420px', showLinks = true, markers = [], tools = true, className = '',
}: FarmGisMapProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const [fullscreen, setFullscreen] = useState(false)
  const [measuring, setMeasuring] = useState(false)
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([])

  const initialCenter = useMemo<[number, number]>(() => {
    if (farms.length === 0) return [26.6, 37.9] // AlUla region
    const f = focusFarmId ? farms.find((x) => x.id === focusFarmId) ?? farms[0] : farms[0]
    return f.center
  }, [farms, focusFarmId])

  const stopMeasure = () => {
    setMeasuring(false)
    setMeasurePoints([])
  }

  return (
    <div
      dir="ltr"
      className={
        fullscreen
          ? 'fixed inset-0 z-[1000] bg-neutral-dark'
          : `relative overflow-hidden rounded-3xl border border-black/10 shadow-sm dark:border-white/10 ${className}`
      }
      style={fullscreen ? undefined : { height }}
    >
      <MapContainer center={initialCenter} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%', background: '#0b1512' }}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name={t('gisMap.satelliteLayer')}>
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name={t('gisMap.streetLayer')}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <FitBounds farms={farms} focusFarmId={focusFarmId} />
        <InvalidateOnResize dep={fullscreen} />
        <MeasureLayer active={measuring} points={measurePoints} setPoints={setMeasurePoints} />

        {farms.map((f) => {
          const color = ndviColor(f.ndviValue)
          const dimmed = Boolean(focusFarmId && f.id !== focusFarmId)
          const displayName = lang === 'ar' && f.nameAr ? f.nameAr : f.name
          return (
            <Polygon
              key={f.id}
              positions={f.ring}
              pathOptions={{
                color,
                weight: dimmed ? 1.5 : 2.5,
                fillColor: color,
                fillOpacity: dimmed ? 0.08 : 0.25,
                opacity: dimmed ? 0.4 : 0.95,
                dashArray: dimmed ? '4 6' : undefined,
              }}
            >
              <Popup>
                <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-w-[180px] text-[13px] leading-snug">
                  <div className="font-mono text-[10px] opacity-60">{f.id}</div>
                  <div className="mt-0.5 text-sm font-bold">{displayName}</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span>NDVI {(f.ndviValue * 100).toFixed(1)}%</span>
                    {typeof f.ndvi12moTrendPercent === 'number' && (
                      <span style={{ color: f.ndvi12moTrendPercent >= 0 ? '#2f9e5c' : '#d15236' }}>
                        {f.ndvi12moTrendPercent >= 0 ? '+' : ''}{f.ndvi12moTrendPercent}% / 12{t('gisMap.monthsShort')}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] opacity-60">{t(`liveNdvi.status.${f.status}`)}</div>
                  {showLinks && (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-semibold">
                      <Link to={`/platform/farms/${f.id}`} className="!text-[#0F6B3A] hover:underline">{t('gisMap.openFarm')}</Link>
                      <Link to={`/ndvi-analytics?farm=${encodeURIComponent(f.id)}`} className="!text-[#0F6B3A] hover:underline">NDVI</Link>
                      <Link to={`/satellite-intelligence?farm=${encodeURIComponent(f.id)}`} className="!text-[#0F6B3A] hover:underline">{t('gisMap.satellite')}</Link>
                    </div>
                  )}
                </div>
              </Popup>
            </Polygon>
          )
        })}

        {farms.map((f) => (
          <CircleMarker
            key={`${f.id}-c`}
            center={f.center}
            radius={4}
            pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: ndviColor(f.ndviValue), fillOpacity: 1 }}
          />
        ))}

        {markers.map((m) => (
          <CircleMarker
            key={m.id}
            center={m.position}
            radius={6}
            pathOptions={{
              color: '#0b1512',
              weight: 1.5,
              fillColor: m.color ?? MARKER_COLORS[m.kind],
              fillOpacity: 0.95,
            }}
          >
            <Popup>
              <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-w-[140px] text-[13px] leading-snug">
                <div className="text-sm font-bold">{m.label}</div>
                {m.sublabel && <div className="mt-0.5 text-[11px] opacity-60">{m.sublabel}</div>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Advanced tools */}
      {tools && (
        <div className="absolute start-3 top-3 z-[500] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            title={fullscreen ? t('gisMap.exitFullscreen') : t('gisMap.fullscreen')}
            className="rounded-lg bg-black/60 p-2 text-white backdrop-blur transition hover:bg-black/80"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => (measuring ? stopMeasure() : setMeasuring(true))}
            title={t('gisMap.measure')}
            className={`rounded-lg p-2 backdrop-blur transition ${measuring ? 'bg-accent text-neutral-dark' : 'bg-black/60 text-white hover:bg-black/80'}`}
          >
            {measuring ? <X className="h-4 w-4" /> : <Ruler className="h-4 w-4" />}
          </button>
        </div>
      )}
      {measuring && (
        <div className="pointer-events-none absolute start-1/2 top-3 z-[500] -translate-x-1/2 rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold text-neutral-dark">
          {t('gisMap.measureHint')}
        </div>
      )}

      {/* NDVI legend */}
      <div className="pointer-events-none absolute bottom-3 start-3 z-[500] rounded-xl bg-black/60 px-3 py-2 text-[10px] font-semibold text-white backdrop-blur">
        <div className="mb-1 uppercase tracking-wider opacity-70">{t('gisMap.legend')}</div>
        <div className="flex items-center gap-2">
          {[0.06, 0.09, 0.12, 0.18, 0.24].map((v) => (
            <span key={v} className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ndviColor(v) }} />
              {(v * 100).toFixed(0)}%
            </span>
          ))}
          {markers.length > 0 && (
            <>
              {(['trap', 'station'] as const).filter((k) => markers.some((m) => m.kind === k)).map((k) => (
                <span key={k} className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MARKER_COLORS[k] }} />
                  {t(`gisMap.markerKind.${k}`)}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
