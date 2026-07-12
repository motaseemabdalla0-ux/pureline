import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users, Search, Loader2, AlertTriangle, Plus, X, ShieldCheck, ShieldOff, KeyRound, Check,
} from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import { createPlatformUser, listPlatformUsers, updatePlatformUser, PlatformApiError } from '../lib/platformApi'
import type { CreatePlatformUserPayload, PlatformManagedUser, PlatformRole } from '../types/platform'

const ROLES: PlatformRole[] = ['admin', 'staff', 'customer']

const roleStyles: Record<PlatformRole, string> = {
  admin: 'bg-accent/15 text-accent',
  staff: 'bg-secondary/15 text-primary dark:text-secondary',
  customer: 'bg-black/5 text-neutral-dark/60 dark:bg-white/10 dark:text-neutral-light/60',
}

const EMPTY_FORM: CreatePlatformUserPayload = {
  username: '', password: '', full_name: '', role: 'customer', email: '', staff_title: '', phone: '',
}

export default function UserManagementPage() {
  const { t, i18n } = useTranslation()
  const { user: me } = usePlatformAuth()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'

  const [users, setUsers] = useState<PlatformManagedUser[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | PlatformRole>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreatePlatformUserPayload>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [resetFor, setResetFor] = useState<number | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetDone, setResetDone] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    listPlatformUsers()
      .then(setUsers)
      .catch((e) => setError(e instanceof PlatformApiError ? e.message : 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (users ?? []).filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (q && !`${u.username} ${u.full_name} ${u.email ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [users, search, roleFilter])

  const stats = useMemo(() => ({
    total: users?.length ?? 0,
    admins: (users ?? []).filter((u) => u.role === 'admin').length,
    staff: (users ?? []).filter((u) => u.role === 'staff').length,
    customers: (users ?? []).filter((u) => u.role === 'customer').length,
    inactive: (users ?? []).filter((u) => !u.is_active).length,
  }), [users])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const payload: CreatePlatformUserPayload = {
      ...form,
      email: form.email || undefined,
      staff_title: form.staff_title || undefined,
      phone: form.phone || undefined,
    }
    createPlatformUser(payload)
      .then(() => {
        setShowForm(false)
        setForm(EMPTY_FORM)
        load()
      })
      .catch((err) => setFormError(err instanceof PlatformApiError ? err.message : 'error'))
      .finally(() => setSaving(false))
  }

  const toggleActive = (u: PlatformManagedUser) => {
    setBusyId(u.id)
    updatePlatformUser(u.id, { is_active: !u.is_active })
      .then(load)
      .catch(() => undefined)
      .finally(() => setBusyId(null))
  }

  const changeRole = (u: PlatformManagedUser, role: PlatformRole) => {
    setBusyId(u.id)
    updatePlatformUser(u.id, { role })
      .then(load)
      .catch(() => undefined)
      .finally(() => setBusyId(null))
  }

  const doReset = (u: PlatformManagedUser) => {
    if (resetPassword.length < 8) return
    setBusyId(u.id)
    updatePlatformUser(u.id, { new_password: resetPassword })
      .then(() => {
        setResetFor(null)
        setResetPassword('')
        setResetDone(u.id)
        setTimeout(() => setResetDone(null), 2500)
      })
      .catch(() => undefined)
      .finally(() => setBusyId(null))
  }

  const inputCls = 'w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5'

  return (
    <PlatformPageShell title={`${t('userManagement.title')} — PURE LINE`} description={t('userManagement.subtitle')}>
      <div className="container-px">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">{t('userManagement.eyebrow')}</span>
            <h1 className="mt-4 flex items-center gap-2.5 text-2xl font-black sm:text-3xl">
              <Users className="h-7 w-7 text-primary dark:text-secondary" /> {t('userManagement.title')}
            </h1>
            <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('userManagement.subtitle')}</p>
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? t('common.cancel') : t('userManagement.newUser')}
          </button>
        </div>

        {/* KPI row */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {([
            ['total', stats.total],
            ['admins', stats.admins],
            ['staff', stats.staff],
            ['customers', stats.customers],
            ['inactive', stats.inactive],
          ] as const).map(([k, v], i) => (
            <Reveal key={k} delay={i * 0.03}>
              <div className="rounded-2xl border border-black/5 bg-white p-4 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="text-2xl font-black">{v}</div>
                <div className="mt-1 text-xs font-semibold text-neutral-dark/50 dark:text-neutral-light/50">{t(`userManagement.stats.${k}`)}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Create form */}
        {showForm && (
          <Reveal>
            <form onSubmit={submit} className="mt-8 rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">{t('userManagement.newUser')}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder={t('userManagement.fields.username')} className={inputCls} />
                <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={t('userManagement.fields.password')} className={inputCls} />
                <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder={t('userManagement.fields.fullName')} className={inputCls} />
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as PlatformRole })} className={inputCls}>
                  {ROLES.map((r) => <option key={r} value={r}>{t(`userManagement.roles.${r}`)}</option>)}
                </select>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t('userManagement.fields.email')} className={inputCls} />
                {form.role === 'staff' && (
                  <input value={form.staff_title} onChange={(e) => setForm({ ...form, staff_title: e.target.value })} placeholder={t('userManagement.fields.staffTitle')} className={inputCls} />
                )}
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t('userManagement.fields.phone')} className={inputCls} />
              </div>
              {formError && <p className="mt-3 text-sm text-red-500">{formError}</p>}
              <button type="submit" disabled={saving} className="btn-primary mt-5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('userManagement.create')}
              </button>
            </form>
          </Reveal>
        )}

        {/* Filters */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-dark/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('userManagement.searchPlaceholder')} className={`${inputCls} ps-10`} />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', ...ROLES] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${roleFilter === r ? 'bg-primary text-white' : 'bg-black/5 text-neutral-dark/70 dark:bg-white/10 dark:text-neutral-light/70'}`}
              >
                {r === 'all' ? t('userManagement.allRoles') : t(`userManagement.roles.${r}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-24 text-red-500">
              <AlertTriangle className="h-6 w-6" />
              <p className="text-sm">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('userManagement.empty')}</div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
              <table className="w-full min-w-[820px] text-start text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-start text-[11px] font-bold uppercase tracking-wider text-neutral-dark/40 dark:border-white/10 dark:text-neutral-light/40">
                    <th className="px-5 py-4 text-start">{t('userManagement.columns.user')}</th>
                    <th className="px-5 py-4 text-start">{t('userManagement.columns.role')}</th>
                    <th className="px-5 py-4 text-start">{t('userManagement.columns.contact')}</th>
                    <th className="px-5 py-4 text-start">{t('userManagement.columns.created')}</th>
                    <th className="px-5 py-4 text-start">{t('userManagement.columns.status')}</th>
                    <th className="px-5 py-4 text-start">{t('userManagement.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                      <td className="px-5 py-4">
                        <div className="font-bold">{u.full_name}</div>
                        <div className="font-mono text-[11px] text-neutral-dark/40 dark:text-neutral-light/40">@{u.username}{u.staff_title ? ` · ${u.staff_title}` : ''}</div>
                      </td>
                      <td className="px-5 py-4">
                        {String(u.id) === String(me?.id ?? '') ? (
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${roleStyles[u.role]}`}>{t(`userManagement.roles.${u.role}`)} · {t('userManagement.you')}</span>
                        ) : (
                          <select
                            value={u.role}
                            disabled={busyId === u.id}
                            onChange={(e) => changeRole(u, e.target.value as PlatformRole)}
                            className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{t(`userManagement.roles.${r}`)}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-neutral-dark/60 dark:text-neutral-light/60">
                        <div>{u.email || '—'}</div>
                        <div>{u.phone || ''}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-neutral-dark/60 dark:text-neutral-light/60">
                        {new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(u.created_at))}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${u.is_active ? 'bg-secondary/15 text-primary dark:text-secondary' : 'bg-red-500/15 text-red-500'}`}>
                          {u.is_active ? t('userManagement.active') : t('userManagement.deactivated')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {String(u.id) !== String(me?.id ?? '') && (
                            <button
                              type="button"
                              disabled={busyId === u.id}
                              onClick={() => toggleActive(u)}
                              title={u.is_active ? t('userManagement.deactivate') : t('userManagement.activate')}
                              className={`rounded-lg p-2 transition ${u.is_active ? 'text-red-500 hover:bg-red-500/10' : 'text-primary hover:bg-primary/10 dark:text-secondary'}`}
                            >
                              {u.is_active ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                            </button>
                          )}
                          {resetFor === u.id ? (
                            <span className="flex items-center gap-1.5">
                              <input
                                type="password"
                                autoFocus
                                minLength={8}
                                value={resetPassword}
                                onChange={(e) => setResetPassword(e.target.value)}
                                placeholder={t('userManagement.newPassword')}
                                className="w-36 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
                              />
                              <button type="button" disabled={resetPassword.length < 8 || busyId === u.id} onClick={() => doReset(u)} className="rounded-lg p-1.5 text-primary hover:bg-primary/10 disabled:opacity-40 dark:text-secondary">
                                <Check className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => { setResetFor(null); setResetPassword('') }} className="rounded-lg p-1.5 text-neutral-dark/40 hover:bg-black/5 dark:text-neutral-light/40">
                                <X className="h-4 w-4" />
                              </button>
                            </span>
                          ) : resetDone === u.id ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-primary dark:text-secondary"><Check className="h-3.5 w-3.5" /> {t('userManagement.passwordChanged')}</span>
                          ) : (
                            <button type="button" onClick={() => { setResetFor(u.id); setResetPassword('') }} title={t('userManagement.resetPassword')} className="rounded-lg p-2 text-neutral-dark/50 transition hover:bg-black/5 dark:text-neutral-light/50 dark:hover:bg-white/10">
                              <KeyRound className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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
