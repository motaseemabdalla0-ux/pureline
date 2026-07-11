import { useTranslation } from 'react-i18next'
import {
  Satellite, Map, CloudSun, Droplet, Gauge, BarChart3, ClipboardCheck,
  Bell, Search, Layers, Leaf, Wind, ArrowRight,
} from 'lucide-react'
import Reveal from '../ui/Reveal'

/* Mini layered satellite tile (compact adaptation of the section-1 map). */
function MiniSat() {
  return (
    <svg viewBox="0 0 200 120" className="block h-full w-full">
      <rect width="200" height="120" fill="#0d4a2d" />
      <rect x="0" y="0" width="100" height="60" fill="#12603a" />
      <rect x="100" y="60" width="100" height="60" fill="#14663d" />
      <path d="M15 12 L80 8 L88 50 L20 56 Z" fill="#3CB371" opacity="0.7" />
      <path d="M110 12 L185 16 L180 52 L115 50 Z" fill="#c9d64a" opacity="0.7" />
      <path d="M20 70 L85 66 L92 108 L26 112 Z" fill="#e0913a" opacity="0.7" />
      <g fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7">
        <path d="M15 12 L80 8 L88 50 L20 56 Z" />
        <path d="M110 12 L185 16 L180 52 L115 50 Z" />
      </g>
      <g fill="none" stroke="#8fe3ff" strokeWidth="1.2" opacity="0.7">
        <circle cx="150" cy="88" r="26" strokeDasharray="3 3" />
        <line x1="150" y1="88" x2="176" y2="88" />
      </g>
    </svg>
  )
}

/* Mini NDVI heatmap grid. */
const miniCells = [
  '#2f9e5c', '#7cc24a', '#d8c53a', '#2f9e5c',
  '#7cc24a', '#e0913a', '#2f9e5c', '#d8c53a',
  '#d15236', '#7cc24a', '#2f9e5c', '#7cc24a',
]
function MiniNdvi() {
  return (
    <div className="grid grid-cols-4 gap-1">
      {miniCells.map((c, i) => (
        <div key={i} className="aspect-square rounded" style={{ backgroundColor: c }} />
      ))}
    </div>
  )
}

function Ring({ value }: { value: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  const offset = c * (1 - value / 100)
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-black/10 dark:text-white/10" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="#3CB371" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
    </svg>
  )
}

function Dashboard() {
  const { t } = useTranslation()
  const nav = [
    { k: 'imagery', icon: Satellite, active: true },
    { k: 'ndvi', icon: Leaf },
    { k: 'weather', icon: CloudSun },
    { k: 'soil', icon: Droplet },
    { k: 'layers', icon: Layers },
    { k: 'reports', icon: BarChart3 },
  ]
  const kpis = [
    { k: 'area', value: '2,340' },
    { k: 'health', value: '87%' },
    { k: 'coverage', value: '98%' },
    { k: 'captures', value: '512' },
  ]
  const recs = [
    { k: 'a', field: 'A-01', sev: 'ok' },
    { k: 'b', field: 'C-02', sev: 'warn' },
    { k: 'c', field: 'D-07', sev: 'ok' },
  ]
  const alerts = [
    { k: 'stress', sev: 'critical' },
    { k: 'moisture', sev: 'warn' },
    { k: 'report', sev: 'info' },
  ]
  const sevDot: Record<string, string> = { critical: 'bg-red-500', warn: 'bg-accent', ok: 'bg-secondary', info: 'bg-primary dark:bg-secondary' }

  return (
    <div className="flex h-[580px] w-full overflow-hidden bg-slate-50 text-[13px] text-slate-700 dark:bg-slate-950 dark:text-slate-200">
      {/* Sidebar */}
      <aside className="hidden w-48 shrink-0 flex-col border-e border-black/5 bg-white p-4 dark:border-white/5 dark:bg-slate-900 sm:flex">
        <div className="flex items-center gap-2 px-2 pb-6">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-black text-white">P</div>
          <span className="font-bold text-slate-900 dark:text-white">PURE LINE</span>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((s) => (
            <button key={s.k} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-start font-medium transition ${s.active ? 'bg-primary/10 text-primary dark:text-secondary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
              <s.icon className="h-4 w-4" /> {t(`satDash.nav.${s.k}`)}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-black/5 bg-white px-5 py-3 dark:border-white/5 dark:bg-slate-900">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{t('satDash.topbar.title')}</h3>
            <p className="text-xs text-slate-400">{t('satDash.topbar.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-slate-400 dark:bg-white/5 md:flex">
              <Search className="h-3.5 w-3.5" /> <span className="text-xs">{t('satDash.topbar.search')}</span>
            </div>
            <Bell className="h-4 w-4 text-slate-400" />
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-secondary to-primary text-xs font-bold text-white">PL</div>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.k} className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-slate-900">
                <div className="text-xs text-slate-400">{t(`satDash.kpi.${k.k}`)}</div>
                <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{k.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Satellite imagery panel */}
            <div className="rounded-xl border border-black/5 bg-white p-4 lg:col-span-2 dark:border-white/5 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Satellite className="h-4 w-4 text-primary dark:text-secondary" />{t('satDash.imagery.title')}</h4>
                <span className="text-[10px] text-slate-400">{t('satDash.imagery.updated')}</span>
              </div>
              <div className="overflow-hidden rounded-lg">
                <MiniSat />
              </div>
            </div>

            {/* Weather */}
            <div className="rounded-xl border border-black/5 bg-gradient-to-br from-primary to-primary-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <h4 className="font-bold">{t('satDash.weather.title')}</h4>
                <CloudSun className="h-5 w-5" />
              </div>
              <div className="mt-2 text-3xl font-black">29°C</div>
              <div className="text-xs text-white/70">{t('satDash.weather.condition')}</div>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><Droplet className="h-3.5 w-3.5" />{t('satDash.weather.humidity')}</span><span>45%</span></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><Wind className="h-3.5 w-3.5" />{t('satDash.weather.wind')}</span><span>11 km/h</span></div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {/* NDVI panel */}
            <div className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-slate-900">
              <h4 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Map className="h-4 w-4 text-primary dark:text-secondary" />{t('satDash.ndvi.title')}</h4>
              <MiniNdvi />
              <div className="mt-3 text-xs text-slate-400">{t('satDash.ndvi.avg')}: <span className="font-bold text-secondary">0.68</span></div>
            </div>

            {/* Soil moisture */}
            <div className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-slate-900">
              <h4 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Gauge className="h-4 w-4 text-primary dark:text-secondary" />{t('satDash.soil.title')}</h4>
              <div className="space-y-3">
                {[['A', 62], ['B', 44], ['C', 78]].map(([n, v]) => (
                  <div key={n as string}>
                    <div className="mb-1 flex justify-between text-xs"><span>{t('satDash.soil.zone')} {n}</span><span>{v}%</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Crop health score */}
            <div className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-slate-900">
              <h4 className="mb-2 font-bold text-slate-900 dark:text-white">{t('satDash.cropHealth.title')}</h4>
              <div className="relative mx-auto grid place-items-center">
                <Ring value={87} />
                <span className="absolute text-lg font-black text-slate-900 dark:text-white">87</span>
              </div>
              <div className="mt-2 text-center text-xs font-semibold text-secondary">{t('satDash.cropHealth.status')}</div>
            </div>

            {/* Irrigation recommendations */}
            <div className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-slate-900">
              <h4 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><ClipboardCheck className="h-4 w-4 text-primary dark:text-secondary" />{t('satDash.recs.title')}</h4>
              <div className="space-y-2">
                {recs.map((r) => (
                  <div key={r.k} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs dark:bg-white/5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${sevDot[r.sev]}`} />
                    <span className="flex-1">{t(`satDash.recs.${r.k}`, { field: r.field })}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 rtl:-scale-x-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-slate-900">
            <h4 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Bell className="h-4 w-4 text-primary dark:text-secondary" />{t('satDash.alerts.title')}</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              {alerts.map((a) => (
                <div key={a.k} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-white/5">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${sevDot[a.sev]}`} />
                  <span>{t(`satDash.alerts.${a.k}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SatelliteDashboard() {
  const { t } = useTranslation()
  return (
    <section id="satellite-dashboard" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-neutral-light dark:bg-white/[0.02]" />
      <div className="container-px">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal><span className="eyebrow">{t('satDash.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h2 className="section-title mt-5">{t('satDash.title')}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('satDash.subtitle')}</p></Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="mx-auto mt-14 max-w-6xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl shadow-primary/10 dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-black/5 bg-slate-100 px-4 py-3 dark:border-white/5 dark:bg-slate-800">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <div className="mx-auto flex items-center gap-2 rounded-md bg-white px-4 py-1 text-xs text-slate-400 dark:bg-slate-900">
                <span className="h-2 w-2 rounded-full bg-secondary" /> {t('satDash.browserUrl')}
              </div>
            </div>
            <Dashboard />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
