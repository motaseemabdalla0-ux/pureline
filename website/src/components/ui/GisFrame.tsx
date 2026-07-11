import type { ReactNode } from 'react'

interface GisFrameProps {
  children: ReactNode
  className?: string
  /** Adds a subtle animated scanline overlay (GPU-cheap, respects reduced-motion). */
  scanline?: boolean
  /** Renders monospace crosshair-style corner brackets. */
  corners?: boolean
}

const cornerBase = 'pointer-events-none absolute h-3.5 w-3.5 border-secondary/80 dark:border-secondary/70 z-[2]'

/**
 * GIS-dashboard chrome wrapper: dark panel background, corner brackets, and an
 * optional scanline overlay. Wrap satellite imagery / data panels in this to
 * apply the "modern GIS dashboard" visual language consistently.
 */
export default function GisFrame({ children, className = '', scanline = false, corners = true }: GisFrameProps) {
  return (
    <div className={`gis-panel ${className}`}>
      {corners && (
        <>
          <span className={`${cornerBase} start-2 top-2 border-s-2 border-t-2`} aria-hidden="true" />
          <span className={`${cornerBase} end-2 top-2 border-e-2 border-t-2`} aria-hidden="true" />
          <span className={`${cornerBase} start-2 bottom-2 border-s-2 border-b-2`} aria-hidden="true" />
          <span className={`${cornerBase} end-2 bottom-2 border-e-2 border-b-2`} aria-hidden="true" />
        </>
      )}
      {scanline && <div className="gis-scanline" aria-hidden="true" />}
      <div className="relative z-[1] h-full">{children}</div>
    </div>
  )
}
