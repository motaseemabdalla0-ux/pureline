import farmsManifest from '../../public/images/satellite/processed/farms/manifest.json'
import rawFarmData from '../../public/images/satellite/raw/real_farm_data.json'

/** One image variant from the real Esri farm-imagery manifest. */
interface FarmManifestVariant {
  width: number
  file: string
}

interface FarmManifestEntry {
  bbox: [number, number, number, number]
  pixelSize: [number, number]
  variants: FarmManifestVariant[]
  source: string
  acquired: string
}

/** Real per-farm data extracted from the RCU NDVI portal's own API. */
interface RawFarmEntry {
  region: string
  category: string
  centroid: [number, number]
  /** Simplified, real, closed field-boundary ring: array of [lon, lat]. */
  polygon: [number, number][]
  q4_2023_avg: number
  q4_2025_avg: number
  change_percent: number
  values: number[]
}

const manifest = farmsManifest as unknown as Record<string, FarmManifestEntry>
const rawData = rawFarmData as unknown as Record<string, RawFarmEntry>

/** Base path (relative to /public) for the real Esri farm-crop WebP variants. */
export const REAL_FARM_IMAGE_BASE_PATH = '/images/satellite/processed/farms/'

export interface RealFarmImagery {
  /** [west, south, east, north] in EPSG:4326 — the exact extent the image covers. */
  bbox: [number, number, number, number]
  /** Real, closed field-boundary polygon ring in [lon, lat] pairs. */
  polygon: [number, number][]
  variants: FarmManifestVariant[]
  source: string
  acquired: string
}

/** True when this farm id has real Esri crop imagery + real boundary data. */
export function hasRealFarmImagery(id: string): boolean {
  return id in manifest && id in rawData
}

/**
 * Looks up the real high-resolution Esri crop + real field-boundary polygon
 * for a known farm id (one of the 6 farms pulled directly from the RCU
 * portal). Returns null for any farm id outside that set.
 */
export function getRealFarmImagery(id: string): RealFarmImagery | null {
  const m = manifest[id]
  const r = rawData[id]
  if (!m || !r) return null
  return {
    bbox: m.bbox,
    polygon: r.polygon,
    variants: m.variants,
    source: m.source,
    acquired: m.acquired,
  }
}
