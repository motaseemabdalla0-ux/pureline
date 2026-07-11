interface FieldBoundaryProps {
  /** Real, closed field-boundary polygon ring in [lon, lat] pairs. */
  polygon: [number, number][]
  /** [west, south, east, north] — the exact geographic extent the underlying image covers. */
  bbox: [number, number, number, number]
  className?: string
}

/**
 * Renders a farm's real field-boundary polygon as a GIS-style dashed outline
 * positioned precisely over its satellite image, using percentage-space
 * projection from the image's real bbox. Purely geometric — no placeholder
 * shapes, no fabricated coordinates.
 */
export default function FieldBoundary({ polygon, bbox, className = '' }: FieldBoundaryProps) {
  const [west, south, east, north] = bbox
  const lonSpan = east - west || 1
  const latSpan = north - south || 1

  const points = polygon
    .map(([lon, lat]) => {
      const x = ((lon - west) / lonSpan) * 100
      const y = ((north - lat) / latSpan) * 100
      return `${x.toFixed(3)},${y.toFixed(3)}`
    })
    .join(' ')

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-0 z-[1] h-full w-full ${className}`}
      aria-hidden="true"
    >
      <polygon
        points={points}
        fill="rgba(255,255,255,0.10)"
        stroke="#ffffff"
        strokeWidth="0.7"
        strokeDasharray="1.8 1.4"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        points={points}
        fill="none"
        stroke="#7cc24a"
        strokeOpacity="0.7"
        strokeWidth="0.35"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
