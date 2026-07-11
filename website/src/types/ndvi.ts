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
  /** Real NDVI value 12 months before the latest reading (values[len-13]). */
  previousNdvi?: number
  /** % change from previousNdvi to ndviValue (12-month trend). */
  ndvi12moTrendPercent?: number
  /** % change over the full real 36-month series (Q4'23 avg -> Q4'25 avg). */
  ndvi36moTrendPercent?: number
  /** Set (positive magnitude) when ndvi36moTrendPercent is positive. */
  improvementPercent?: number
  /** Set (positive magnitude) when ndvi36moTrendPercent is negative. */
  degradationPercent?: number
}

export interface NdviDataset {
  source: string
  lastUpdated: string
  /** True while the section shows realistic stand-in data (not real portal export). */
  isPlaceholder?: boolean
  farms: NdviFarm[]
}
