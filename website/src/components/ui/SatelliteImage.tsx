import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import manifest from '../../../public/images/satellite/processed/manifest.json'

/** Shape of each entry in the real-satellite-imagery manifest (NASA GIBS). */
interface SatelliteManifestEntry {
  label: string
  acquired: string
  source: string
  variants: { width: number; file: string }[]
  dark: string
}

const satelliteManifest = manifest as Record<string, SatelliteManifestEntry>
const BASE_PATH = '/images/satellite/processed/'

export type SatelliteImageSource = keyof typeof satelliteManifest

/** Real-imagery override: bypasses the NASA GIBS manifest lookup entirely,
 * used for the 6 known farms with real high-resolution Esri crops. */
export interface RealImageSource {
  variants: { width: number; file: string }[]
  /** Base path (relative to /public) the variant files live under. */
  basePath: string
  /** Pre-composed attribution label shown in the corner badge. */
  attribution: string
}

interface SatelliteImageProps {
  /** Key into the NASA GIBS imagery manifest, e.g. "alula_valley". Ignored when `real` is set. */
  source?: string
  /** Real high-resolution imagery (e.g. Esri World Imagery per-farm crop), overrides `source`. */
  real?: RealImageSource
  /** "dark" uses the pre-graded background variant intended for text overlays (NASA-manifest only). */
  variant?: 'light' | 'dark'
  alt: string
  className?: string
  /** Extra classes applied to the underlying <img>. */
  imgClassName?: string
  /** Renders a small corner badge with the real acquisition date + source attribution. */
  showAttribution?: boolean
  /** Eager-loads above-the-fold imagery (e.g. hero); otherwise lazy. */
  priority?: boolean
  /** Optional overlay content (e.g. <FieldBoundary />) absolutely positioned above the image. */
  children?: ReactNode
}

/**
 * Reusable real-satellite-imagery component. Renders responsive WebP variants
 * (srcSet/sizes) sourced either from NASA GIBS VIIRS regional captures of the
 * AlUla region, or — when `real` is provided — from real high-resolution
 * per-farm Esri World Imagery crops, with an optional attribution badge.
 */
export default function SatelliteImage({
  source,
  real,
  variant = 'light',
  alt,
  className = '',
  imgClassName = '',
  showAttribution = true,
  priority = false,
  children,
}: SatelliteImageProps) {
  const { t, i18n } = useTranslation()
  const entry = !real && source ? satelliteManifest[source] : undefined

  if (!real && !entry) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`SatelliteImage: unknown source "${source}"`)
    }
    return null
  }

  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en'

  let src: string
  let srcSet: string | undefined
  let sizes: string | undefined
  let attributionLabel: string

  if (real) {
    const sortedVariants = [...real.variants].sort((a, b) => a.width - b.width)
    const largest = sortedVariants[sortedVariants.length - 1] ?? sortedVariants[0]
    srcSet = sortedVariants.map((v) => `${real.basePath}${v.file} ${v.width}w`).join(', ')
    sizes = '(min-width: 1280px) 1200px, (min-width: 768px) 800px, 100vw'
    src = `${real.basePath}${largest.file}`
    attributionLabel = real.attribution
  } else {
    const e = entry as SatelliteManifestEntry
    const sortedVariants = [...e.variants].sort((a, b) => a.width - b.width)
    const largest = sortedVariants[sortedVariants.length - 1] ?? sortedVariants[0]
    srcSet = variant === 'dark' ? undefined : sortedVariants.map((v) => `${BASE_PATH}${v.file} ${v.width}w`).join(', ')
    sizes = variant === 'dark' ? undefined : '(min-width: 1280px) 1200px, (min-width: 768px) 800px, 100vw'
    src = variant === 'dark' ? `${BASE_PATH}${e.dark}` : `${BASE_PATH}${largest.file}`
    const acquiredDate = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(new Date(e.acquired))
    attributionLabel = `${t('satelliteImage.source')} · ${acquiredDate}`
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={`h-full w-full object-cover ${imgClassName}`}
      />
      {children}
      {showAttribution && (
        <div className="pointer-events-none absolute bottom-2 end-2 flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] leading-none text-white/90 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
          <span>{attributionLabel}</span>
        </div>
      )}
    </div>
  )
}
