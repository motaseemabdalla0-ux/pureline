import { FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Map as MapIcon, Loader2, AlertTriangle, Plus, X, Tractor, ToggleLeft, ToggleRight } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import { createRegion, listRegions, updateRegion, PlatformApiError } from '../lib/platformApi'
import type { CreateRegionPayload, Region } from '../types/platform'

const EMPTY_FORM: CreateRegionPayload = { code: '', name: '' }

export default function RegionsManagementPage() {
  const { t, i18n } = useTranslation()
  const { user } = usePlatformAuth()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const isAdmin = user?.role === 'admin'

  const [regions, setRegions] = useState<Region[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateRegionPayload>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    setError(false)
    listRegions(true)
      .then(setRegions)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    createRegion(form)
      .then(() => {
        setShowForm(false)
        setForm(EMPTY_FORM)
        load()
      })
      .catch((err) => setFormError(err instanceof PlatformApiError ? err.message : 'error'))
      .finally(() => setSaving(false))
  }

  const toggleActive = (r: Region) => {
    setBusyId(r.id)
    updateRegion(r.id, { is_active: !r.is_active })
      .then(load)
      .catch(() => undefined)
      .finally(() => setBusyId(null))
  }

  const inputCls = 'w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5'

  return (
    <PlatformPageShell title={`${t('regionsPage.title')} — PURE LINE`} description={t('regionsPage.subtitle')}>
      <div className="container-px">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">{t('regionsPage.eyebrow')}</span>
            <h1 className="mt-4 flex items-center gap-2.5 text-2xl font-black sm:text-3xl">
              <MapIcon className="h-7 w-7 text-primary dark:text-secondary" /> {t('regionsPage.title')}
            </h1>
            <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('regionsPage.subtitle')}</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? t('common.cancel') : t('regionsPage.newRegion')}
            </button>
          )}
        </div>

        {showForm && isAdmin && (
          <Reveal>
            <form onSubmit={submit} className="mt-8 rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">{t('regionsPage.newRegion')}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder={t('regionsPage.fields.code')} className={inputCls} />
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('regionsPage.fields.name')} className={inputCls} />
                <input dir="rtl" value={form.name_ar ?? ''} onChange={(e) => setForm({ ...form, name_ar: e.target.value || undefined })} placeholder={t('regionsPage.fields.nameAr')} className={inputCls} />
                <input value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value || undefined })} placeholder={t('regionsPage.fields.description')} className={inputCls} />
              </div>
              {formError && <p className="mt-3 text-sm text-red-500">{formError}</p>}
              <button type="submit" disabled={saving} className="btn-primary mt-5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('regionsPage.create')}
              </button>
            </form>
          </Reveal>
        )}

        <div className="mt-12">
          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-24 text-red-500">
              <AlertTriangle className="h-6 w-6" />
              <p className="text-sm">{t('common.error')}</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(regions ?? []).map((r, i) => (
                <Reveal key={r.id} delay={i * 0.04}>
                  <div className={`flex h-full flex-col rounded-3xl border p-6 shadow-sm transition ${r.is_active ? 'border-black/5 bg-white dark:border-white/10 dark:bg-white/5' : 'border-dashed border-black/15 bg-black/[0.02] opacity-70 dark:border-white/15 dark:bg-white/[0.02]'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-mono text-[11px] text-neutral-dark/40 dark:text-neutral-light/40">{r.code}</div>
                        <h3 className="mt-1 font-bold">{lang === 'ar' && r.name_ar ? r.name_ar : r.name}</h3>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => toggleActive(r)}
                          title={r.is_active ? t('regionsPage.deactivate') : t('regionsPage.activate')}
                          className={r.is_active ? 'text-primary dark:text-secondary' : 'text-neutral-dark/40 dark:text-neutral-light/40'}
                        >
                          {r.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                        </button>
                      )}
                    </div>
                    {r.description && (
                      <p className="mt-3 text-xs leading-relaxed text-neutral-dark/60 dark:text-neutral-light/60">{r.description}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-5">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-dark/60 dark:text-neutral-light/60">
                        <Tractor className="h-4 w-4 text-primary/70 dark:text-secondary/70" />
                        {t('regionsPage.farmCount', { count: r.farm_count })}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${r.is_active ? 'bg-secondary/15 text-primary dark:text-secondary' : 'bg-black/5 text-neutral-dark/50 dark:bg-white/10 dark:text-neutral-light/50'}`}>
                        {r.is_active ? t('regionsPage.active') : t('regionsPage.inactive')}
                      </span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </PlatformPageShell>
  )
}
