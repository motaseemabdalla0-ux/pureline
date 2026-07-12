import dataset from '../data/ndvi-farms.json'
import { getRealFarmImagery, hasRealFarmImagery } from './realFarmImagery'
import type { NdviDataset, NdviFarm, NdviStatus } from '../types/ndvi'

const ndviData = dataset as NdviDataset

/** One farm prepared for the interactive GIS map: real centroid + real
 * field-boundary ring (from the per-farm imagery dataset) joined with the
 * latest real NDVI reading. */
export interface GisFarm {
  id: string
  name: string
  nameAr?: string
  ndviValue: number
  status: NdviStatus
  ndvi12moTrendPercent?: number
  lastCaptured: string
  /** [lat, lng] — Leaflet ordering. */
  center: [number, number]
  /** Closed boundary ring in [lat, lng] pairs — Leaflet ordering. */
  ring: [number, number][]
}

function centroidOf(ring: [number, number][]): [number, number] {
  let lat = 0
  let lng = 0
  ring.forEach(([la, ln]) => {
    lat += la
    lng += ln
  })
  return [lat / ring.length, lng / ring.length]
}

function toGisFarm(f: NdviFarm): GisFarm | null {
  if (!hasRealFarmImagery(f.id)) return null
  const imagery = getRealFarmImagery(f.id)
  if (!imagery || imagery.polygon.length < 3) return null
  // Source polygons are [lon, lat]; Leaflet wants [lat, lng].
  const ring = imagery.polygon.map(([lon, lat]) => [lat, lon] as [number, number])
  return {
    id: f.id,
    name: f.name,
    nameAr: f.nameAr,
    ndviValue: f.ndviValue,
    status: f.status,
    ndvi12moTrendPercent: f.ndvi12moTrendPercent,
    lastCaptured: f.lastCaptured,
    center: centroidOf(ring),
    ring,
  }
}

let cache: GisFarm[] | null = null

/** All farms with real boundary + NDVI data, ready for the Leaflet map. */
export function getGisFarms(): GisFarm[] {
  if (!cache) {
    cache = ndviData.farms
      .map(toGisFarm)
      .filter((f): f is GisFarm => f !== null)
  }
  return cache
}

/** Single farm lookup for detail-page maps. */
export function getGisFarm(id: string): GisFarm | undefined {
  return getGisFarms().find((f) => f.id === id)
}
