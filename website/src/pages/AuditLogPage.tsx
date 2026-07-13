import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollText, Loader2, AlertTriangle, Search, Download } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { listAuditEntries } from '../lib/platformApi'
import { exportRowsAsCsv } from '../lib/exportCsv'
import type { AuditEntry } from '../types/platform'

/** Colored chip per action family (users, traps, boundary, pest, …). */
function actionColor(action: string): string {
  if (action.startsWith('user.')) return 'bg-purple-500/15 text-purple-500'
  if (action.startsWith('pest.')) return 'bg-red-500/15 text-red-500'
  if (action.startsWith('trap.')) return 'bg-accent/15 text-accent'
  if (action.startsWith('recycling.')) return 'bg-secondary/15 text-primary dark:text-secondary'
  if (action.startsWith('boundary.')) return 'bg-blue-500/15 text-blue-500'
  if (action.startsWith('operation.')) return 'bg-primary/15 text-primary dark:text-secondary'
  return 'bg-black/5 text-neutral-dark/60 dark:bg-white/10 dark:text-neutral-light/60'
}

export default function AuditLogPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'

  const [entries, setEntries] = useState<AuditEntry[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [actorFilter, setActorFilter] = useState('all')

  const load = () => {
    setLoading(true)
    setError(false)
    listAuditEntries({ limit: 300 })
      .then(setEntries)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const actors = useMemo(
    () => Array.from(new Set((entries ?? []).map((e) => e.actor))).sort(),
    [entries],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (entries ?? []).filter((e) => {
      if (actorFilter !== 'all' && e.actor !== actorFilter) return false
      if (q && !`${e.action} ${JSON.stringify(e.meta)}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [entries, search, actorFilter])

  const exportCsv = () => {
    exportRowsAsCsv('pureline-audit-log', ['timestamp', 'actor', 'action', 'details'],
      filtered.map((e) => [e.created_at, e.actor, e.action, JSON.stringify(e.meta)]))
  }

  return (
    <PlatformPageShell title={`${t('auditPage.title')} — PURE LINE`} description={t('auditPage.subtitle')}>
      <div className="container-px">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">{t('auditPage.eyebrow')}</span>
            <h1 className="mt-4 flex items-center gap-2.5 text-2xl font-black sm:text-3xl">
              <ScrollText className="h-7 w-7 text-primary dark:text-secondary" /> {t('auditPage.title')}
            </h1>
            <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('auditPage.subtitle')}</p>
          </div>
          <button onClick={exportCsv} className="btn-primary">
            <Download className="h-4 w-4" /> {t('auditPage.export')}
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-dark/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('auditPage.searchPlaceholder')}
              className="w-full rounded-xl border border-black/10 bg-white py-2.5 ps-10 pe-4 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
          >
            <option value="all">{t('auditPage.allActors')}</option>
            {actors.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-24 text-red-500">
              <AlertTriangle className="h-6 w-6" />
              <p className="text-sm">{t('common.error')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('auditPage.empty')}</div>
          ) : (
            <Reveal>
              <ol className="relative space-y-0 border-s border-black/10 ps-6 dark:border-white/10">
                {filtered.map((e) => (
                  <li key={e.id} className="relative pb-6 last:pb-0">
                    <span className="absolute -start-[30px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary dark:bg-secondary" />
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${actionColor(e.action)}`}>{e.action}</span>
                      <span className="text-xs font-bold">@{e.actor}</span>
                      <span className="text-[11px] text-neutral-dark/40 dark:text-neutral-light/40">
                        {new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(e.created_at))}
                      </span>
                    </div>
                    {Object.keys(e.meta ?? {}).length > 0 && (
                      <div className="mt-1.5 font-mono text-[11px] text-neutral-dark/50 dark:text-neutral-light/50">
                        {Object.entries(e.meta).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(' · ')}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </Reveal>
          )}
        </div>
      </div>
    </PlatformPageShell>
  )
}
