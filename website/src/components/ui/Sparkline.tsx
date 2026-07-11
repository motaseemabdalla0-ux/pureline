interface SparklineProps {
  series: number[]
  color: string
  className?: string
}

/** Lightweight hand-rolled SVG sparkline, shared across NDVI trend visuals. */
export default function Sparkline({ series, color, className = '' }: SparklineProps) {
  const max = Math.max(...series)
  const min = Math.min(...series)
  const pts = series
    .map((d, i) => {
      const x = (i / (series.length - 1 || 1)) * 100
      const y = 32 - ((d - min) / (max - min || 1)) * 28 - 2
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg viewBox="0 0 100 34" className={`h-10 w-full ${className}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
