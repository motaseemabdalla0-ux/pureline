export type NdviTrend = 'up' | 'down' | 'stable'
export type NdviStatus = 'healthy' | 'moderate' | 'degraded'

export interface NdviFarm {
  id: string
  name: string
  /** Optional Arabic transliteration; falls back to `name` when absent. */
  nameAr?: string
  ndviValue: number
  trend: NdviTrend
  trendHistory: number[]
  status: NdviStatus
  lastCaptured: string
}

export interface NdviDataset {
  source: string
  lastUpdated: string
  /** True while the section shows realistic stand-in data (not real portal export). */
  isPlaceholder?: boolean
  farms: NdviFarm[]
}
