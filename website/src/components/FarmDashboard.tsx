import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Activity, Droplets, Satellite, LineChart, Radio, FileText,
  TrendingUp, CloudSun, Wind, Droplet, Bell, Search, Bell as BellIcon,
} from 'lucide-react'

/* Self-contained enterprise SaaS dashboard MOCKUP. Dark-mode aware via Tailwind classes.
   Pure SVG/CSS charts — no charting dependency. */
export default function FarmDashboard() {
  const { t } = useTranslation()
  const sidebar = [
    { k: 'overview', icon: LayoutDashboard, active: true },
    { k: 'monitoring', icon: Activity },
    { k: 'irrigation', icon: Droplets },
    { k: 'satellite', icon: Satellite },
    { k: 'analytics', icon: LineChart },
    { k: 'sensors', icon: Radio },
    { k: 'reports', icon: FileText },
  ]
  const kpis = [
    { k: 'yield', value: '128t', delta: '+12%', icon: TrendingUp },
    { k: 'water', value: '34%', delta: '+8%', icon: Droplet },
    { k: 'uptime', value: '99.9%', delta: 'stable', icon: Activity },
    { k: 'alerts', value: '3', delta: '-2', icon: Bell },
  ]
  const fields = [
    { n: 'A-01', status: 'healthy', pct: 92 },
    { n: 'A-02', status: 'attention', pct: 68 },
    { n: 'B-03', status: 'healthy', pct: 88 },
    { n: 'C-07', status: 'critical', pct: 41 },
  ]
  const zones = [
    { n: 1, state: 'ON' }, { n: 2, state: 'AUTO' }, { n: 3, state: 'OFF' }, { n: 4, state: 'AUTO' },
  ]
  const chart = [42, 55, 48, 63, 70, 66, 82, 78, 90]
  const sensors = [
    { id: 'SOIL-14', loc: 'Field A-01', val: '38% RH', st: 'ok' },
    { id: 'TEMP-07', loc: 'Greenhouse 2', val: '24.5°C', st: 'ok' },
    { id: 'FLOW-03', loc: 'Zone 2', val: '12 L/min', st: 'warn' },
    { id: 'PH-09', loc: 'Field B-03', val: '6.8 pH', st: 'ok' },
  ]
  const reports = ['Weekly Yield Report', 'Water Usage Q2', 'Soil Health Audit', 'Satellite NDVI Summary']

  const statusColor: Record<string, string> = {
    healthy: 'text-secondary', attention: 'text-accent', critical: 'text-red-500',
  }
  const dotColor: Record<string, string> = {
    healthy: 'bg-secondary', attention: 'bg-accent', critical: 'bg-red-500',
  }

  return (
    <div className="flex h-[560px] w-full overflow-hidden bg-slate-50 text-[13px] text-slate-700 dark:bg-slate-950 dark:text-slate-200">
      {/* Sidebar */}
      <aside className="hidden w-52 shrink-0 flex-col border-e border-black/5 bg-white p-4 dark:border-white/5 dark:bg-slate-900 sm:flex">
        <div className="flex items-center gap-2 px-2 pb-6">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white font-black">P</div>
          <span className="font-bold text-slate-900 dark:text-white">PURE LINE</span>
        </div>
        <nav className="flex flex-col gap-1">
          {sidebar.map((s) => (
            <button key={s.k} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-start font-medium transition ${s.active ? 'bg-primary/10 text-primary dark:text-secondary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
              <s.icon className="h-4 w-4" /> {t(`platform.sidebar.${s.k}`)}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-black/5 bg-white px-5 py-3 dark:border-white/5 dark:bg-slate-900">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{t('platform.topbar.greeting')}</h3>
            <p className="text-xs text-slate-400">{t('platform.topbar.season')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-slate-400 dark:bg-white/5 md:flex">
              <Search className="h-3.5 w-3.5" /> <span className="text-xs">Search…</span>
            </div>
            <BellIcon className="h-4 w-4 text-slate-400" />
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-secondary to-primary text-xs font-bold text-white">PL</div>
          </div>
        </header>

        {/* Scroll area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((kp) => (
              <div key={kp.k} className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{t(`platform.kpi.${kp.k}`)}</span>
                  <kp.icon className="h-4 w-4 text-primary dark:text-secondary" />
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{kp.value}</div>
                <div className="text-xs font-semibold text-secondary">{kp.delta}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Crop Analytics chart */}
            <div className="rounded-xl border border-black/5 bg-white p-4 lg:col-span-2 dark:border-white/5 dark:bg-slate-900">
              <div className="mb-4 flex items-baseline justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white">{t('platform.cropChart.title')}</h4>
                <span className="text-xs text-slate-400">{t('platform.cropChart.subtitle')}</span>
              </div>
              <div className="flex h-40 items-end gap-2">
                {chart.map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-gradient-to-t from-primary to-secondary transition-all" style={{ height: `${v}%` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Weather widget */}
            <div className="rounded-xl border border-black/5 bg-gradient-to-br from-primary to-primary-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <h4 className="font-bold">{t('platform.weather.title')}</h4>
                <CloudSun className="h-5 w-5" />
              </div>
              <div className="mt-3 text-4xl font-black">31°C</div>
              <div className="text-xs text-white/70">{t('platform.weather.condition')}</div>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><Droplet className="h-3.5 w-3.5" />{t('platform.weather.humidity')}</span><span>42%</span></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><Wind className="h-3.5 w-3.5" />{t('platform.weather.wind')}</span><span>14 km/h</span></div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Farm Monitoring */}
            <div className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-slate-900">
              <h4 className="mb-3 font-bold text-slate-900 dark:text-white">{t('platform.monitoring.title')}</h4>
              <div className="space-y-3">
                {fields.map((f) => (
                  <div key={f.n}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${dotColor[f.status]}`} />{t('platform.monitoring.field')} {f.n}</span>
                      <span className={statusColor[f.status]}>{t(`platform.monitoring.${f.status}`)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div className={`h-full rounded-full ${dotColor[f.status]}`} style={{ width: `${f.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Irrigation Control */}
            <div className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-slate-900">
              <h4 className="mb-3 font-bold text-slate-900 dark:text-white">{t('platform.irrigationPanel.title')}</h4>
              <div className="space-y-2.5">
                {zones.map((z) => (
                  <div key={z.n} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/5">
                    <span className="text-xs font-medium">{t('platform.irrigationPanel.zone')} {z.n}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${z.state === 'ON' ? 'bg-secondary/15 text-secondary' : z.state === 'AUTO' ? 'bg-primary/15 text-primary dark:text-secondary' : 'bg-slate-200 text-slate-500 dark:bg-white/10'}`}>
                      {t(`platform.irrigationPanel.${z.state.toLowerCase()}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Satellite View */}
            <div className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white">{t('platform.satellitePanel.title')}</h4>
                <span className="text-[10px] text-slate-400">{t('platform.satellitePanel.updated')}</span>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-primary-700 via-primary to-secondary">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
                <div className="absolute left-2 top-2 h-8 w-10 rounded bg-accent/60" />
                <div className="absolute bottom-3 right-3 h-6 w-12 rounded bg-secondary/70" />
                <div className="absolute inset-x-0 bottom-0 bg-black/40 px-2 py-1 text-[10px] text-white">{t('platform.satellitePanel.ndvi')}: 0.74</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Sensor Data table */}
            <div className="rounded-xl border border-black/5 bg-white p-4 lg:col-span-2 dark:border-white/5 dark:bg-slate-900">
              <h4 className="mb-3 font-bold text-slate-900 dark:text-white">{t('platform.sensorTable.title')}</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-start text-slate-400">
                    <th className="pb-2 text-start font-medium">{t('platform.sensorTable.sensor')}</th>
                    <th className="pb-2 text-start font-medium">{t('platform.sensorTable.location')}</th>
                    <th className="pb-2 text-start font-medium">{t('platform.sensorTable.value')}</th>
                    <th className="pb-2 text-start font-medium">{t('platform.sensorTable.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sensors.map((s) => (
                    <tr key={s.id} className="border-t border-black/5 dark:border-white/5">
                      <td className="py-2 font-medium">{s.id}</td>
                      <td className="py-2 text-slate-500">{s.loc}</td>
                      <td className="py-2">{s.val}</td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.st === 'ok' ? 'bg-secondary/15 text-secondary' : 'bg-accent/15 text-accent'}`}>{s.st.toUpperCase()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Reports */}
            <div className="rounded-xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-slate-900">
              <h4 className="mb-3 font-bold text-slate-900 dark:text-white">{t('platform.reports.title')}</h4>
              <div className="space-y-2">
                {reports.map((r) => (
                  <div key={r} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/5">
                    <span className="flex items-center gap-2 text-xs"><FileText className="h-3.5 w-3.5 text-primary dark:text-secondary" />{r}</span>
                    <button className="text-[10px] font-bold text-primary dark:text-secondary">{t('platform.reports.view')}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
