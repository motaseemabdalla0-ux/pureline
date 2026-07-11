import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Leaf, AlertTriangle, Droplets, Activity, TrendingUp, Map,
  Camera, Cpu, LineChart, BellRing, CheckCircle2,
} from 'lucide-react'
import Reveal from '../ui/Reveal'

const features = [
  { key: 'ndvi', icon: Leaf },
  { key: 'stress', icon: AlertTriangle },
  { key: 'irrigation', icon: Droplets },
  { key: 'vegetation', icon: Activity },
  { key: 'yield', icon: TrendingUp },
  { key: 'mapping', icon: Map },
]

const workflow = [
  { key: 'capture', icon: Camera },
  { key: 'process', icon: Cpu },
  { key: 'analyze', icon: LineChart },
  { key: 'alert', icon: BellRing },
  { key: 'act', icon: CheckCircle2 },
]

/* Layered "satellite imagery" built purely from SVG — aerial farm base,
   field-boundary polygons, center-pivot irrigation, crop-health overlay. */
function SatelliteMap() {
  const { t } = useTranslation()
  return (
    <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-slate-900 shadow-2xl shadow-primary/20 dark:border-white/10">
      <svg viewBox="0 0 700 460" className="block w-full" role="img" aria-label={t('satIntel.map.aria')}>
        {/* aerial base — parceled fields */}
        <rect width="700" height="460" fill="#0a3d24" />
        <rect x="0" y="0" width="350" height="230" fill="#12603a" />
        <rect x="350" y="0" width="350" height="230" fill="#0f5233" />
        <rect x="0" y="230" width="350" height="230" fill="#0d4a2d" />
        <rect x="350" y="230" width="350" height="230" fill="#14663d" />

        {/* soil / crop texture rows */}
        <g opacity="0.18">
          {Array.from({ length: 22 }).map((_, i) => (
            <line key={i} x1={i * 32} y1="0" x2={i * 32} y2="460" stroke="#fff" strokeWidth="1" />
          ))}
        </g>

        {/* crop-health color-graded patches */}
        <g opacity="0.55">
          <path d="M40 40 L200 30 L230 150 L60 175 Z" fill="#3CB371" />
          <path d="M240 40 L330 60 L310 160 L245 150 Z" fill="#c9d64a" />
          <path d="M400 40 L620 55 L600 150 L410 160 Z" fill="#3CB371" />
          <path d="M420 175 L560 160 L580 220 L430 225 Z" fill="#e0b23a" />
          <path d="M60 260 L210 250 L240 400 L80 420 Z" fill="#c9d64a" />
          <path d="M120 300 L200 295 L215 380 L135 400 Z" fill="#d9663a" />
          <path d="M420 260 L640 270 L620 420 L440 410 Z" fill="#3CB371" />
        </g>

        {/* field-boundary dashed polygons */}
        <g fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="7 6" opacity="0.85">
          <path d="M40 40 L200 30 L230 150 L60 175 Z" />
          <path d="M400 40 L620 55 L600 150 L410 160 Z" />
          <path d="M60 260 L210 250 L240 400 L80 420 Z" />
          <path d="M420 260 L640 270 L620 420 L440 410 Z" />
        </g>

        {/* center-pivot irrigation circles */}
        <g fill="none" stroke="#8fe3ff" strokeWidth="2" opacity="0.8">
          <circle cx="300" cy="330" r="78" strokeDasharray="4 5" />
          <circle cx="300" cy="330" r="52" strokeDasharray="4 5" opacity="0.6" />
          <circle cx="300" cy="330" r="26" strokeDasharray="4 5" opacity="0.4" />
          <line x1="300" y1="330" x2="378" y2="330" strokeWidth="2.5" />
        </g>

        {/* drip / irrigation network lines */}
        <g stroke="#8fe3ff" strokeWidth="1.6" opacity="0.5">
          <line x1="410" y1="90" x2="600" y2="100" />
          <line x1="410" y1="115" x2="600" y2="125" />
          <line x1="470" y1="60" x2="470" y2="150" strokeDasharray="3 4" />
          <line x1="540" y1="60" x2="540" y2="150" strokeDasharray="3 4" />
        </g>

        {/* sensor markers */}
        <g>
          {[[130, 100], [500, 95], [150, 330], [530, 340]].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="6" fill="#D4AF37" />
              <circle cx={cx} cy={cy} r="11" fill="none" stroke="#D4AF37" strokeWidth="1.5" opacity="0.6" />
            </g>
          ))}
        </g>

        {/* field labels */}
        <g fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700" fill="#ffffff">
          <text x="60" y="60">A-01</text>
          <text x="420" y="60">B-04</text>
          <text x="80" y="285">C-02</text>
          <text x="450" y="290">D-07</text>
        </g>
      </svg>

      {/* HUD overlays */}
      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-black/50 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
        <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" /> {t('satIntel.map.live')}
      </div>
      <div className="pointer-events-none absolute right-4 top-4 rounded-lg bg-black/50 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
        {t('satIntel.map.resolution')}
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg bg-black/50 px-3 py-1.5 text-[11px] text-white backdrop-blur">
        {t('satIntel.map.ndvi')}: <span className="font-bold text-secondary">0.71</span>
      </div>
    </div>
  )
}

export default function SatelliteIntelligence() {
  const { t } = useTranslation()
  return (
    <section id="satellite" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-mesh-green opacity-30" />
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('satIntel.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h2 className="section-title mt-5">{t('satIntel.title')}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('satIntel.subtitle')}</p></Reveal>
        </div>

        {/* Map centerpiece + feature cards */}
        <div className="mt-16 grid items-start gap-8 lg:grid-cols-2">
          <Reveal><SatelliteMap /></Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {features.map((f, i) => (
              <Reveal key={f.key} delay={i * 0.05}>
                <motion.div whileHover={{ y: -6 }} className="group h-full rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl dark:border-white/10 dark:bg-white/5">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-secondary to-primary text-white shadow-lg shadow-primary/25">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-bold">{t(`satIntel.features.${f.key}.title`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-dark/60 dark:text-neutral-light/60">{t(`satIntel.features.${f.key}.desc`)}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Workflow */}
        <div className="mt-20">
          <Reveal><h3 className="text-center text-2xl font-bold">{t('satIntel.workflow.title')}</h3></Reveal>
          <div className="relative mt-12 grid gap-8 md:grid-cols-5">
            {/* connecting line (horizontal on desktop) */}
            <div className="absolute left-0 right-0 top-8 hidden h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />
            {workflow.map((s, i) => (
              <Reveal key={s.key} delay={i * 0.08} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-white text-primary shadow-lg shadow-primary/15 ring-1 ring-primary/15 dark:bg-slate-900 dark:text-secondary dark:ring-white/10">
                    <s.icon className="h-6 w-6" />
                    <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">{i + 1}</span>
                  </div>
                  <h4 className="mt-4 font-bold">{t(`satIntel.workflow.steps.${s.key}.title`)}</h4>
                  <p className="mt-1.5 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t(`satIntel.workflow.steps.${s.key}.desc`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
