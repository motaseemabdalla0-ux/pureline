import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users, Phone, Mail, Loader2, AlertTriangle, ChevronDown, ArrowUpDown, ShieldAlert,
  Wrench, Bug, Clock, MapPin,
} from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import { getStaffAssignments, getWorkforcePerformance, listStaff } from '../lib/platformApi'
import type { StaffMember, StaffPerformance, WorkforceAssignment } from '../types/platform'

function CenterLoader() {
  return (
    <div className="flex justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function CenterError() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-2 py-24 text-red-500">
      <AlertTriangle className="h-6 w-6" />
      <p className="text-sm">{t('common.error')}</p>
    </div>
  )
}

function AssignmentsPanel({ staffId }: { staffId: number }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const [assignments, setAssignments] = useState<WorkforceAssignment[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setAssignments(null)
    setError(false)
    getStaffAssignments(staffId)
      .then((data) => { if (!cancelled) setAssignments(data) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [staffId])

  if (error) {
    return <div className="px-5 py-6 text-center text-xs text-red-500">{t('common.error')}</div>
  }

  if (!assignments) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    )
  }

  if (assignments.length === 0) {
    return <div className="px-5 py-6 text-center text-xs text-neutral-dark/50 dark:text-neutral-light/50">{t('platformWorkforce.noAssignments')}</div>
  }

  return (
    <ul className="divide-y divide-black/5 dark:divide-white/10">
      {assignments.map((a, i) => {
        const Icon = a.type === 'pest_detection' ? Bug : Wrench
        return (
          <li key={`${a.type}-${a.reference ?? i}`} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:text-secondary">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-[9rem] flex-1">
              <div className="font-semibold">{t(`platformWorkforce.assignmentType.${a.type}`)}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-dark/50 dark:text-neutral-light/50">
                {a.reference && <span className="font-mono">{a.reference}</span>}
                {a.farm_code && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.farm_code}</span>
                )}
              </div>
            </div>
            <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-dark/70 dark:bg-white/10 dark:text-neutral-light/70">
              {a.status}
            </span>
            {a.date && (
              <span className="flex items-center gap-1 text-xs text-neutral-dark/50 dark:text-neutral-light/50">
                <Clock className="h-3.5 w-3.5" />
                {new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(a.date))}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default function WorkforcePage() {
  const { t } = useTranslation()
  const { user } = usePlatformAuth()
  const restricted = user?.role === 'customer'

  const [staff, setStaff] = useState<StaffMember[] | null>(null)
  const [performance, setPerformance] = useState<StaffPerformance[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sortDesc, setSortDesc] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    if (restricted) { setLoading(false); return }
    setLoading(true)
    setError(false)
    Promise.all([listStaff(), getWorkforcePerformance()])
      .then(([s, p]) => { setStaff(s); setPerformance(p) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [restricted])

  const sortedPerformance = useMemo(() => {
    if (!performance) return null
    return [...performance].sort((a, b) => (
      sortDesc ? b.completion_rate_percent - a.completion_rate_percent : a.completion_rate_percent - b.completion_rate_percent
    ))
  }, [performance, sortDesc])

  const toggleStaff = (id: number) => setExpandedId((cur) => (cur === id ? null : id))

  if (restricted) {
    return (
      <PlatformPageShell title={`${t('platformWorkforce.title')} — PURE LINE`} description={t('platformWorkforce.subtitle')}>
        <div className="container-px">
          <div className="mx-auto mt-16 flex max-w-xl flex-col items-center gap-4 rounded-3xl border border-black/5 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
              <ShieldAlert className="h-7 w-7" />
            </span>
            <h1 className="text-xl font-black">{t('platformWorkforce.restricted.title')}</h1>
            <p className="text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('platformWorkforce.restricted.message')}</p>
          </div>
        </div>
      </PlatformPageShell>
    )
  }

  if (loading) {
    return (
      <PlatformPageShell title={`${t('platformWorkforce.title')} — PURE LINE`}>
        <div className="container-px"><CenterLoader /></div>
      </PlatformPageShell>
    )
  }

  if (error && (!staff || !performance)) {
    return (
      <PlatformPageShell title={`${t('platformWorkforce.title')} — PURE LINE`}>
        <div className="container-px"><CenterError /></div>
      </PlatformPageShell>
    )
  }

  return (
    <PlatformPageShell title={`${t('platformWorkforce.title')} — PURE LINE`} description={t('platformWorkforce.subtitle')}>
      <div className="container-px">
        <div>
          <span className="eyebrow">{t('platformWorkforce.eyebrow')}</span>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">{t('platformWorkforce.title')}</h1>
          <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('platformWorkforce.subtitle')}</p>
        </div>

        {/* Staff directory */}
        <div className="mt-10">
          <h2 className="text-lg font-bold">{t('platformWorkforce.directorySection')}</h2>
          {!staff || staff.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformWorkforce.noStaff')}</div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {staff.map((s, i) => (
                <Reveal key={s.id} delay={Math.min(i * 0.03, 0.3)}>
                  <div className="flex h-full flex-col rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary dark:text-secondary">
                        <Users className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold">{s.full_name}</h3>
                        <p className="truncate text-xs text-neutral-dark/50 dark:text-neutral-light/50">
                          {s.staff_title ?? t('platformWorkforce.noTitle')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-1.5 text-xs text-neutral-dark/60 dark:text-neutral-light/60">
                      {s.phone && (
                        <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" /> {s.phone}</span>
                      )}
                      {s.email && (
                        <span className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" /> {s.email}</span>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>

        {/* Performance table */}
        <div className="mt-14">
          <h2 className="text-lg font-bold">{t('platformWorkforce.performanceSection')}</h2>
          <p className="mt-1 text-xs text-neutral-dark/50 dark:text-neutral-light/50">{t('platformWorkforce.performanceHint')}</p>

          {!sortedPerformance || sortedPerformance.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformWorkforce.noStaff')}</div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="grid grid-cols-[1.6fr_1fr_1fr_1.2fr] gap-2 border-b border-black/5 bg-black/[0.02] px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-neutral-dark/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-light/50 sm:px-6">
                <span>{t('platformWorkforce.table.name')}</span>
                <span className="text-center">{t('platformWorkforce.table.total')}</span>
                <span className="text-center">{t('platformWorkforce.table.completed')}</span>
                <button
                  type="button"
                  onClick={() => setSortDesc((v) => !v)}
                  className="flex items-center justify-end gap-1 text-end hover:text-primary dark:hover:text-secondary"
                >
                  {t('platformWorkforce.table.completionRate')} <ArrowUpDown className="h-3 w-3" />
                </button>
              </div>
              <div className="divide-y divide-black/5 dark:divide-white/10">
                {sortedPerformance.map((p) => (
                  <div key={p.staff_id}>
                    <button
                      type="button"
                      onClick={() => toggleStaff(p.staff_id)}
                      className="grid w-full grid-cols-[1.6fr_1fr_1fr_1.2fr] items-center gap-2 px-5 py-3.5 text-start text-sm transition hover:bg-primary/5 sm:px-6"
                    >
                      <span className="flex items-center gap-2 truncate font-semibold">
                        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-neutral-dark/30 transition-transform dark:text-neutral-light/30 ${expandedId === p.staff_id ? 'rotate-180' : ''}`} />
                        <span className="truncate">
                          {p.full_name}
                          {p.staff_title && <span className="ms-1.5 text-xs font-normal text-neutral-dark/50 dark:text-neutral-light/50">· {p.staff_title}</span>}
                        </span>
                      </span>
                      <span className="text-center">{p.total_assignments}</span>
                      <span className="text-center">{p.completed_assignments}</span>
                      <span className="text-end font-bold text-primary dark:text-secondary">{p.completion_rate_percent.toFixed(1)}%</span>
                    </button>
                    {expandedId === p.staff_id && (
                      <div className="border-t border-black/5 bg-black/[0.015] dark:border-white/10 dark:bg-white/[0.02]">
                        <AssignmentsPanel staffId={p.staff_id} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PlatformPageShell>
  )
}
