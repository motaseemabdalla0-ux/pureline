# NDVI farm data (`ndvi-farms.json`)

This file powers the **Live NDVI Monitoring** section
(`src/components/sections/LiveNDVIMonitoring.tsx`). It is imported directly as
an ES module (Vite native JSON import, no fetch) and typed via
`src/types/ndvi.ts` (`NdviDataset` / `NdviFarm`).

## Current state: PLACEHOLDER data

`"isPlaceholder": true` is set on the root object. The 5 farms currently listed
contain **realistic stand-in values**, not real readings. They exist only so the
section renders correctly while the real data is being exported from the
**RCU NDVI Analysis Portal**.

## Replacing with real data

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
