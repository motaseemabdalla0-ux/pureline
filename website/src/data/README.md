# NDVI farm data (`ndvi-farms.json`)

This file powers the **Live NDVI Monitoring** section
(`src/components/sections/LiveNDVIMonitoring.tsx`). It is imported directly as
an ES module (Vite native JSON import, no fetch) and typed via
`src/types/ndvi.ts` (`NdviDataset` / `NdviFarm`).

## Current state: REAL data (RCU NDVI Analysis Portal)

`"isPlaceholder": false`. The 5 farms were selected and extracted directly from
the RCU NDVI Analysis Portal (agriculture.rcu.gov.sa/portals/ndvi-analysis) via
browser automation after the user logged in, covering two regions (Al Udhayb,
Khaybar) and a representative spread of portal-classified trends (Minor/Moderate
Evolution, Minor/Major Decay). `ndviValue`/`trendHistory` are the portal's Q4
NDVI% readings (Q4'23 → Q4'25) converted to a 0–1 decimal; `status` is mapped
from the portal's own evolution/decay classification (Evolution → healthy,
Minor Decay → moderate, Major Decay → degraded). The portal did not expose a
full quarterly time series or downloadable image assets in the UI, so
`trendHistory` is a smooth interpolation between the two portal-reported
endpoints (Q4'23 and Q4'25), and satellite/NDVI thumbnails remain the
component's generated SVG visualizations rather than embedded portal images.
The color scale in `LiveNDVIMonitoring.tsx` was recalibrated to this dataset's
real 8%–28% NDVI band (AlUla arid farms run much lower than generic cropland
NDVI).

## Replacing with a refreshed export

1. Open `src/data/ndvi-farms.json`.
2. Overwrite the contents with the real portal export, **keeping the exact same
   shape** (see `NdviDataset` in `src/types/ndvi.ts`):
   - root: `source`, `lastUpdated`, `isPlaceholder`, `farms[]`
   - each farm: `id`, `name`, optional `nameAr`, `ndviValue` (0–1), `trend`
     (`"up"` | `"down"` | `"stable"`), `trendHistory` (array of NDVI readings,
     last value should equal `ndviValue`), `status`
     (`"healthy"` | `"moderate"` | `"degraded"`), `lastCaptured` (ISO date).
3. Set `"isPlaceholder": false` (or remove the field) once real data is in.
4. Update `lastUpdated` to the export timestamp.

**No component code changes are required.** The section reads everything from
this JSON file — farm count, values, colors, sparklines and badges all derive
from it automatically.
