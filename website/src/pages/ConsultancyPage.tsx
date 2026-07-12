import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Search, Loader2, AlertTriangle, Inbox, FileText } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { createConsultation, lookupConsultationsByEmail } from '../lib/platformApi'
import type { Consultation, ConsultationKind } from '../types/platform'

const KINDS: ConsultationKind[] = ['consultation', 'assessment', 'feasibility_study']

export default function ConsultancyPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'

  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [kind, setKind] = useState<ConsultationKind>('consultation')
  const [notes, setNotes] = useState('')

  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const [submitted, setSubmitted] = useState<Consultation | null>(null)

  const [lookupEmail, setLookupEmail] = useState('')
  const [consultations, setConsultations] = useState<Consultation[] | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState(false)
  const [lookupSearched, setLookupSearched] = useState(false)

  const inputCls = (err?: boolean) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary dark:bg-white/5 ${
      err ? 'border-red-400' : 'border-black/10 dark:border-white/10'
    }`

  const validate = () => {
    const next: Record<string, boolean> = {}
    if (!fullName.trim()) next.fullName = true
    if (!email.trim() || !email.includes('@')) next.email = true
    if (!phone.trim()) next.phone = true
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    if (!validate() || submitting) return
    setSubmitting(true)
    setSubmitError(false)
    try {
      const res = await createConsultation({
        customer: {
          full_name: fullName.trim(),
          company: company.trim() || undefined,
          email: email.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || undefined,
        },
        kind,
        notes: notes.trim() || undefined,
      })
      setSubmitted(res)
      setLookupEmail(email.trim())
    } catch {
      setSubmitError(true)
    } finally {
      setSubmitting(false)
    }
  }

  const runLookup = async (targetEmail: string) => {
    if (!targetEmail.trim()) return
    setLookupLoading(true)
    setLookupError(false)
    setLookupSearched(true)
    try {
      const res = await lookupConsultationsByEmail(targetEmail.trim())
      setConsultations(res)
    } catch {
      setLookupError(true)
      setConsultations(null)
    } finally {
      setLookupLoading(false)
    }
  }

  return (
    <PlatformPageShell title={`${t('consultancyPage.title')} — PURE LINE`} description={t('consultancyPage.subtitle')}>
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('consultancyPage.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h1 className="section-title mt-5">{t('consultancyPage.title')}</h1></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('consultancyPage.subtitle')}</p></Reveal>
        </div>

        {submitted ? (
          <Reveal className="mx-auto mt-12 max-w-xl rounded-3xl border border-black/5 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-secondary/15 text-secondary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-bold">{t('consultancyPage.successTitle')}</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-dark/60 dark:text-neutral-light/60">{t('consultancyPage.successBody')}</p>
          </Reveal>
        ) : (
          <Reveal delay={0.1} className="mx-auto mt-12 max-w-3xl rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-10">
            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('requestServicePage.fields.fullName')} className={inputCls(errors.fullName)} />
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t('requestServicePage.fields.company')} className={inputCls()} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('requestServicePage.fields.email')} type="email" className={inputCls(errors.email)} />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('requestServicePage.fields.phone')} className={inputCls(errors.phone)} />
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder={t('requestServicePage.fields.whatsapp')} className={inputCls()} />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-neutral-dark/60 dark:text-neutral-light/60">{t('consultancyPage.title')}</label>
                <div className="flex flex-wrap gap-2">
                  {KINDS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        kind === k ? 'bg-primary text-white' : 'bg-black/5 text-neutral-dark/70 dark:bg-white/10 dark:text-neutral-light/70'
                      }`}
                    >
                      {t(`consultancyPage.kind.${k}`)}
                    </button>
                  ))}
                </div>
              </div>

              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('consultancyPage.fields.notes')} rows={5} className={inputCls()} />

              {submitError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {t('requestServicePage.errorBody')}
                </div>
              )}

              <button onClick={submit} disabled={submitting} className="btn-primary w-full justify-center">
                {submitting ? t('consultancyPage.submitting') : t('consultancyPage.submit')}
              </button>
            </div>
          </Reveal>
        )}

        {/* Lookup */}
        <div className="mx-auto mt-20 max-w-2xl">
          <h2 className="text-center text-lg font-bold">{t('consultancyPage.lookupTitle')}</h2>
          <div className="mx-auto mt-6 flex max-w-xl gap-2">
            <input
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runLookup(lookupEmail)}
              type="email"
              placeholder={t('dashboardPage.emailPlaceholder')}
              className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
            />
            <button onClick={() => runLookup(lookupEmail)} disabled={lookupLoading} className="btn-primary shrink-0">
              {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="hidden sm:inline">{t('consultancyPage.lookup')}</span>
            </button>
          </div>

          {lookupError && (
            <Reveal className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {t('common.error')}
            </Reveal>
          )}

          {lookupSearched && !lookupLoading && !lookupError && consultations && consultations.length === 0 && (
            <Reveal className="mx-auto mt-10 max-w-md text-center">
              <Inbox className="mx-auto h-10 w-10 text-neutral-dark/30 dark:text-neutral-light/30" />
              <p className="mt-4 font-semibold">{t('consultancyPage.empty')}</p>
            </Reveal>
          )}

          {consultations && consultations.length > 0 && (
            <div className="mt-8 space-y-4">
              {consultations.map((c, i) => (
                <Reveal key={c.id} delay={i * 0.05}>
                  <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">{t(`consultancyPage.kind.${c.kind}`)}</h3>
                        <div className="mt-1 text-xs text-neutral-dark/50 dark:text-neutral-light/50">
                          {new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(c.created_at))}
                        </div>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary dark:text-secondary">
                        {t('consultancyPage.statusLabel')}: {c.status}
                      </span>
                    </div>
                    {c.notes && <p className="mt-3 text-sm text-neutral-dark/70 dark:text-neutral-light/70">{c.notes}</p>}
                    {c.advisory_report && (
                      <div className="mt-4 rounded-xl bg-black/5 p-4 dark:bg-white/10">
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">
                          <FileText className="h-3.5 w-3.5" /> {t('consultancyPage.advisoryReport')}
                        </div>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-dark/80 dark:text-neutral-light/80">{c.advisory_report}</p>
                      </div>
                    )}
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
