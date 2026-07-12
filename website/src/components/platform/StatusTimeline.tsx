import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import type { RequestStatus, StatusEvent } from '../../types/platform'

const ORDER: RequestStatus[] = ['submitted', 'under_review', 'quotation_sent', 'approved', 'in_progress', 'completed']

interface StatusTimelineProps {
  status: RequestStatus
  events?: StatusEvent[]
  className?: string
}

/** Horizontal step timeline: Submitted -> Under Review -> Quotation Sent ->
 * Approved -> In Progress -> Completed, with the current/reached steps lit. */
export default function StatusTimeline({ status, events, className = '' }: StatusTimelineProps) {
  const { t, i18n } = useTranslation()
  const currentIndex = Math.max(0, ORDER.indexOf(status))
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'

  const dateFor = (s: RequestStatus) => events?.find((e) => e.status === s)?.created_at

  return (
    <div className={`overflow-x-auto ${className}`}>
      <ol className="flex min-w-max items-start gap-1">
        {ORDER.map((s, i) => {
          const reached = i <= currentIndex
          const isCurrent = i === currentIndex
          const date = dateFor(s)
          return (
            <li key={s} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 px-2">
                <div
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    reached ? 'bg-primary text-white' : 'bg-black/10 text-neutral-dark/40 dark:bg-white/10 dark:text-neutral-light/40'
                  } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                >
                  {reached ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={`whitespace-nowrap text-[11px] font-semibold ${reached ? 'text-primary dark:text-secondary' : 'text-neutral-dark/40 dark:text-neutral-light/40'}`}>
                  {t(`dashboardPage.status.${s}`)}
                </span>
                {date && (
                  <span className="whitespace-nowrap text-[10px] text-neutral-dark/40 dark:text-neutral-light/40">
                    {new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric' }).format(new Date(date))}
                  </span>
                )}
              </div>
              {i < ORDER.length - 1 && (
                <div className={`mt-[-18px] h-0.5 w-8 shrink-0 sm:w-12 ${i < currentIndex ? 'bg-primary' : 'bg-black/10 dark:bg-white/10'}`} />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
