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

interface SatelliteImageProps {
  /** Key into the imagery manifest, e.g. "alula_valley". */
  source: string
  /** "dark" uses the pre-graded background variant intended for text overlays. */
  variant?: 'light' | 'dark'
  alt: string
  className?: string
  /** Extra classes applied to the underlying <img>. */
  imgClassName?: string
  /** Renders a small corner badge with the real acquisition date + source attribution. */
  showAttribution?: boolean
  /** Eager-loads above-the-fold imagery (e.g. hero); otherwise lazy. */
  priority?: boolean
}

/**
 * Reusable real-satellite-imagery component. Renders responsive WebP variants
 * (srcSet/sizes) sourced from NASA GIBS VIIRS captures of the AlUla region,
 * with an optional attribution badge showing the genuine acquisition date.
 */
export default function SatelliteImage({
  source,
  variant = 'light',
  alt,
  className = '',
  imgClassName = '',
  showAttribution = true,
  priority = false,
}: SatelliteImageProps) {
  const { t, i18n } = useTranslation()
  const entry = satelliteManifest[source]

  if (!entry) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`SatelliteImage: unknown source "${source}"`)
    }
    return null
  }

  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const sortedVariants = [...entry.variants].sort((a, b) => a.width - b.width)
  const largest = sortedVariants[sortedVariants.length - 1] ?? sortedVariants[0]
  const srcSet = sortedVariants.map((v) => `${BASE_PATH}${v.file} ${v.width}w`).join(', ')
  const sizes = '(min-width: 1280px) 1200px, (min-width: 768px) 800px, 100vw'
  const src = variant === 'dark' ? `${BASE_PATH}${entry.dark}` : `${BASE_PATH}${largest.file}`

  const acquiredDate = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(entry.acquired))

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        srcSet={variant === 'dark' ? undefined : srcSet}
        sizes={variant === 'dark' ? undefined : sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={`h-full w-full object-cover ${imgClassName}`}
      />
      {showAttribution && (
        <div className="pointer-events-none absolute bottom-2 end-2 flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] leading-none text-white/90 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
          <span>{t('satelliteImage.source')} · {acquiredDate}</span>
        </div>
      )}
    </div>
  )
}
