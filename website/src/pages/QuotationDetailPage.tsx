import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Download, Loader2, AlertTriangle, FileX } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { getQuotation, quotationPdfUrl } from '../lib/platformApi'
import type { Quotation } from '../types/platform'

export default function QuotationDetailPage() {
  const { quoteId } = useParams<{ quoteId: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const [quote, setQuote] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<'not_found' | 'error' | null>(null)

  useEffect(() => {
    if (!quoteId) return
    setLoading(true)
    setError(null)
    getQuotation(quoteId)
      .then(setQuote)
      .catch((e) => setError(e?.status === 404 ? 'not_found' : 'error'))
      .finally(() => setLoading(false))
  }, [quoteId])

  const fmtMoney = (n: number, currency: string) =>
    new Intl.NumberFormat(lang === 'ar' ? 'ar' : 'en', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)

  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(d))

  return (
    <PlatformPageShell title={`${t('quotationPage.title')} — PURE LINE`}>
      <div className="container-px">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-secondary">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('quotationPage.backToDashboard')}
        </Link>

        {loading && (
          <div className="mt-16 flex flex-col items-center justify-center gap-3 text-neutral-dark/50 dark:text-neutral-light/50">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-semibold">{t('quotationPage.loading')}</p>
          </div>
        )}

        {!loading && error && (
          <Reveal className="mx-auto mt-16 max-w-md text-center">
            {error === 'not_found' ? (
              <FileX className="mx-auto h-10 w-10 text-neutral-dark/30 dark:text-neutral-light/30" />
            ) : (
              <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
            )}
            <p className="mt-4 font-semibold">{error === 'not_found' ? t('quotationPage.notFound') : t('common.error')}</p>
          </Reveal>
        )}

        {!loading && !error && quote && (
          <Reveal delay={0.05} className="mx-auto mt-10 max-w-3xl rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/5 pb-6 dark:border-white/10">
              <div>
                <span className="eyebrow">{t('quotationPage.eyebrow')}</span>
                <h1 className="mt-2 text-2xl font-black">{t('quotationPage.title')}</h1>
                <div className="mt-2 font-mono text-xs text-neutral-dark/50 dark:text-neutral-light/50">{quote.quote_id}</div>
              </div>
              <a href={quotationPdfUrl(quote.quote_id)} className="btn-primary shrink-0">
                <Download className="h-4 w-4" /> {t('quotationPage.downloadPdf')}
              </a>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-dark/40 dark:text-neutral-light/40">{t('quotationPage.createdOn')}</div>
                <div className="mt-1 text-sm font-semibold">{fmtDate(quote.created_at)}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-dark/40 dark:text-neutral-light/40">{t('quotationPage.validUntil')}</div>
                <div className="mt-1 text-sm font-semibold">{fmtDate(quote.valid_until)}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-dark/40 dark:text-neutral-light/40">{t('serviceDetail.pricingLabel')}</div>
                <div className="mt-1 text-sm font-semibold uppercase">{quote.template}</div>
              </div>
            </div>

            <div className="mt-8 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="bg-black/5 text-start text-[11px] font-bold uppercase tracking-wider text-neutral-dark/50 dark:bg-white/10 dark:text-neutral-light/50">
                    <th className="px-4 py-3 text-start">{t('quotationPage.description')}</th>
                    <th className="px-4 py-3 text-end">{t('quotationPage.qty')}</th>
                    <th className="px-4 py-3 text-end">{t('quotationPage.unitPrice')}</th>
                    <th className="px-4 py-3 text-end">{t('quotationPage.lineTotal')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/10">
                  {quote.line_items.map((li, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">{li.description}</td>
                      <td className="px-4 py-3 text-end">{li.qty}</td>
                      <td className="px-4 py-3 text-end">{fmtMoney(li.unit_price, quote.currency)}</td>
                      <td className="px-4 py-3 text-end font-semibold">{fmtMoney(li.qty * li.unit_price, quote.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mx-auto mt-6 w-full max-w-xs ms-auto space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-dark/60 dark:text-neutral-light/60">{t('quotationPage.subtotal')}</span>
                <span className="font-semibold">{fmtMoney(quote.subtotal, quote.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-dark/60 dark:text-neutral-light/60">{t('quotationPage.tax', { percent: quote.tax_percent })}</span>
                <span className="font-semibold">{fmtMoney(quote.tax_amount, quote.currency)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-black/10 pt-2 text-base dark:border-white/10">
                <span className="font-bold">{t('quotationPage.total')}</span>
                <span className="font-black text-primary dark:text-secondary">{fmtMoney(quote.total, quote.currency)}</span>
              </div>
            </div>

            {quote.terms && (
              <div className="mt-8 border-t border-black/5 pt-6 dark:border-white/10">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">{t('quotationPage.terms')}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-dark/70 dark:text-neutral-light/70">{quote.terms}</p>
              </div>
            )}
          </Reveal>
        )}
      </div>
    </PlatformPageShell>
  )
}
