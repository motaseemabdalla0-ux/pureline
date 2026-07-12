import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, Loader2, AlertTriangle, Calendar, User2, FileText, Paperclip, Upload, Check,
} from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import { getOperation, getRegistryFarm, updateOperationStatus, uploadOperationAttachment, PlatformApiError } from '../lib/platformApi'
import { OPERATION_STATUSES, operationStatusDot, operationStatusStyles } from '../lib/operations'
import type { Operation, OperationStatus, RegistryFarm } from '../types/platform'

function LogTimeline({ operation }: { operation: Operation }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const entries = operation.log_entries.length > 0
    ? operation.log_entries
    : [{ status: operation.status, note: undefined, created_at: operation.created_at }]

  return (
    <ol className="space-y-0">
      {entries.map((entry, i) => (
        <li key={`${entry.created_at}-${i}`} className="relative ps-7 pb-6 last:pb-0">
          {i < entries.length - 1 && (
            <span className="absolute start-[7px] top-3 h-full w-px bg-black/10 dark:bg-white/10" />
          )}
          <span className={`absolute start-0 top-1 grid h-4 w-4 place-items-center rounded-full ${operationStatusDot[entry.status]}`}>
            <Check className="h-2.5 w-2.5 text-white" />
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${operationStatusStyles[entry.status]}`}>
              {t(`platformOperations.status.${entry.status}`)}
            </span>
            <span className="text-xs text-neutral-dark/40 dark:text-neutral-light/40">
              {new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(entry.created_at))}
            </span>
          </div>
          {entry.note && <p className="mt-1.5 text-sm text-neutral-dark/70 dark:text-neutral-light/70">{entry.note}</p>}
        </li>
      ))}
    </ol>
  )
}

function StatusChangeControl({ operation, onChanged }: { operation: Operation; onChanged: (op: Operation) => void }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<OperationStatus>(operation.status)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const save = async () => {
    if (saving) return
    setSaving(true)
    setError(false)
    try {
      const updated = await updateOperationStatus(operation.operation_id, status, note.trim() || undefined)
      setNote('')
      onChanged(updated)
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <h3 className="text-sm font-bold">{t('platformOperationDetail.changeStatus')}</h3>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value as OperationStatus)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {OPERATION_STATUSES.map((s) => <option key={s} value={s}>{t(`platformOperations.status.${s}`)}</option>)}
        </select>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('platformOperationDetail.notePlaceholder')}
          className="min-w-[180px] flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('platformOperationDetail.updateStatus')}
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red-500">{t('common.error')}</div>}
    </div>
  )
}

function AttachmentUploader({ operation, onUploaded }: { operation: Operation; onUploaded: (op: Operation) => void }) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(false)

  const onPick = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setError(false)
    try {
      const updated = await uploadOperationAttachment(operation.operation_id, file)
      onUploaded(updated)
    } catch {
      setError(true)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Paperclip className="h-4 w-4 text-primary dark:text-secondary" /> {t('platformOperationDetail.attachments')}
      </h3>
      {operation.attachments.length === 0 ? (
        <p className="mt-3 text-xs text-neutral-dark/50 dark:text-neutral-light/50">{t('platformOperationDetail.noAttachments')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {operation.attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-xl border border-black/5 px-3 py-2 text-xs dark:border-white/10">
              <FileText className="h-3.5 w-3.5 shrink-0 text-neutral-dark/40 dark:text-neutral-light/40" />
              {a.url ? (
                <a href={a.url} target="_blank" rel="noreferrer" className="truncate font-semibold text-primary hover:underline dark:text-secondary">{a.file_name}</a>
              ) : (
                <span className="truncate font-semibold">{a.file_name}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="btn-ghost mt-4 w-full justify-center text-xs"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {t('platformOperationDetail.uploadFile')}
      </button>
      {error && <div className="mt-2 text-xs text-red-500">{t('common.error')}</div>}
    </div>
  )
}

export default function OperationDetailPage() {
  const { operationId } = useParams<{ operationId: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const { user } = usePlatformAuth()
  const canManage = user?.role === 'admin' || user?.role === 'staff'

  const [operation, setOperation] = useState<Operation | null>(null)
  const [farm, setFarm] = useState<RegistryFarm | null>(null)
  const [error, setError] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!operationId) return
    setLoading(true)
    setError(false)
    setNotFound(false)
    getOperation(operationId)
      .then((op) => {
        setOperation(op)
        return getRegistryFarm(op.farm_code).then(setFarm).catch(() => setFarm(null))
      })
      .catch((err) => {
        if (err instanceof PlatformApiError && err.status === 404) setNotFound(true)
        else setError(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [operationId])

  if (loading) {
    return (
      <PlatformPageShell title={`${t('platformOperationDetail.title')} — PURE LINE`}>
        <div className="container-px"><div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>
      </PlatformPageShell>
    )
  }

  if (notFound || (error && !operation)) {
    return (
      <PlatformPageShell title={`${t('platformOperationDetail.title')} — PURE LINE`}>
        <div className="container-px">
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-neutral-dark/60 dark:text-neutral-light/60">
              {notFound ? t('platformOperationDetail.notFound') : t('common.error')}
            </p>
            <Link to="/platform/operations" className="btn-ghost mt-2">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('platformOperationDetail.backToList')}
            </Link>
          </div>
        </div>
      </PlatformPageShell>
    )
  }

  if (!operation) return null

  return (
    <PlatformPageShell title={`${t(`platformOperations.type.${operation.operation_type}`)} — PURE LINE`}>
      <div className="container-px">
        <Link to="/platform/operations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-secondary">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('platformOperationDetail.backToList')}
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-neutral-dark/40 dark:text-neutral-light/40">{operation.operation_id}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${operationStatusStyles[operation.status]}`}>
                {t(`platformOperations.status.${operation.status}`)}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">
              {t(`platformOperations.type.${operation.operation_type}`)} · {farm?.name ?? operation.farm_code}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-neutral-dark/60 dark:text-neutral-light/60">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(operation.scheduled_date))}
              </span>
              {operation.assigned_to && (
                <span className="flex items-center gap-1.5">
                  <User2 className="h-4 w-4" /> {operation.assigned_to}
                </span>
              )}
              <Link to={`/platform/farms/${operation.farm_code}`} className="font-semibold text-primary hover:underline dark:text-secondary">
                {operation.farm_code}
              </Link>
            </div>
          </div>
        </div>

        {operation.notes && (
          <Reveal delay={0.05} className="mt-6">
            <p className="rounded-2xl border border-black/5 bg-white p-5 text-sm text-neutral-dark/70 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-neutral-light/70">
              {operation.notes}
            </p>
          </Reveal>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">
                {t('platformOperationDetail.statusHistory')}
              </h2>
              <div className="mt-5">
                <LogTimeline operation={operation} />
              </div>
            </div>
          </Reveal>

          <div className="space-y-6 lg:col-span-2">
            {canManage && (
              <Reveal delay={0.05}>
                <StatusChangeControl operation={operation} onChanged={setOperation} />
              </Reveal>
            )}
            <Reveal delay={0.1}>
              <AttachmentUploader operation={operation} onUploaded={setOperation} />
            </Reveal>
          </div>
        </div>
      </div>
    </PlatformPageShell>
  )
}
