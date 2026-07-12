import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, Loader2, AlertTriangle, Calendar, MapPin, Stethoscope, Star,
} from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import {
  createPestTreatment, getRegistryFarm, listPestDetections, listPestTreatments, listPestTypes,
  updatePestDetectionStatus, PlatformApiError,
} from '../lib/platformApi'
import { PEST_DETECTION_STATUSES, pestDetectionStatusStyles, pestRiskDot, pestRiskStyles } from '../lib/pests'
import type {
  CreatePestTreatmentPayload, PestDetection, PestDetectionStatus, PestTreatment, PestType, RegistryFarm,
} from '../types/platform'

function StatusChangeControl({ detection, onChanged }: { detection: PestDetection; onChanged: (d: PestDetection) => void }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<PestDetectionStatus>(detection.status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const save = async () => {
    if (saving) return
    setSaving(true)
    setError(false)
    try {
      const updated = await updatePestDetectionStatus(detection.detection_id, status)
      onChanged(updated)
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <h3 className="text-sm font-bold">{t('platformPestDetail.changeStatus')}</h3>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value as PestDetectionStatus)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          {PEST_DETECTION_STATUSES.map((s) => <option key={s} value={s}>{t(`platformPests.status.${s}`)}</option>)}
        </select>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('platformPestDetail.updateStatus')}
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red-500">{t('common.error')}</div>}
    </div>
  )
}

function LogTreatmentForm({ detection, onCreated }: { detection: PestDetection; onCreated: () => void }) {
  const { t } = useTranslation()
  const [method, setMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  const submit = async () => {
    if (submitting || !method.trim()) return
    setSubmitting(true)
    setError(false)
    try {
      const payload: CreatePestTreatmentPayload = {
        detection_id: detection.detection_id,
        method: method.trim(),
        notes: notes.trim() || undefined,
        effectiveness_rating: rating ? Number(rating) : undefined,
      }
      await createPestTreatment(payload)
      setMethod('')
      setNotes('')
      setRating('')
      onCreated()
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Stethoscope className="h-4 w-4 text-primary dark:text-secondary" /> {t('platformPestDetail.logTreatment.title')}
      </h3>
      <div className="mt-4 space-y-3">
        <input
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          placeholder={t('platformPestDetail.logTreatment.method')}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('platformPestDetail.logTreatment.notes')}
          rows={2}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        >
          <option value="">{t('platformPestDetail.logTreatment.selectRating')}</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} / 5</option>)}
        </select>
      </div>
      {error && <div className="mt-2 text-xs text-red-500">{t('common.error')}</div>}
      <button onClick={submit} disabled={submitting || !method.trim()} className="btn-primary mt-4 w-full justify-center">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('platformPestDetail.logTreatment.submit')}
      </button>
    </div>
  )
}

export default function PestDetectionDetailPage() {
  const { detectionId } = useParams<{ detectionId: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const { user } = usePlatformAuth()
  const canManage = user?.role === 'admin' || user?.role === 'staff'

  const [detection, setDetection] = useState<PestDetection | null>(null)
  const [farm, setFarm] = useState<RegistryFarm | null>(null)
  const [pestType, setPestType] = useState<PestType | null>(null)
  const [treatments, setTreatments] = useState<PestTreatment[]>([])
  const [error, setError] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadTreatments = (det: PestDetection) => {
    listPestTreatments()
      .then((all) => setTreatments(all.filter((tr) => String(tr.detection_id) === String(det.detection_id))))
      .catch(() => { /* non-fatal: treatment history simply stays empty */ })
  }

  const load = () => {
    if (!detectionId) return
    setLoading(true)
    setError(false)
    setNotFound(false)
    listPestDetections()
      .then((all) => {
        const found = all.find((d) => d.detection_id === detectionId)
        if (!found) {
          setNotFound(true)
          return
        }
        setDetection(found)
        loadTreatments(found)
        Promise.all([
          getRegistryFarm(found.farm_code).catch(() => null),
          listPestTypes().catch(() => []),
        ]).then(([f, types]) => {
          setFarm(f)
          setPestType(types.find((pt) => pt.id === found.pest_type_id) ?? null)
        })
      })
      .catch((err) => {
        if (err instanceof PlatformApiError && err.status === 404) setNotFound(true)
        else setError(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [detectionId])

  if (loading) {
    return (
      <PlatformPageShell title={`${t('platformPestDetail.title')} — PURE LINE`}>
        <div className="container-px"><div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>
      </PlatformPageShell>
    )
  }

  if (notFound || (error && !detection)) {
    return (
      <PlatformPageShell title={`${t('platformPestDetail.title')} — PURE LINE`}>
        <div className="container-px">
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-neutral-dark/60 dark:text-neutral-light/60">
              {notFound ? t('platformPestDetail.notFound') : t('common.error')}
            </p>
            <Link to="/platform/pests" className="btn-ghost mt-2">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('platformPestDetail.backToList')}
            </Link>
          </div>
        </div>
      </PlatformPageShell>
    )
  }

  if (!detection) return null

  return (
    <PlatformPageShell title={`${pestType?.name ?? detection.detection_id} — PURE LINE`}>
      <div className="container-px">
        <Link to="/platform/pests" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-secondary">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('platformPestDetail.backToList')}
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-neutral-dark/40 dark:text-neutral-light/40">{detection.detection_id}</span>
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${pestRiskStyles[detection.risk_level]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${pestRiskDot[detection.risk_level]}`} />
                {t(`platformPests.risk.${detection.risk_level}`)}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pestDetectionStatusStyles[detection.status]}`}>
                {t(`platformPests.status.${detection.status}`)}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">
              {pestType?.name ?? `#${detection.pest_type_id}`} · {farm?.name ?? detection.farm_code}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-neutral-dark/60 dark:text-neutral-light/60">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {t('platformPestDetail.detectedOn')}: {new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(detection.detected_date))}
              </span>
              <Link to={`/platform/farms/${detection.farm_code}`} className="font-semibold text-primary hover:underline dark:text-secondary">
                {detection.farm_code}
              </Link>
            </div>
          </div>
        </div>

        {detection.location_notes && (
          <Reveal delay={0.05} className="mt-6">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">
                <MapPin className="h-3.5 w-3.5" /> {t('platformPestDetail.locationNotes')}
              </div>
              <p className="mt-2 text-sm text-neutral-dark/70 dark:text-neutral-light/70">{detection.location_notes}</p>
            </div>
          </Reveal>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">
                {t('platformPestDetail.treatmentsSection')}
              </h2>
              {treatments.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-dark/50 dark:text-neutral-light/50">{t('platformPestDetail.noTreatments')}</p>
              ) : (
                <ol className="mt-5 space-y-0">
                  {treatments.map((tr, i) => (
                    <li key={tr.id} className="relative ps-6 pb-5 last:pb-0">
                      {i < treatments.length - 1 && (
                        <span className="absolute start-[5px] top-3 h-full w-px bg-black/10 dark:bg-white/10" />
                      )}
                      <span className="absolute start-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary dark:bg-secondary" />
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-neutral-dark/85 dark:text-neutral-light/85">{tr.method}</div>
                        {typeof tr.effectiveness_rating === 'number' && (
                          <span className="flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-[11px] font-semibold text-secondary">
                            <Star className="h-3 w-3" /> {t('platformPestDetail.effectiveness', { rating: tr.effectiveness_rating })}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-neutral-dark/45 dark:text-neutral-light/45">
                        {new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(tr.treatment_date))}
                      </div>
                      {tr.notes && <p className="mt-1.5 text-sm text-neutral-dark/70 dark:text-neutral-light/70">{tr.notes}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Reveal>

          <div className="space-y-6 lg:col-span-2">
            {canManage && (
              <Reveal delay={0.05}>
                <StatusChangeControl detection={detection} onChanged={setDetection} />
              </Reveal>
            )}
            {canManage && (
              <Reveal delay={0.1}>
                <LogTreatmentForm detection={detection} onCreated={() => loadTreatments(detection)} />
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </PlatformPageShell>
  )
}
