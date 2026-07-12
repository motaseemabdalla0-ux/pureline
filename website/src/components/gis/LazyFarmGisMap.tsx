import { Suspense, lazy } from 'react'
import { Loader2 } from 'lucide-react'
import type { FarmGisMapProps } from './FarmGisMap'

const FarmGisMap = lazy(() => import('./FarmGisMap'))

/** Code-split wrapper so Leaflet (~150 kB) only loads on pages that render a map. */
export default function LazyFarmGisMap(props: FarmGisMapProps) {
  return (
    <Suspense
      fallback={
        <div
          className={`flex items-center justify-center rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5 ${props.className ?? ''}`}
          style={{ height: props.height ?? '420px' }}
        >
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      }
    >
      <FarmGisMap {...props} />
    </Suspense>
  )
}
