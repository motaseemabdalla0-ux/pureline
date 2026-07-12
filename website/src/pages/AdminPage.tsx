import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ShieldCheck, LogOut, Loader2, AlertTriangle, Search, Plus, Trash2, Users, Activity as ActivityIcon,
  LayoutDashboard, ClipboardList, Satellite, ListChecks, Bug, Package, HardHat,
} from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import NdviStatusCard from '../components/satellite/NdviStatusCard'
import {
  adminLogin, adminListRequests, adminUpdateRequestStatus, adminListCustomers, adminGetKpis,
  adminGetActivity, adminCreateQuotation, setAdminToken, ADMIN_TOKEN_KEY,
  platformLogin, listOperations, listPestDetections, listAssets, listStaff, getWorkforcePerformance,
  updateOperationStatus, PlatformApiError,
} from '../lib/platformApi'
import { OPERATION_STATUSES, operationStatusStyles } from '../lib/operations'
import { pestRiskStyles, pestRiskDot, pestDetectionStatusStyles } from '../lib/pests'
import { assetStatusStyles, assetStatusDot } from '../lib/assets'
import dataset from '../data/ndvi-farms.json'
import type { NdviDataset } from '../types/ndvi'
import type {
  AdminActivityEntry, AdminCustomer, AdminKpis, Asset, LineItem, Operation, OperationStatus, PestDetection,
  QuotationTemplate, RequestStatus, ServiceRequest, StaffMember, StaffPerformance,
} from '../types/platform'

const ndviData = dataset as NdviDataset
const STATUSES: RequestStatus[] = ['submitted', 'under_review', 'quotation_sent', 'approved', 'in_progress', 'completed']
const TEMPLATES: QuotationTemplate[] = ['greenhouse', 'irrigation', 'ndvi', 'consultancy']
const TABS = ['kpis', 'requests', 'customers', 'activity', 'farms', 'operations', 'pests', 'assets', 'workforce'] as const
type Tab = (typeof TABS)[number]

function getStoredToken(): string | null {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY) } catch { return null }
}

/* ---------- Admin platform-auth bridge ----------
 * The old admin portal (this page) uses a single-password token system that
 * is entirely separate from the new multi-role `/platform/*` auth. The
 * operations/pests/assets/workforce endpoints below require the NEW
 * platform-auth Bearer token though, so once the admin is signed into this
 * old portal we silently log them into the new system too (using the seeded
 * admin account) and cache that second token under its own localStorage key.
 * This never merges the two auth systems — it just lets this page borrow a
 * platform-auth token to call platform-auth-gated endpoints. */
const ADMIN_PLATFORM_TOKEN_KEY = 'pl_admin_platform_token'

function getStoredAdminPlatformToken(): string | null {
  try { return localStorage.getItem(ADMIN_PLATFORM_TOKEN_KEY) } catch { return null }
}

function setStoredAdminPlatformToken(token: string | null) {
  try {
    if (token) localStorage.setItem(ADMIN_PLATFORM_TOKEN_KEY, token)
    else localStorage.removeItem(ADMIN_PLATFORM_TOKEN_KEY)
  } catch { /* ignore */ }
}

async function getAdminPlatformToken(): Promise<string> {
  const cached = getStoredAdminPlatformToken()
  if (cached) return cached
  const res = await platformLogin({ username: 'admin', password: 'Pureline@2026' })
  setStoredAdminPlatformToken(res.token)
  return res.token
}

/** Calls `fn` with a cached admin platform-auth token, transparently
 * refreshing it once and retrying if it turns out to be missing/expired. */
async function withAdminPlatformToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = await getAdminPlatformToken()
  try {
    return await fn(token)
  } catch (err) {
    if (err instanceof PlatformApiError && err.status === 401) {
      setStoredAdminPlatformToken(null)
      const fresh = await getAdminPlatformToken()
      return fn(fresh)
    }
    throw err
  }
}

/* ---------- Login gate ---------- */
function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const submit = async () => {
    if (!password.trim() || loading) return
    setLoading(true)
    setError(false)
    try {
      const res = await adminLogin(password.trim())
      setAdminToken(res.token)
      onSuccess()
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-mesh-green px-6">
      <Reveal className="w-full max-w-sm rounded-3xl border border-black/5 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-white shadow-lg">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-xl font-black">{t('adminPage.loginTitle')}</h1>
        <div className="mt-6 space-y-3 text-start">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            type="password"
            placeholder={t('adminPage.passwordLabel')}
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
          />
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-500">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {t('adminPage.loginError')}
            </div>
          )}
          <button onClick={submit} disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('adminPage.login')}
          </button>
        </div>
      </Reveal>
    </div>
  )
}

/* ---------- KPI tab ---------- */
function KpisTab() {
  const { t } = useTranslation()
  const [kpis, setKpis] = useState<AdminKpis | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    adminGetKpis().then(setKpis).catch(() => setError(true)).finally(() => setLoading(false))
  }, [])

  if (loading) return <CenterLoader />
  if (error || !kpis) return <CenterError />

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {([
          ['totalRequests', kpis.total_requests],
          ['openRequests', kpis.open_requests],
          ['totalQuotations', kpis.total_quotations],
          ['totalCustomers', kpis.total_customers],
        ] as const).map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="text-2xl font-black text-primary dark:text-secondary">{v}</div>
            <div className="mt-1 text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">{t(`adminPage.kpi.${k}`)}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">{t('adminPage.kpi.byStatus')}</h3>
          <div className="mt-4 space-y-2">
            {Object.entries(kpis.requests_by_status).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="text-neutral-dark/70 dark:text-neutral-light/70">{k}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">{t('adminPage.kpi.byService')}</h3>
          <div className="mt-4 space-y-2">
            {Object.entries(kpis.requests_by_service).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="text-neutral-dark/70 dark:text-neutral-light/70">{k}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Requests tab ---------- */
function QuotationForm({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const { t } = useTranslation()
  const [template, setTemplate] = useState<QuotationTemplate>('irrigation')
  const [currency, setCurrency] = useState('SAR')
  const [taxPercent, setTaxPercent] = useState(15)
  const [validDays, setValidDays] = useState(30)
  const [terms, setTerms] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ description: '', qty: 1, unit_price: 0 }])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)

  const updateItem = (i: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))

  const submit = async () => {
    if (submitting) return
    setSubmitting(true)
    setError(false)
    try {
      await adminCreateQuotation({
        request_id: requestId,
        template,
        currency,
        line_items: items.filter((it) => it.description.trim()),
        tax_percent: taxPercent,
        terms: terms.trim() || undefined,
        valid_days: validDays,
      })
      setSuccess(true)
      setTimeout(onDone, 1200)
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <h4 className="text-sm font-bold">{t('adminPage.quotationForm.title')}</h4>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <select value={template} onChange={(e) => setTemplate(e.target.value as QuotationTemplate)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {TEMPLATES.map((tpl) => <option key={tpl} value={tpl}>{tpl}</option>)}
        </select>
        <input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder={t('adminPage.quotationForm.currency')} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
        <input value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} type="number" placeholder={t('adminPage.quotationForm.taxPercent')} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
        <input value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} type="number" placeholder={t('adminPage.quotationForm.validDays')} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 sm:col-span-1" />
        <input value={terms} onChange={(e) => setTerms(e.target.value)} placeholder={t('adminPage.quotationForm.terms')} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 sm:col-span-2" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">{t('adminPage.quotationForm.lineItems')}</div>
        {items.map((it, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input
              value={it.description}
              onChange={(e) => updateItem(i, { description: e.target.value })}
              placeholder={t('adminPage.quotationForm.description')}
              className="min-w-[160px] flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
            />
            <input
              value={it.qty}
              onChange={(e) => updateItem(i, { qty: Number(e.target.value) })}
              type="number"
              placeholder={t('adminPage.quotationForm.qty')}
              className="w-20 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
            />
            <input
              value={it.unit_price}
              onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })}
              type="number"
              placeholder={t('adminPage.quotationForm.unitPrice')}
              className="w-28 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
            />
            <button type="button" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))} className="rounded-lg p-2 text-red-500 hover:bg-red-500/10">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setItems((prev) => [...prev, { description: '', qty: 1, unit_price: 0 }])} className="btn-ghost text-xs">
          <Plus className="h-3.5 w-3.5" /> {t('adminPage.quotationForm.addLine')}
        </button>
      </div>

      {error && <div className="mt-3 text-xs text-red-500">{t('common.error')}</div>}
      {success && <div className="mt-3 text-xs text-secondary">{t('adminPage.quotationForm.success')}</div>}

      <button onClick={submit} disabled={submitting} className="btn-primary mt-4">
        {submitting ? t('adminPage.quotationForm.submitting') : t('adminPage.quotationForm.submit')}
      </button>
    </div>
  )
}

function RequestRow({ req, onChanged }: { req: ServiceRequest; onChanged: () => void }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<RequestStatus>(req.status)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await adminUpdateRequestStatus(req.request_id, status, note.trim() || undefined)
      setNote('')
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex w-full flex-wrap items-start justify-between gap-3 text-start">
        <div>
          <div className="font-mono text-xs text-neutral-dark/50 dark:text-neutral-light/50">{req.request_id}</div>
          <h3 className="mt-1 font-bold">{req.service_name}</h3>
          <p className="mt-0.5 text-xs text-neutral-dark/50 dark:text-neutral-light/50">{req.customer.full_name} · {req.customer.email}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary dark:text-secondary">{req.status}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-black/5 pt-4 dark:border-white/10">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">{t('adminPage.requests.changeStatus')}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as RequestStatus)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('adminPage.requests.addNote')} className="min-w-[180px] flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('adminPage.requests.save')}
            </button>
            <button type="button" onClick={() => setShowQuoteForm((v) => !v)} className="btn-ghost">
              {t('adminPage.requests.createQuotation')}
            </button>
          </div>
          {showQuoteForm && <QuotationForm requestId={req.request_id} onDone={() => { setShowQuoteForm(false); onChanged() }} />}
        </div>
      )}
    </div>
  )
}

function RequestsTab() {
  const { t } = useTranslation()
  const [requests, setRequests] = useState<ServiceRequest[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    setError(false)
    adminListRequests().then(setRequests).catch(() => setError(true)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    if (!requests) return []
    const q = search.trim().toLowerCase()
    if (!q) return requests
    return requests.filter((r) =>
      `${r.request_id} ${r.service_name} ${r.customer.full_name} ${r.customer.email}`.toLowerCase().includes(q),
    )
  }, [requests, search])

  if (loading) return <CenterLoader />
  if (error) return <CenterError />

  return (
    <div>
      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-dark/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('adminPage.requests.search')} className="w-full rounded-xl border border-black/10 bg-white py-2.5 ps-9 pe-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5" />
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('adminPage.requests.empty')}</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => <RequestRow key={r.request_id} req={r} onChanged={load} />)}
        </div>
      )}
    </div>
  )
}

/* ---------- Customers tab ---------- */
function CustomersTab() {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState<AdminCustomer[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminListCustomers().then(setCustomers).catch(() => setError(true)).finally(() => setLoading(false))
  }, [])

  if (loading) return <CenterLoader />
  if (error) return <CenterError />
  if (!customers || customers.length === 0) return <p className="text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('adminPage.customers.empty')}</p>

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="bg-black/5 text-start text-[11px] font-bold uppercase tracking-wider text-neutral-dark/50 dark:bg-white/10 dark:text-neutral-light/50">
            <th className="px-4 py-3 text-start">Name</th>
            <th className="px-4 py-3 text-start">Email</th>
            <th className="px-4 py-3 text-start">Company</th>
            <th className="px-4 py-3 text-start">Phone</th>
            <th className="px-4 py-3 text-end">Requests</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/10">
          {customers.map((c) => (
            <tr key={c.email}>
              <td className="px-4 py-3 font-semibold">{c.full_name}</td>
              <td className="px-4 py-3">{c.email}</td>
              <td className="px-4 py-3">{c.company ?? '—'}</td>
              <td className="px-4 py-3">{c.phone ?? '—'}</td>
              <td className="px-4 py-3 text-end">{c.request_count ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Activity tab ---------- */
function ActivityTab() {
  const { t } = useTranslation()
  const [activity, setActivity] = useState<AdminActivityEntry[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminGetActivity().then(setActivity).catch(() => setError(true)).finally(() => setLoading(false))
  }, [])

  if (loading) return <CenterLoader />
  if (error) return <CenterError />
  if (!activity || activity.length === 0) return <p className="text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('adminPage.activity.empty')}</p>

  return (
    <div className="space-y-3">
      {activity.map((a) => (
        <div key={a.id} className="flex items-start gap-3 rounded-xl border border-black/5 bg-white p-4 text-sm dark:border-white/10 dark:bg-white/5">
          <ActivityIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary dark:text-secondary" />
          <div>
            <p className="text-neutral-dark/80 dark:text-neutral-light/80">{a.message}</p>
            <p className="mt-0.5 text-xs text-neutral-dark/40 dark:text-neutral-light/40">{new Date(a.created_at).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- Farms tab ---------- */
function FarmsTab() {
  const { t } = useTranslation()
  return (
    <div>
      <p className="mb-6 text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('adminPage.farms.note')}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ndviData.farms.map((farm) => <NdviStatusCard key={farm.id} farm={farm} />)}
      </div>
    </div>
  )
}

/* ---------- Operations tab ---------- */
function OperationRow({ op, onChanged }: { op: Operation; onChanged: () => void }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<OperationStatus>(op.status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const save = async () => {
    if (saving || status === op.status) return
    setSaving(true)
    setError(false)
    try {
      await withAdminPlatformToken((token) => updateOperationStatus(op.operation_id, status, undefined, token))
      onChanged()
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr>
      <td className="px-4 py-3 font-mono text-xs text-neutral-dark/60 dark:text-neutral-light/60">{op.operation_id}</td>
      <td className="px-4 py-3 font-mono text-xs text-neutral-dark/60 dark:text-neutral-light/60">{op.farm_code}</td>
      <td className="px-4 py-3">{t(`platformOperations.type.${op.operation_type}`)}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${operationStatusStyles[op.status]}`}>
          {t(`platformOperations.status.${op.status}`)}
        </span>
      </td>
      <td className="px-4 py-3 text-xs">{new Date(op.scheduled_date).toLocaleDateString()}</td>
      <td className="px-4 py-3 text-xs">{op.assigned_to ?? '—'}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value as OperationStatus)} className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs dark:border-white/10 dark:bg-white/5">
            {OPERATION_STATUSES.map((s) => <option key={s} value={s}>{t(`platformOperations.status.${s}`)}</option>)}
          </select>
          <button onClick={save} disabled={saving || status === op.status} className="btn-ghost !py-1.5 !px-3 text-xs">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('adminPage.operationsTab.updateStatus')}
          </button>
        </div>
        {error && <div className="mt-1 text-[11px] text-red-500">{t('common.error')}</div>}
      </td>
    </tr>
  )
}

function OperationsTab() {
  const { t } = useTranslation()
  const [operations, setOperations] = useState<Operation[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    setError(false)
    withAdminPlatformToken((token) => listOperations(undefined, token))
      .then(setOperations)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) return <CenterLoader />
  if (error) return <CenterError />
  if (!operations || operations.length === 0) {
    return <p className="text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('adminPage.operationsTab.empty')}</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="bg-black/5 text-start text-[11px] font-bold uppercase tracking-wider text-neutral-dark/50 dark:bg-white/10 dark:text-neutral-light/50">
            <th className="px-4 py-3 text-start">{t('adminPage.operationsTab.table.id')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.operationsTab.table.farm')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.operationsTab.table.type')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.operationsTab.table.status')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.operationsTab.table.scheduled')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.operationsTab.table.assigned')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.operationsTab.table.action')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/10">
          {operations.map((op) => <OperationRow key={op.operation_id} op={op} onChanged={load} />)}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Pests tab ---------- */
function PestsTab() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const [detections, setDetections] = useState<PestDetection[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(false)
    withAdminPlatformToken((token) => listPestDetections(undefined, token))
      .then(setDetections)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <CenterLoader />
  if (error) return <CenterError />
  if (!detections || detections.length === 0) {
    return <p className="text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('adminPage.pestsTab.empty')}</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="bg-black/5 text-start text-[11px] font-bold uppercase tracking-wider text-neutral-dark/50 dark:bg-white/10 dark:text-neutral-light/50">
            <th className="px-4 py-3 text-start">{t('adminPage.pestsTab.table.id')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.pestsTab.table.farm')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.pestsTab.table.pestType')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.pestsTab.table.risk')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.pestsTab.table.status')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.pestsTab.table.detected')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/10">
          {detections.map((d) => (
            <tr key={d.detection_id}>
              <td className="px-4 py-3 font-mono text-xs text-neutral-dark/60 dark:text-neutral-light/60">{d.detection_id}</td>
              <td className="px-4 py-3 font-mono text-xs text-neutral-dark/60 dark:text-neutral-light/60">{d.farm_code}</td>
              <td className="px-4 py-3 text-xs">#{d.pest_type_id}</td>
              <td className="px-4 py-3">
                <span className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pestRiskStyles[d.risk_level]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${pestRiskDot[d.risk_level]}`} />
                  {t(`platformPests.risk.${d.risk_level}`)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pestDetectionStatusStyles[d.status]}`}>
                  {t(`platformPests.status.${d.status}`)}
                </span>
              </td>
              <td className="px-4 py-3 text-xs">
                {new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d.detected_date))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Assets tab ---------- */
function AssetsTab() {
  const { t } = useTranslation()
  const [assets, setAssets] = useState<Asset[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(false)
    withAdminPlatformToken((token) => listAssets(undefined, token))
      .then(setAssets)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <CenterLoader />
  if (error) return <CenterError />
  if (!assets || assets.length === 0) {
    return <p className="text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('adminPage.assetsTab.empty')}</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="bg-black/5 text-start text-[11px] font-bold uppercase tracking-wider text-neutral-dark/50 dark:bg-white/10 dark:text-neutral-light/50">
            <th className="px-4 py-3 text-start">{t('adminPage.assetsTab.table.code')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.assetsTab.table.name')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.assetsTab.table.category')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.assetsTab.table.status')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.assetsTab.table.farm')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/10">
          {assets.map((a) => (
            <tr key={a.asset_code}>
              <td className="px-4 py-3 font-mono text-xs text-neutral-dark/60 dark:text-neutral-light/60">{a.asset_code}</td>
              <td className="px-4 py-3 font-semibold">{a.name}</td>
              <td className="px-4 py-3">{t(`platformAssets.category.${a.category}`)}</td>
              <td className="px-4 py-3">
                <span className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${assetStatusStyles[a.status]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${assetStatusDot[a.status]}`} />
                  {t(`platformAssets.status.${a.status}`)}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-neutral-dark/60 dark:text-neutral-light/60">{a.farm_code || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Workforce tab ---------- */
function WorkforceTab() {
  const { t } = useTranslation()
  const [staff, setStaff] = useState<StaffMember[] | null>(null)
  const [performance, setPerformance] = useState<StaffPerformance[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(false)
    withAdminPlatformToken((token) => Promise.all([listStaff(token), getWorkforcePerformance(token)]))
      .then(([s, p]) => { setStaff(s); setPerformance(p) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <CenterLoader />
  if (error) return <CenterError />
  if (!staff || staff.length === 0) {
    return <p className="text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('adminPage.workforceTab.empty')}</p>
  }

  const perfFor = (id: number) => performance?.find((p) => p.staff_id === id)

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="bg-black/5 text-start text-[11px] font-bold uppercase tracking-wider text-neutral-dark/50 dark:bg-white/10 dark:text-neutral-light/50">
            <th className="px-4 py-3 text-start">{t('adminPage.workforceTab.table.name')}</th>
            <th className="px-4 py-3 text-start">{t('adminPage.workforceTab.table.title')}</th>
            <th className="px-4 py-3 text-end">{t('adminPage.workforceTab.table.total')}</th>
            <th className="px-4 py-3 text-end">{t('adminPage.workforceTab.table.completed')}</th>
            <th className="px-4 py-3 text-end">{t('adminPage.workforceTab.table.rate')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/10">
          {staff.map((s) => {
            const p = perfFor(s.id)
            return (
              <tr key={s.id}>
                <td className="px-4 py-3 font-semibold">{s.full_name}</td>
                <td className="px-4 py-3">{s.staff_title ?? '—'}</td>
                <td className="px-4 py-3 text-end">{p?.total_assignments ?? 0}</td>
                <td className="px-4 py-3 text-end">{p?.completed_assignments ?? 0}</td>
                <td className="px-4 py-3 text-end font-bold text-primary dark:text-secondary">{(p?.completion_rate_percent ?? 0).toFixed(1)}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Shared helpers ---------- */
function CenterLoader() {
  return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
}
function CenterError() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-red-500">
      <AlertTriangle className="h-6 w-6" />
      <p className="text-sm">{t('common.error')}</p>
    </div>
  )
}

const TAB_ICONS: Record<Tab, typeof LayoutDashboard> = {
  kpis: LayoutDashboard,
  requests: ClipboardList,
  customers: Users,
  activity: ActivityIcon,
  farms: Satellite,
  operations: ListChecks,
  pests: Bug,
  assets: Package,
  workforce: HardHat,
}

/* ---------- Main page ---------- */
export default function AdminPage() {
  const { t } = useTranslation()
  const [token, setTokenState] = useState<string | null>(() => getStoredToken())
  const [tab, setTab] = useState<Tab>('kpis')

  // Poll for token clearing caused by a 401 deep inside a tab component.
  useEffect(() => {
    const id = setInterval(() => {
      const stored = getStoredToken()
      if (stored !== token) setTokenState(stored)
    }, 1500)
    return () => clearInterval(id)
  }, [token])

  const logout = () => {
    setAdminToken(null)
    setTokenState(null)
  }

  if (!token) {
    return (
      <PlatformPageShell title={`${t('adminPage.title')} — PURE LINE`}>
        <LoginGate onSuccess={() => setTokenState(getStoredToken())} />
      </PlatformPageShell>
    )
  }

  return (
    <PlatformPageShell title={`${t('adminPage.title')} — PURE LINE`}>
      <div className="container-px">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">{t('navPlatform.admin')}</span>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">{t('adminPage.title')}</h1>
          </div>
          <button onClick={logout} className="btn-ghost">
            <LogOut className="h-4 w-4" /> {t('adminPage.logout')}
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-black/5 pb-4 dark:border-white/10">
          {TABS.map((tb) => {
            const Icon = TAB_ICONS[tb]
            return (
              <button
                key={tb}
                type="button"
                onClick={() => setTab(tb)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === tb ? 'bg-primary text-white' : 'bg-black/5 text-neutral-dark/70 dark:bg-white/10 dark:text-neutral-light/70'
                }`}
              >
                <Icon className="h-4 w-4" /> {t(`adminPage.tabs.${tb}`)}
              </button>
            )
          })}
        </div>

        <Reveal className="mt-8">
          {tab === 'kpis' && <KpisTab />}
          {tab === 'requests' && <RequestsTab />}
          {tab === 'customers' && <CustomersTab />}
          {tab === 'activity' && <ActivityTab />}
          {tab === 'farms' && <FarmsTab />}
          {tab === 'operations' && <OperationsTab />}
          {tab === 'pests' && <PestsTab />}
          {tab === 'assets' && <AssetsTab />}
          {tab === 'workforce' && <WorkforceTab />}
        </Reveal>
      </div>
    </PlatformPageShell>
  )
}
