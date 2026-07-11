import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Phone, Mail, MessageCircle, MapPin, Send, CheckCircle2 } from 'lucide-react'
import Reveal from '../ui/Reveal'

export default function Contact() {
  const { t } = useTranslation()
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setState('sending')
    // Client-side mock submit — wire to a real backend/email service here.
    setTimeout(() => setState('sent'), 1200)
  }

  const info = [
    { icon: Phone, label: 'contact.phone', value: '+966 53 037 0421', href: 'tel:+966530370421' },
    { icon: Mail, label: 'contact.email', value: 'motaseemabdall0@gmail.com', href: 'mailto:motaseemabdall0@gmail.com' },
    { icon: MessageCircle, label: 'contact.whatsapp', value: '+966 53 037 0421', href: 'https://wa.me/966530370421' },
    { icon: MapPin, label: 'contact.location', value: 'contact.locationValue', href: '#' },
  ]

  return (
    <section id="contact" className="py-24 sm:py-32">
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow">{t('contact.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h2 className="section-title mt-5">{t('contact.title')}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('contact.subtitle')}</p></Reveal>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {info.map((c) => (
                  <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                    className="group relative flex cursor-pointer items-start gap-4 overflow-hidden rounded-2xl border border-black/5 bg-white p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 active:scale-[0.98] dark:border-white/10 dark:bg-white/5">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white dark:text-secondary">
                      <c.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-gray">{t(c.label)}</div>
                      <div className="mt-0.5 truncate font-semibold transition-colors group-hover:text-primary dark:group-hover:text-secondary">{c.value.startsWith('contact.') ? t(c.value) : c.value}</div>
                    </div>
                    <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-primary to-accent transition-transform duration-300 group-hover:scale-x-100" />
                  </a>
                ))}
              </div>
              {/* embedded map */}
              <div className="overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
                <iframe
                  title="PURE LINE Location"
                  className="h-64 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps?q=Riyadh%20Saudi%20Arabia&output=embed"
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <form onSubmit={submit} className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="grid gap-5">
                <Field label={t('contact.form.name')} placeholder={t('contact.form.namePh')} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t('contact.form.email')} type="email" placeholder={t('contact.form.emailPh')} />
                  <Field label={t('contact.form.phone')} placeholder={t('contact.form.phonePh')} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">{t('contact.form.message')}</label>
                  <textarea required rows={4} placeholder={t('contact.form.messagePh')}
                    className="w-full rounded-xl border border-black/10 bg-neutral-light px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-white/5" />
                </div>
                <motion.button whileTap={{ scale: 0.98 }} disabled={state !== 'idle'} type="submit"
                  className="btn-primary w-full justify-center disabled:opacity-70">
                  {state === 'sent' ? <><CheckCircle2 className="h-4 w-4" /> {t('contact.form.success')}</>
                    : state === 'sending' ? t('contact.form.sending')
                    : <>{t('contact.form.send')} <Send className="h-4 w-4 rtl:-scale-x-100" /></>}
                </motion.button>
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Field({ label, type = 'text', placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">{label}</label>
      <input required type={type} placeholder={placeholder}
        className="w-full rounded-xl border border-black/10 bg-neutral-light px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-white/5" />
    </div>
  )
}
