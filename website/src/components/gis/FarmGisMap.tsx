import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapContainer, TileLayer, LayersControl, Polygon, CircleMarker, Popup, useMap,
} from 'react-leaflet'
import { ndviColor } from '../../lib/ndvi'
import type { GisFarm } from '../../lib/gisData'

export interface FarmGisMapProps {
  farms: GisFarm[]
  /** When set, the map zooms to this farm and dims the others. */
  focusFarmId?: string
  height?: string
  /** Show "open farm page / NDVI / satellite" links inside popups. */
  showLinks?: boolean
  className?: string
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

/**
 * Interactive GIS map (Leaflet): real Esri World Imagery / OSM base layers,
 * real field-boundary polygons colored by each farm's latest NDVI reading,
 * clickable popups with live vegetation stats and cross-module links.
 */
export default function FarmGisMap({
  farms, focusFarmId, height = '420px', showLinks = true, className = '',
}: FarmGisMapProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'

  const initialCenter = useMemo<[number, number]>(() => {
    if (farms.length === 0) return [26.6, 37.9] // AlUla region
    const f = focusFarmId ? farms.find((x) => x.id === focusFarmId) ?? farms[0] : farms[0]
    return f.center
  }, [farms, focusFarmId])

  return (
    <div
      dir="ltr"
      className={`relative overflow-hidden rounded-3xl border border-black/10 shadow-sm dark:border-white/10 ${className}`}
      style={{ height }}
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
      </MapContainer>

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
        </div>
      </div>
    </div>
  )
}
