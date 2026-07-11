import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import Reveal from '../ui/Reveal'
import { getProjectImagery, PROJECT_IMAGE_BASE_PATH, type ProjectImageKey } from '../../lib/projectImagery'

type Cat = 'satelliteViews' | 'greenhouses' | 'irrigation' | 'infrastructure' | 'precision' | 'controlCenters'
const cats: Cat[] = ['satelliteViews', 'greenhouses', 'irrigation', 'infrastructure', 'precision', 'controlCenters']

/** Each of the 12 project cards maps to one of the 12 real Wikimedia-sourced
 * photos in the projects manifest — used exactly once, two per category. */
const data: { id: string; cat: Cat; image: ProjectImageKey }[] = [
  { id: 'p1', cat: 'satelliteViews', image: 'proj_satellite1' },
  { id: 'p2', cat: 'irrigation', image: 'proj_irrigation1' },
  { id: 'p3', cat: 'greenhouses', image: 'proj_greenhouse1' },
  { id: 'p4', cat: 'infrastructure', image: 'proj_infra1' },
  { id: 'p5', cat: 'controlCenters', image: 'proj_control1' },
  { id: 'p6', cat: 'precision', image: 'proj_precision1' },
  { id: 'p7', cat: 'greenhouses', image: 'proj_greenhouse2' },
  { id: 'p8', cat: 'satelliteViews', image: 'proj_satellite2' },
  { id: 'p9', cat: 'irrigation', image: 'proj_irrigation2' },
  { id: 'p10', cat: 'infrastructure', image: 'proj_infra2' },
  { id: 'p11', cat: 'precision', image: 'proj_precision2' },
  { id: 'p12', cat: 'controlCenters', image: 'proj_control2' },
]

export default function Projects() {
  const { t } = useTranslation()
  const [active, setActive] = useState<'all' | Cat>('all')
  const filtered = useMemo(() => data.filter((d) => active === 'all' || d.cat === active), [active])

  return (
    <section id="projects" className="bg-neutral-light py-24 dark:bg-white/[0.02] sm:py-32">
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('projects.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h2 className="section-title mt-5">{t('projects.title')}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('projects.subtitle')}</p></Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            <FilterBtn active={active === 'all'} onClick={() => setActive('all')}>{t('projects.all')}</FilterBtn>
            {cats.map((c) => (
              <FilterBtn key={c} active={active === c} onClick={() => setActive(c)}>{t(`projects.categories.${c}`)}</FilterBtn>
            ))}
          </div>
        </Reveal>

        <motion.div layout className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => {
              const imagery = getProjectImagery(p.image)
              const sortedVariants = imagery ? [...imagery.variants].sort((a, b) => a.width - b.width) : []
              const largest = sortedVariants[sortedVariants.length - 1]
              const srcSet = sortedVariants.map((v) => `${PROJECT_IMAGE_BASE_PATH}${v.file} ${v.width}w`).join(', ')
              const isFirst = i === 0

              return (
                <motion.div key={p.id} layout
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35 }}
                  className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl bg-neutral-dark">
                  {imagery && largest && (
                    <img
                      src={`${PROJECT_IMAGE_BASE_PATH}${largest.file}`}
                      srcSet={srcSet}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      alt={imagery.title}
                      loading={isFirst ? 'eager' : 'lazy'}
                      decoding={isFirst ? 'sync' : 'async'}
                      fetchPriority={isFirst ? 'high' : 'auto'}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/50" />
                  <div className="absolute inset-x-0 bottom-0 translate-y-2 p-6 opacity-90 transition group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/70">{t(`projects.categories.${p.cat}`)}</span>
                    <h3 className="mt-1 text-lg font-bold text-white">{t(`projects.items.${p.id}`)}</h3>
                    {imagery?.credit && (
                      <p className="mt-1 text-[10px] text-white/60 opacity-0 transition group-hover:opacity-100">
                        {t('projects.photoCredit', { credit: imagery.credit })}
                      </p>
                    )}
                  </div>
                  <ArrowUpRight className="absolute right-5 top-5 h-6 w-6 text-white opacity-0 transition group-hover:opacity-100 rtl:-scale-x-100" />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition ${active ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white text-neutral-dark/70 hover:bg-primary/10 dark:bg-white/5 dark:text-neutral-light/70'}`}>
      {children}
    </button>
  )
}
