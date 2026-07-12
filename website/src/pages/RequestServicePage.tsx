import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Paperclip, ArrowUpRight, AlertTriangle } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { SERVICES } from '../data/services'
import { createServiceRequest, rememberMyRequest, uploadAttachment } from '../lib/platformApi'
import type { RequestPriority } from '../types/platform'

const PRIORITIES: RequestPriority[] = ['low', 'normal', 'high', 'urgent']

export default function RequestServicePage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const initialService = params.get('service') || ''

  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [farmName, setFarmName] = useState('')
  const [farmLocation, setFarmLocation] = useState('')
  const [farmSize, setFarmSize] = useState('')
  const [cropType, setCropType] = useState('')
  const [serviceSlug, setServiceSlug] = useState(initialService)
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<RequestPriority>('normal')
  const [file, setFile] = useState<File | null>(null)

  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [attachmentNote, setAttachmentNote] = useState<'ok' | 'failed' | null>(null)

  const validate = () => {
    const next: Record<string, boolean> = {}
    if (!fullName.trim()) next.fullName = true
    if (!email.trim() || !email.includes('@')) next.email = true
    if (!phone.trim()) next.phone = true
    if (!serviceSlug) next.service = true
    if (!description.trim()) next.description = true
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    if (!validate() || submitting) return
    setSubmitting(true)
    setSubmitError(false)
    try {
      const service = SERVICES.find((s) => s.slug === serviceSlug)
      const res = await createServiceRequest({
        customer: {
          full_name: fullName.trim(),
          company: company.trim() || undefined,
          email: email.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || undefined,
        },
        farm_name: farmName.trim() || undefined,
        farm_location: farmLocation.trim() || undefined,
        farm_size: farmSize.trim() || undefined,
        crop_type: cropType.trim() || undefined,
        service_slug: serviceSlug,
        service_name: service ? t(`services.items.${service.key}.title`) : serviceSlug,
        description: description.trim(),
        priority,
      })
      rememberMyRequest(res.request_id, email.trim())
      if (file) {
        try {
          await uploadAttachment(res.request_id, file)
          setAttachmentNote('ok')
        } catch {
          setAttachmentNote('failed')
        }
      }
      setRequestId(res.request_id)
    } catch (e) {
      setSubmitError(true)
      void e
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setFullName(''); setCompany(''); setEmail(''); setPhone(''); setWhatsapp('')
    setFarmName(''); setFarmLocation(''); setFarmSize(''); setCropType('')
    setServiceSlug(''); setDescription(''); setPriority('normal'); setFile(null)
    setRequestId(null); setSubmitError(false); setAttachmentNote(null); setErrors({})
  }

  if (requestId) {
    return (
      <PlatformPageShell title={t('requestServicePage.successTitle')}>
        <div className="container-px">
          <Reveal className="mx-auto max-w-xl rounded-3xl border border-black/5 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-secondary/15 text-secondary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-6 text-2xl font-bold">{t('requestServicePage.successTitle')}</h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-dark/60 dark:text-neutral-light/60">{t('requestServicePage.successBody')}</p>
            <div className="mx-auto mt-6 w-fit rounded-2xl bg-primary/5 px-6 py-3 font-mono text-lg font-bold text-primary dark:text-secondary">
              {requestId}
            </div>
            {attachmentNote === 'ok' && <p className="mt-3 text-xs text-secondary">{t('requestServicePage.attachmentUploaded')}</p>}
            {attachmentNote === 'failed' && <p className="mt-3 text-xs text-red-500">{t('requestServicePage.attachmentFailed')}</p>}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/dashboard" className="btn-primary">{t('requestServicePage.goToDashboard')} <ArrowUpRight className="h-4 w-4 rtl:-scale-x-90" /></Link>
              <button onClick={reset} className="btn-ghost">{t('requestServicePage.submitAnother')}</button>
            </div>
          </Reveal>
        </div>
      </PlatformPageShell>
    )
  }

  const inputCls = (err?: boolean) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary dark:bg-white/5 ${
      err ? 'border-red-400' : 'border-black/10 dark:border-white/10'
    }`

  return (
    <PlatformPageShell title={`${t('requestServicePage.title')} — PURE LINE`} description={t('requestServicePage.subtitle')}>
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('requestServicePage.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h1 className="section-title mt-5">{t('requestServicePage.title')}</h1></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('requestServicePage.subtitle')}</p></Reveal>
        </div>

        <Reveal delay={0.1} className="mx-auto mt-12 max-w-3xl rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-10">
          <div className="space-y-10">
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary dark:text-secondary">{t('requestServicePage.sections.customer')}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('requestServicePage.fields.fullName')} className={inputCls(errors.fullName)} />
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t('requestServicePage.fields.company')} className={inputCls()} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('requestServicePage.fields.email')} type="email" className={inputCls(errors.email)} />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('requestServicePage.fields.phone')} className={inputCls(errors.phone)} />
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder={t('requestServicePage.fields.whatsapp')} className={inputCls()} />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary dark:text-secondary">{t('requestServicePage.sections.farm')}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder={t('requestServicePage.fields.farmName')} className={inputCls()} />
                <input value={farmLocation} onChange={(e) => setFarmLocation(e.target.value)} placeholder={t('requestServicePage.fields.farmLocation')} className={inputCls()} />
                <input value={farmSize} onChange={(e) => setFarmSize(e.target.value)} placeholder={t('requestServicePage.fields.farmSize')} className={inputCls()} />
                <input value={cropType} onChange={(e) => setCropType(e.target.value)} placeholder={t('requestServicePage.fields.cropType')} className={inputCls()} />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary dark:text-secondary">{t('requestServicePage.sections.service')}</h2>
              <div className="mt-4 grid gap-4">
                <select value={serviceSlug} onChange={(e) => setServiceSlug(e.target.value)} className={inputCls(errors.service)}>
                  <option value="">{t('requestServicePage.selectService')}</option>
                  {SERVICES.map((s) => (
                    <option key={s.slug} value={s.slug}>{t(`services.items.${s.key}.title`)}</option>
                  ))}
                </select>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('requestServicePage.fields.description')} rows={5} className={inputCls(errors.description)} />
                <div>
                  <label className="mb-2 block text-xs font-semibold text-neutral-dark/60 dark:text-neutral-light/60">{t('requestServicePage.fields.priority')}</label>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          priority === p ? 'bg-primary text-white' : 'bg-black/5 text-neutral-dark/70 dark:bg-white/10 dark:text-neutral-light/70'
                        }`}
                      >
                        {t(`requestServicePage.priority.${p}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-black/15 px-4 py-4 text-sm text-neutral-dark/60 dark:border-white/15 dark:text-neutral-light/60">
                  <Paperclip className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{file ? file.name : t('requestServicePage.fields.attachment')}</span>
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            </section>

            {submitError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {t('requestServicePage.errorBody')}
              </div>
            )}

            <button onClick={submit} disabled={submitting} className="btn-primary w-full justify-center">
              {submitting ? t('requestServicePage.submitting') : t('requestServicePage.submit')}
            </button>
          </div>
        </Reveal>
      </div>
    </PlatformPageShell>
  )
}
