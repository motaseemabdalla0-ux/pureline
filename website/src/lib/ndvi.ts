import type { NdviStatus, NdviTrend } from '../types/ndvi'

/**
 * NDVI color scale: red (low) -> yellow (moderate) -> green (healthy).
 * Calibrated to AlUla's real arid-farm NDVI band (RCU portal readings run
 * roughly 8%-28%, well below generic cropland NDVI). Shared by every
 * NDVI-driven visual so farm cards, widgets and charts agree on color.
 */
export function ndviColor(v: number): string {
  if (v >= 0.22) return '#2f9e5c'
  if (v >= 0.15) return '#7cc24a'
  if (v >= 0.10) return '#d8c53a'
  if (v >= 0.07) return '#e0913a'
  return '#d15236'
}

export const ndviStatusStyles: Record<NdviStatus, string> = {
  healthy: 'bg-secondary/15 text-primary dark:text-secondary',
  moderate: 'bg-accent/15 text-accent',
  degraded: 'bg-red-500/15 text-red-500',
}

export const ndviTrendStyles: Record<NdviTrend, string> = {
  up: 'text-secondary',
  down: 'text-red-500',
  stable: 'text-neutral-dark/50 dark:text-neutral-light/50',
}

/** Deterministic mapping from a farm id to one of the real regional satellite
 * images, so farm cards cycle through imagery instead of repeating one shot. */
const REGIONAL_SOURCES = ['alula_valley', 'alula_north', 'alula_south', 'hijaz_region'] as const

export function regionalSourceForFarm(id: string): string {
  const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return REGIONAL_SOURCES[seed % REGIONAL_SOURCES.length]
}
