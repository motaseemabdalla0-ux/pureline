import type { IrrigationEquipment, IrrigationEventStatus, IrrigationZoneStatus } from '../types/platform'

export const IRRIGATION_EQUIPMENT_TYPES: IrrigationEquipment[] = ['drip', 'sprinkler', 'flood']

export const IRRIGATION_ZONE_STATUSES: IrrigationZoneStatus[] = ['active', 'maintenance', 'offline']

export const IRRIGATION_EVENT_STATUSES: IrrigationEventStatus[] = ['scheduled', 'in_progress', 'completed', 'skipped']

/** Distinct color per zone status, shared by badges and chips so the same
 * status always reads the same color across the module. */
export const irrigationZoneStatusStyles: Record<IrrigationZoneStatus, string> = {
  active: 'bg-secondary/15 text-secondary',
  maintenance: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  offline: 'bg-black/10 text-neutral-dark/50 dark:bg-white/10 dark:text-neutral-light/50',
}

export const irrigationZoneStatusDot: Record<IrrigationZoneStatus, string> = {
  active: 'bg-secondary',
  maintenance: 'bg-amber-500',
  offline: 'bg-neutral-gray',
}

export const irrigationEventStatusStyles: Record<IrrigationEventStatus, string> = {
  scheduled: 'bg-accent/15 text-accent',
  in_progress: 'bg-primary/15 text-primary dark:text-secondary',
  completed: 'bg-secondary/15 text-secondary',
  skipped: 'bg-black/10 text-neutral-dark/50 dark:bg-white/10 dark:text-neutral-light/50',
}

export const irrigationEventStatusDot: Record<IrrigationEventStatus, string> = {
  scheduled: 'bg-accent',
  in_progress: 'bg-primary',
  completed: 'bg-secondary',
  skipped: 'bg-neutral-gray',
}
