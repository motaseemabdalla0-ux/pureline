import {
  Droplets, Warehouse, Crosshair, ScanLine, Satellite, MonitorSmartphone,
  Cpu, ClipboardList, FileSearch, Waves, CloudSun, Sparkles, type LucideIcon,
} from 'lucide-react'
import type { ProjectImageKey } from '../lib/projectImagery'

/** Shared service catalogue: one entry per marketplace service. `key` maps to
 * the `services.items.<key>` translation namespace (title/desc/full content);
 * `slug` is the URL-safe identifier used in routes and API `service_slug`.
 * `heroImage` picks one of the real project photos for the detail-page hero. */
export interface ServiceMeta {
  key: string
  slug: string
  icon: LucideIcon
  heroImage: ProjectImageKey
}

export const SERVICES: ServiceMeta[] = [
  { key: 'irrigation', slug: 'smart-irrigation', icon: Droplets, heroImage: 'proj_irrigation1' },
  { key: 'greenhouse', slug: 'greenhouse-solutions', icon: Warehouse, heroImage: 'proj_greenhouse1' },
  { key: 'precisionAg', slug: 'precision-agriculture', icon: Crosshair, heroImage: 'proj_precision1' },
  { key: 'ndviServices', slug: 'ndvi-monitoring', icon: ScanLine, heroImage: 'proj_satellite1' },
  { key: 'satelliteMonitoring', slug: 'satellite-farm-analysis', icon: Satellite, heroImage: 'proj_satellite2' },
  { key: 'digital', slug: 'farm-management-platform', icon: MonitorSmartphone, heroImage: 'proj_control1' },
  { key: 'smart', slug: 'iot-sensor-installation', icon: Cpu, heroImage: 'proj_precision2' },
  { key: 'consulting', slug: 'agricultural-consultancy', icon: ClipboardList, heroImage: 'proj_control2' },
  { key: 'development', slug: 'feasibility-studies', icon: FileSearch, heroImage: 'proj_infra1' },
  { key: 'farmMapping', slug: 'water-management', icon: Waves, heroImage: 'proj_irrigation2' },
  { key: 'gis', slug: 'climate-monitoring', icon: CloudSun, heroImage: 'proj_infra2' },
  { key: 'remoteSensing', slug: 'custom-agricultural-projects', icon: Sparkles, heroImage: 'proj_greenhouse2' },
]

export function getServiceBySlug(slug: string): ServiceMeta | undefined {
  return SERVICES.find((s) => s.slug === slug)
}

export function getServiceByKey(key: string): ServiceMeta | undefined {
  return SERVICES.find((s) => s.key === key)
}
