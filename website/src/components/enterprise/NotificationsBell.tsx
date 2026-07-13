import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Bell, Check } from 'lucide-react'
import { getUnreadCount, listNotifications, markNotificationRead } from '../../lib/platformApi'
import type { PlatformNotification } from '../../types/platform'

const kindColors: Record<string, string> = {
  pest: 'bg-red-500', operation: 'bg-accent', irrigation: 'bg-blue-500',
  recycling: 'bg-secondary', user: 'bg-purple-500', system: 'bg-neutral-dark/40', info: 'bg-primary',
}

/** RCU-style notifications bell: unread badge + dropdown with the latest
 * notifications; polls the unread count every 60 s. */
export default function NotificationsBell() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<PlatformNotification[] | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const refreshCount = () => {
    getUnreadCount().then((r) => setUnread(r.unread)).catch(() => undefined)
  }

  useEffect(() => {
    refreshCount()
    const id = setInterval(refreshCount, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      listNotifications().then((n) => setItems(n.slice(0, 8))).catch(() => setItems([]))
    }
  }

  const readOne = (n: PlatformNotification) => {
    if (n.read) return
    markNotificationRead(n.id)
      .then(() => {
        setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null)
        refreshCount()
      })
      .catch(() => undefined)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={t('notifications.title')}
        className="relative rounded-full p-2.5 text-neutral-dark/70 transition hover:bg-primary/10 hover:text-primary dark:text-neutral-light/70 dark:hover:text-secondary"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-full z-[900] mt-2 w-80 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-neutral-dark">
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">{t('notifications.title')}</span>
            <Link to="/platform/notifications" onClick={() => setOpen(false)} className="text-xs font-semibold text-primary hover:underline dark:text-secondary">
              {t('notifications.viewAll')}
            </Link>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items === null ? (
              <div className="px-4 py-6 text-center text-xs text-neutral-dark/40 dark:text-neutral-light/40">…</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-neutral-dark/40 dark:text-neutral-light/40">{t('notifications.empty')}</div>
            ) : (
              items.map((n) => (
                <div key={n.id} className={`border-b border-black/5 px-4 py-3 last:border-0 dark:border-white/5 ${n.read ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${kindColors[n.kind] ?? kindColors.info}`} />
                    <div className="min-w-0 flex-1">
                      {n.link ? (
                        <Link to={n.link} onClick={() => { readOne(n); setOpen(false) }} className="block text-xs font-bold hover:text-primary dark:hover:text-secondary">
                          {n.title}
                        </Link>
                      ) : (
                        <div className="text-xs font-bold">{n.title}</div>
                      )}
                      {n.body && <div className="mt-0.5 truncate text-[11px] text-neutral-dark/50 dark:text-neutral-light/50">{n.body}</div>}
                      <div className="mt-1 text-[10px] text-neutral-dark/35 dark:text-neutral-light/35">
                        {new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(n.created_at))}
                      </div>
                    </div>
                    {!n.read && (
                      <button type="button" onClick={() => readOne(n)} title={t('notifications.markRead')} className="rounded p-1 text-neutral-dark/40 hover:bg-black/5 dark:text-neutral-light/40 dark:hover:bg-white/10">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
