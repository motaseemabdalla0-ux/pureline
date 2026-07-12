import type { OperationStatus, OperationType } from '../types/platform'

export const OPERATION_STATUSES: OperationStatus[] = ['planned', 'assigned', 'in_progress', 'completed', 'delayed', 'cancelled']

export const OPERATION_TYPES: OperationType[] = [
  'irrigation', 'fertilization', 'pest_control', 'harvest', 'pruning', 'pollination', 'soil_sampling', 'drone_survey', 'maintenance',
]

/** Distinct color per operation status, shared by badges, charts and alerts
 * so the same status always reads the same color across every module. */
export const operationStatusStyles: Record<OperationStatus, string> = {
  planned: 'bg-slate-400/15 text-slate-500 dark:text-slate-300',
  assigned: 'bg-accent/15 text-accent',
  in_progress: 'bg-primary/15 text-primary dark:text-secondary',
  completed: 'bg-secondary/15 text-secondary',
  delayed: 'bg-red-500/15 text-red-500',
  cancelled: 'bg-black/10 text-neutral-dark/50 dark:bg-white/10 dark:text-neutral-light/50',
}

export const operationStatusDot: Record<OperationStatus, string> = {
  planned: 'bg-slate-400',
  assigned: 'bg-accent',
  in_progress: 'bg-primary',
  completed: 'bg-secondary',
  delayed: 'bg-red-500',
  cancelled: 'bg-neutral-gray',
}

export const operationStatusChartColor: Record<OperationStatus, string> = {
  planned: '#94a3b8',
  assigned: '#D4AF37',
  in_progress: '#0F6B3A',
  completed: '#3CB371',
  delayed: '#dc2626',
  cancelled: '#8A9691',
}
