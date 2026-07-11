import manifest from '../../public/images/satellite/processed/projects/manifest.json'

interface ProjectManifestVariant {
  width: number
  file: string
}

interface ProjectManifestEntry {
  title: string
  credit: string
  variants: ProjectManifestVariant[]
}

const projectManifest = manifest as Record<string, ProjectManifestEntry>

/** Base path (relative to /public) for the real project-photo WebP variants. */
export const PROJECT_IMAGE_BASE_PATH = '/images/satellite/processed/projects/'

export type ProjectImageKey = keyof typeof projectManifest

export interface ProjectImagery {
  title: string
  credit: string
  variants: ProjectManifestVariant[]
}

/** Looks up a real Wikimedia-sourced project photo by its manifest key. */
export function getProjectImagery(key: string): ProjectImagery | null {
  const entry = projectManifest[key]
  if (!entry) return null
  return { title: entry.title, credit: entry.credit, variants: entry.variants }
}
