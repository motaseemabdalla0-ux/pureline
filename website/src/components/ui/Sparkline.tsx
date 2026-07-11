import { useMemo } from 'react'

interface SparklineProps {
  series: number[]
  color: string
  className?: string
  /** Override stroke width; defaults thinner for long (e.g. 36-point) series. */
  strokeWidth?: number
}

/** Lightweight hand-rolled SVG sparkline, shared across NDVI trend visuals. */
export default function Sparkline({ series, color, className = '', strokeWidth }: SparklineProps) {
  const points = useMemo(() => {
    const max = Math.max(...series)
    const min = Math.min(...series)
    return series
      .map((d, i) => {
        const x = (i / (series.length - 1 || 1)) * 100
        const y = 32 - ((d - min) / (max - min || 1)) * 28 - 2
        return `${x},${y}`
      })
      .join(' ')
  }, [series])

  const width = strokeWidth ?? (series.length > 20 ? 1.4 : 2.5)

  return (
    <svg viewBox="0 0 100 34" className={`h-10 w-full ${className}`} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
