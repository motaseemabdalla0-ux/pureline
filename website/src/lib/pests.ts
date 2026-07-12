import type { PestDetectionStatus, PestRiskLevel } from '../types/platform'

export const PEST_RISK_LEVELS: PestRiskLevel[] = ['low', 'medium', 'high', 'critical']

export const PEST_DETECTION_STATUSES: PestDetectionStatus[] = ['active', 'monitoring', 'treated', 'resolved']

/** Distinct color per risk level, shared by badges and charts so the same
 * risk always reads the same color across the module. */
export const pestRiskStyles: Record<PestRiskLevel, string> = {
  low: 'bg-slate-400/15 text-slate-500 dark:text-slate-300',
  medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  high: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  critical: 'bg-red-500/15 text-red-500',
}

export const pestRiskDot: Record<PestRiskLevel, string> = {
  low: 'bg-slate-400',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
}

export const pestRiskChartColor: Record<PestRiskLevel, string> = {
  low: '#94a3b8',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#dc2626',
}

export const pestDetectionStatusStyles: Record<PestDetectionStatus, string> = {
  active: 'bg-red-500/15 text-red-500',
  monitoring: 'bg-accent/15 text-accent',
  treated: 'bg-primary/15 text-primary dark:text-secondary',
  resolved: 'bg-secondary/15 text-secondary',
}
