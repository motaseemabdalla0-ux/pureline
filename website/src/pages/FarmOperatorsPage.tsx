import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Contact, Loader2, AlertTriangle, Plus, X, Search, Phone, Mail } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { Link } from 'react-router-dom'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import {
  createFarmOperator, listFarmOperators, listRegistryFarms, updateFarmOperator, PlatformApiError,
} from '../lib/platformApi'
import type { CreateFarmOperatorPayload, FarmOperator, OperatorStatus, RegistryFarm } from '../types/platform'

const OPERATOR_STATUSES: OperatorStatus[] = ['active', 'suspended', 'retired']

const statusStyles: Record<OperatorStatus, string> = {
  active: 'bg-secondary/15 text-primary dark:text-secondary',
  suspended: 'bg-accent/15 text-accent',
  retired: 'bg-black/5 text-neutral-dark/50 dark:bg-white/10 dark:text-neutral-light/50',
}

const EMPTY_FORM: CreateFarmOperatorPayload = { full_name: '', farm_codes: [] }

export default function FarmOperatorsPage() {
  const { t } = useTranslation()
  const { user } = usePlatformAuth()
  const canManage = user?.role === 'admin' || user?.role === 'staff'

  const [operators, setOperators] = useState<FarmOperator[] | null>(null)
  const [farms, setFarms] = useState<RegistryFarm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OperatorStatus>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateFarmOperatorPayload>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    setError(false)
    Promise.all([listFarmOperators(), listRegistryFarms()])
      .then(([ops, f]) => {
        setOperators(ops)
        setFarms(f)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (operators ?? []).filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (q && !`${o.full_name} ${o.company ?? ''} ${o.operator_code}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [operators, search, statusFilter])

  const stats = useMemo(() => ({
    total: operators?.length ?? 0,
    active: (operators ?? []).filter((o) => o.status === 'active').length,
    farms: new Set((operators ?? []).flatMap((o) => o.farm_codes)).size,
  }), [operators])

  const toggleFarmCode = (code: string) => {
    const cur = form.farm_codes ?? []
    setForm({ ...form, farm_codes: cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code] })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    createFarmOperator(form)
      .then(() => {
        setShowForm(false)
        setForm(EMPTY_FORM)
        load()
      })
      .catch((err) => setFormError(err instanceof PlatformApiError ? err.message : 'error'))
      .finally(() => setSaving(false))
  }

  const changeStatus = (o: FarmOperator, status: OperatorStatus) => {
    setBusyId(o.id)
    updateFarmOperator(o.id, { status })
      .then(load)
      .catch(() => undefined)
      .finally(() => setBusyId(null))
  }

  const inputCls = 'w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5'

  if (loading) {
    return (
      <PlatformPageShell title={`${t('operatorsPage.title')} — PURE LINE`}>
        <div className="container-px"><div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>
      </PlatformPageShell>
    )
  }

  if (error) {
    return (
      <PlatformPageShell title={`${t('operatorsPage.title')} — PURE LINE`}>
        <div className="container-px">
          <div className="flex flex-col items-center gap-2 py-24 text-red-500">
            <AlertTriangle className="h-6 w-6" />
            <p className="text-sm">{t('common.error')}</p>
          </div>
        </div>
      </PlatformPageShell>
    )
  }

  return (
    <PlatformPageShell title={`${t('operatorsPage.title')} — PURE LINE`} description={t('operatorsPage.subtitle')}>
      <div className="container-px">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">{t('operatorsPage.eyebrow')}</span>
            <h1 className="mt-4 flex items-center gap-2.5 text-2xl font-black sm:text-3xl">
              <Contact className="h-7 w-7 text-primary dark:text-secondary" /> {t('operatorsPage.title')}
            </h1>
            <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('operatorsPage.subtitle')}</p>
          </div>
          {canManage && (
            <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? t('common.cancel') : t('operatorsPage.newOperator')}
            </button>
          )}
        </div>

        {/* KPIs */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {([
            ['total', stats.total],
            ['active', stats.active],
            ['farms', stats.farms],
          ] as const).map(([k, v], i) => (
            <Reveal key={k} delay={i * 0.03}>
              <div className="rounded-2xl border border-black/5 bg-white p-4 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="text-2xl font-black">{v}</div>
                <div className="mt-1 text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">{t(`operatorsPage.stats.${k}`)}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Create form */}
        {showForm && canManage && (
          <Reveal>
            <form onSubmit={submit} className="mt-8 rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">{t('operatorsPage.newOperator')}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder={t('operatorsPage.fields.fullName')} className={inputCls} />
                <input value={form.company ?? ''} onChange={(e) => setForm({ ...form, company: e.target.value || undefined })} placeholder={t('operatorsPage.fields.company')} className={inputCls} />
                <input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value || undefined })} placeholder={t('operatorsPage.fields.phone')} className={inputCls} />
                <input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value || undefined })} placeholder={t('operatorsPage.fields.email')} className={inputCls} />
                <input value={form.region ?? ''} onChange={(e) => setForm({ ...form, region: e.target.value || undefined })} placeholder={t('operatorsPage.fields.region')} className={inputCls} />
                <input value={form.license_no ?? ''} onChange={(e) => setForm({ ...form, license_no: e.target.value || undefined })} placeholder={t('operatorsPage.fields.license')} className={inputCls} />
              </div>
              <div className="mt-4">
                <div className="mb-2 text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">{t('operatorsPage.fields.farms')}</div>
                <div className="flex flex-wrap gap-2">
                  {farms.map((f) => {
                    const selected = (form.farm_codes ?? []).includes(f.farm_code)
                    return (
                      <button
                        key={f.farm_code}
                        type="button"
                        onClick={() => toggleFarmCode(f.farm_code)}
                        className={`rounded-full px-3 py-1.5 font-mono text-[11px] font-semibold transition ${selected ? 'bg-primary text-white' : 'bg-black/5 text-neutral-dark/60 dark:bg-white/10 dark:text-neutral-light/60'}`}
                      >
                        {f.farm_code}
                      </button>
                    )
                  })}
                </div>
              </div>
              {formError && <p className="mt-3 text-sm text-red-500">{formError}</p>}
              <button type="submit" disabled={saving} className="btn-primary mt-5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('operatorsPage.create')}
              </button>
            </form>
          </Reveal>
        )}

        {/* Filters */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-dark/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('operatorsPage.searchPlaceholder')} className={`${inputCls} ps-10`} />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', ...OPERATOR_STATUSES] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${statusFilter === s ? 'bg-primary text-white' : 'bg-black/5 text-neutral-dark/70 dark:bg-white/10 dark:text-neutral-light/70'}`}
              >
                {s === 'all' ? t('operatorsPage.allStatuses') : t(`operatorsPage.status.${s}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="mt-8">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('operatorsPage.empty')}</div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-neutral-dark/40 dark:border-white/10 dark:text-neutral-light/40">
                    <th className="px-5 py-4 text-start">{t('operatorsPage.columns.operator')}</th>
                    <th className="px-5 py-4 text-start">{t('operatorsPage.columns.region')}</th>
                    <th className="px-5 py-4 text-start">{t('operatorsPage.columns.farms')}</th>
                    <th className="px-5 py-4 text-start">{t('operatorsPage.columns.contact')}</th>
                    <th className="px-5 py-4 text-start">{t('operatorsPage.columns.license')}</th>
                    <th className="px-5 py-4 text-start">{t('operatorsPage.columns.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                      <td className="px-5 py-4">
                        <div className="font-bold">{o.full_name}</div>
                        <div className="font-mono text-[11px] text-neutral-dark/40 dark:text-neutral-light/40">
                          {o.operator_code}{o.company ? ` · ${o.company}` : ''}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs">{o.region ?? '—'}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {o.farm_codes.map((c) => (
                            <Link key={c} to={`/platform/farms/${c}`} className="rounded-full bg-secondary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary hover:underline dark:text-secondary">
                              {c}
                            </Link>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-neutral-dark/60 dark:text-neutral-light/60">
                        {o.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> <span dir="ltr">{o.phone}</span></div>}
                        {o.email && <div className="mt-0.5 flex items-center gap-1.5"><Mail className="h-3 w-3" /> {o.email}</div>}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs">{o.license_no ?? '—'}</td>
                      <td className="px-5 py-4">
                        {canManage ? (
                          <select
                            value={o.status}
                            disabled={busyId === o.id}
                            onChange={(e) => changeStatus(o, e.target.value as OperatorStatus)}
                            className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
                          >
                            {OPERATOR_STATUSES.map((s) => <option key={s} value={s}>{t(`operatorsPage.status.${s}`)}</option>)}
                          </select>
                        ) : (
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[o.status]}`}>{t(`operatorsPage.status.${o.status}`)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PlatformPageShell>
  )
}
