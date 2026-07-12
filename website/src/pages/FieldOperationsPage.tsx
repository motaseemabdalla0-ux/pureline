import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Loader2, AlertTriangle, Plus, X, ChevronRight, Calendar, User2 } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import { createOperation, listOperations, listRegistryFarms } from '../lib/platformApi'
import { OPERATION_STATUSES, OPERATION_TYPES, operationStatusStyles } from '../lib/operations'
import type { CreateOperationPayload, Operation, OperationStatus, OperationType, RegistryFarm } from '../types/platform'

function NewOperationForm({ farms, onCreated, onClose }: { farms: RegistryFarm[]; onCreated: () => void; onClose: () => void }) {
  const { t } = useTranslation()
  const [farmCode, setFarmCode] = useState(farms[0]?.farm_code ?? '')
  const [operationType, setOperationType] = useState<OperationType>('irrigation')
  const [scheduledDate, setScheduledDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  const submit = async () => {
    if (submitting || !farmCode || !scheduledDate) return
    setSubmitting(true)
    setError(false)
    try {
      const payload: CreateOperationPayload = {
        farm_code: farmCode,
        operation_type: operationType,
        scheduled_date: new Date(scheduledDate).toISOString(),
        assigned_to: assignedTo.trim() || undefined,
        notes: notes.trim() || undefined,
      }
      await createOperation(payload)
      onCreated()
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">{t('platformOperations.newForm.title')}</h3>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select value={farmCode} onChange={(e) => setFarmCode(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {farms.map((f) => <option key={f.farm_code} value={f.farm_code}>{f.name} ({f.farm_code})</option>)}
        </select>
        <select value={operationType} onChange={(e) => setOperationType(e.target.value as OperationType)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {OPERATION_TYPES.map((ot) => <option key={ot} value={ot}>{t(`platformOperations.type.${ot}`)}</option>)}
        </select>
        <input
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          type="date"
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          placeholder={t('platformOperations.newForm.assignedTo')}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('platformOperations.newForm.notes')}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 sm:col-span-2 lg:col-span-1"
        />
      </div>
      {error && <div className="mt-3 text-xs text-red-500">{t('common.error')}</div>}
      <button onClick={submit} disabled={submitting || !farmCode || !scheduledDate} className="btn-primary mt-4">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('platformOperations.newForm.submit')}
      </button>
    </div>
  )
}

export default function FieldOperationsPage() {
  const { t, i18n } = useTranslation()
  const { user } = usePlatformAuth()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const canManage = user?.role === 'admin' || user?.role === 'staff'

  const [operations, setOperations] = useState<Operation[] | null>(null)
  const [farms, setFarms] = useState<RegistryFarm[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [farmFilter, setFarmFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<OperationStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<OperationType | 'all'>('all')

  const load = () => {
    setLoading(true)
    setError(false)
    Promise.all([listOperations(), listRegistryFarms()])
      .then(([ops, f]) => { setOperations(ops); setFarms(f) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    if (!operations) return []
    return operations.filter((o) => {
      if (farmFilter !== 'all' && o.farm_code !== farmFilter) return false
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (typeFilter !== 'all' && o.operation_type !== typeFilter) return false
      return true
    })
  }, [operations, farmFilter, statusFilter, typeFilter])

  const farmName = (code: string) => farms?.find((f) => f.farm_code === code)?.name ?? code

  return (
    <PlatformPageShell title={`${t('platformOperations.title')} — PURE LINE`} description={t('platformOperations.subtitle')}>
      <div className="container-px">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">{t('platformOperations.eyebrow')}</span>
            <h1 className="mt-4 text-2xl font-black sm:text-3xl">{t('platformOperations.title')}</h1>
            <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('platformOperations.subtitle')}</p>
          </div>
          {canManage && (
            <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
              <Plus className="h-4 w-4" /> {t('platformOperations.newOperation')}
            </button>
          )}
        </div>

        {canManage && showForm && farms && (
          <div className="mt-8">
            <NewOperationForm farms={farms} onCreated={() => { setShowForm(false); load() }} onClose={() => setShowForm(false)} />
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <select value={farmFilter} onChange={(e) => setFarmFilter(e.target.value)} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5">
            <option value="all">{t('platformOperations.allFarms')}</option>
            {(farms ?? []).map((f) => <option key={f.farm_code} value={f.farm_code}>{f.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OperationStatus | 'all')} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5">
            <option value="all">{t('platformOperations.allStatuses')}</option>
            {OPERATION_STATUSES.map((s) => <option key={s} value={s}>{t(`platformOperations.status.${s}`)}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as OperationType | 'all')} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5">
            <option value="all">{t('platformOperations.allTypes')}</option>
            {OPERATION_TYPES.map((ot) => <option key={ot} value={ot}>{t(`platformOperations.type.${ot}`)}</option>)}
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
            <div className="py-24 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformOperations.empty')}</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((o, i) => (
                <Reveal key={o.operation_id} delay={Math.min(i * 0.02, 0.3)}>
                  <Link
                    to={`/platform/operations/${o.operation_id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-neutral-dark/40 dark:text-neutral-light/40">{o.operation_id}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${operationStatusStyles[o.status]}`}>
                          {t(`platformOperations.status.${o.status}`)}
                        </span>
                      </div>
                      <h3 className="mt-1.5 font-bold">{t(`platformOperations.type.${o.operation_type}`)} · {farmName(o.farm_code)}</h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-neutral-dark/50 dark:text-neutral-light/50">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(o.scheduled_date))}
                        </span>
                        {o.assigned_to && (
                          <span className="flex items-center gap-1.5">
                            <User2 className="h-3.5 w-3.5" /> {o.assigned_to}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-neutral-dark/30 rtl:rotate-180 dark:text-neutral-light/30" />
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </PlatformPageShell>
  )
}
