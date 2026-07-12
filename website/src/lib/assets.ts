import type { AssetCategory, AssetStatus } from '../types/platform'

export const ASSET_CATEGORIES: AssetCategory[] = [
  'pump', 'sensor', 'irrigation_equipment', 'vehicle', 'drone', 'monitoring_device',
]

export const ASSET_STATUSES: AssetStatus[] = ['operational', 'maintenance', 'offline', 'retired']

/** Distinct color per asset status, shared by badges and chips so the same
 * status always reads the same color across the module. */
export const assetStatusStyles: Record<AssetStatus, string> = {
  operational: 'bg-secondary/15 text-secondary',
  maintenance: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  offline: 'bg-black/10 text-neutral-dark/50 dark:bg-white/10 dark:text-neutral-light/50',
  retired: 'bg-red-500/15 text-red-500',
}

export const assetStatusDot: Record<AssetStatus, string> = {
  operational: 'bg-secondary',
  maintenance: 'bg-amber-500',
  offline: 'bg-neutral-gray',
  retired: 'bg-red-500',
}
