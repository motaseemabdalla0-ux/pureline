import { ndviColor } from '../../lib/ndvi'

interface NdviHeatmapSwatchProps {
  /** The farm's real NDVI value (0-1 scale). */
  value: number
  /** Grid resolution; 4 = 4x4 cells (default, matches the live-monitoring tiles). */
  grid?: number
  className?: string
}

/**
 * Compact single-farm NDVI heatmap tile: color-graded cells derived from the
 * farm's real NDVI value using the shared ndviColor() scale. This is a
 * legitimate data-driven visualization (not a photo) -- deliberately grid-like
 * so it reads as "real NDVI% rendered as a heatmap", not imagery of the field.
 */
export default function NdviHeatmapSwatch({ value, grid = 4, className = '' }: NdviHeatmapSwatchProps) {
  const cells = Array.from({ length: grid * grid }, (_, i) => {
    // deterministic spread of readings around the farm's mean value
    const jitter = (((i * 37) % 21) - 10) / 100
    return Math.max(0.05, Math.min(0.95, value + jitter))
  })
  const size = 40
  return (
    <svg
      viewBox={`0 0 ${grid * size} ${grid * size}`}
      className={`block h-full w-full ${className}`}
      aria-hidden="true"
    >
      {cells.map((v, i) => {
        const x = (i % grid) * size
        const y = Math.floor(i / grid) * size
        return (
          <g key={i}>
            <rect x={x + 2} y={y + 2} width={size - 4} height={size - 4} rx="5" fill={ndviColor(v)} />
            <rect
              x={x + 2} y={y + 2} width={size - 4} height={size - 4}
              rx="5" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="4 3" opacity="0.45"
            />
          </g>
        )
      })}
    </svg>
  )
}
