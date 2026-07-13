import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, Loader2, Tractor, ClipboardList, Bug, Crosshair, Factory, Contact, Map as MapIcon, Users, ArrowUpRight,
} from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { enterpriseSearch } from '../lib/platformApi'
import type { SearchHit, SearchResult } from '../types/platform'

const kindIcons: Record<SearchHit['kind'], typeof Tractor> = {
  farm: Tractor, operation: ClipboardList, pest_detection: Bug, trap: Crosshair,
  station: Factory, operator: Contact, region: MapIcon, user: Users,
}

export default function EnterpriseSearchPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const initial = searchParams.get('q') ?? ''
  const [input, setInput] = useState(initial)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  const run = (q: string) => {
    if (q.trim().length < 2) {
      setResult(null)
      return
    }
    setLoading(true)
    enterpriseSearch(q.trim())
      .then(setResult)
      .catch(() => setResult({ query: q, total: 0, hits: [] }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (initial) run(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSearchParams(input.trim() ? { q: input.trim() } : {})
    run(input)
  }

  const groups = useMemo(() => {
    const map = new Map<string, SearchHit[]>()
    ;(result?.hits ?? []).forEach((h) => {
      if (!map.has(h.kind)) map.set(h.kind, [])
      map.get(h.kind)!.push(h)
    })
    return Array.from(map.entries())
  }, [result])

  return (
    <PlatformPageShell title={`${t('searchPage.title')} — PURE LINE`} description={t('searchPage.subtitle')}>
      <div className="container-px">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal><span className="eyebrow">{t('searchPage.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h1 className="section-title mt-5">{t('searchPage.title')}</h1></Reveal>
          <Reveal delay={0.1}>
            <form onSubmit={submit} className="relative mx-auto mt-8 max-w-xl">
              <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-dark/40" />
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('searchPage.placeholder')}
                className="w-full rounded-2xl border border-black/10 bg-white py-4 ps-12 pe-28 text-sm shadow-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
              />
              <button type="submit" className="btn-primary absolute end-2 top-1/2 -translate-y-1/2 !px-4 !py-2 text-xs">
                {t('searchPage.search')}
              </button>
            </form>
          </Reveal>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : result && result.total === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">
              {t('searchPage.noResults', { q: result.query })}
            </p>
          ) : result ? (
            <>
              <p className="text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">
                {t('searchPage.resultCount', { count: result.total, q: result.query })}
              </p>
              <div className="mt-6 space-y-8">
                {groups.map(([kind, hits]) => {
                  const Icon = kindIcons[kind as SearchHit['kind']] ?? Search
                  return (
                    <div key={kind}>
                      <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">
                        <Icon className="h-4 w-4 text-primary dark:text-secondary" /> {t(`searchPage.kind.${kind}`)}
                      </h2>
                      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
                        {hits.map((h) => (
                          <Link
                            key={`${h.kind}-${h.ref}`}
                            to={h.link}
                            className="group flex items-center justify-between gap-3 border-b border-black/5 px-5 py-3.5 transition last:border-0 hover:bg-primary/5 dark:border-white/5"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold">{h.title}</div>
                              {h.subtitle && <div className="mt-0.5 truncate font-mono text-[11px] text-neutral-dark/45 dark:text-neutral-light/45">{h.subtitle}</div>}
                            </div>
                            <ArrowUpRight className="h-4 w-4 shrink-0 text-primary opacity-0 transition group-hover:opacity-100 dark:text-secondary rtl:-scale-x-100" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="py-16 text-center text-sm text-neutral-dark/40 dark:text-neutral-light/40">{t('searchPage.hint')}</p>
          )}
        </div>
      </div>
    </PlatformPageShell>
  )
}
