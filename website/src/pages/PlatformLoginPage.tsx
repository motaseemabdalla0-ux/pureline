import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { Lock, User, Loader2, AlertTriangle, Info, LayoutDashboard } from 'lucide-react'
import PlatformPageShell from '../components/platform/PlatformPageShell'
import Reveal from '../components/ui/Reveal'
import { usePlatformAuth } from '../contexts/PlatformAuthContext'
import { PlatformApiError } from '../lib/platformApi'

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'Pureline@2026', roleKey: 'admin' },
  { username: 'agronomist1', password: 'Pureline@2026', roleKey: 'staff' },
  { username: 'customer1', password: 'Pureline@2026', roleKey: 'customer' },
] as const

export default function PlatformLoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isAuthenticated, isLoading } = usePlatformAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectTo = searchParams.get('redirect') || '/platform/dashboard'

  if (!isLoading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const submit = async () => {
    if (submitting || !username.trim() || !password) return
    setSubmitting(true)
    setError(null)
    try {
      await login(username.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      if (err instanceof PlatformApiError && err.status === 401) {
        setError(t('platformLoginPage.invalidCredentials'))
      } else {
        setError(t('common.error'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
    setError(null)
  }

  return (
    <PlatformPageShell title={`${t('platformLoginPage.title')} — PURE LINE`} description={t('platformLoginPage.subtitle')}>
      <div className="container-px">
        <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-white/5 sm:p-10">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg">
                <LayoutDashboard className="h-7 w-7" />
              </div>
              <h1 className="mt-5 text-center text-2xl font-black">{t('platformLoginPage.title')}</h1>
              <p className="mt-2 text-center text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t('platformLoginPage.subtitle')}</p>

              <div className="mt-8 space-y-4 text-start">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-dark/60 dark:text-neutral-light/60">
                    {t('platformLoginPage.username')}
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-dark/40 dark:text-neutral-light/40" />
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submit()}
                      type="text"
                      autoComplete="username"
                      placeholder={t('platformLoginPage.usernamePlaceholder')}
                      className="w-full rounded-xl border border-black/10 bg-white py-3 ps-10 pe-4 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-dark/60 dark:text-neutral-light/60">
                    {t('platformLoginPage.password')}
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-dark/40 dark:text-neutral-light/40" />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submit()}
                      type="password"
                      autoComplete="current-password"
                      placeholder={t('platformLoginPage.passwordPlaceholder')}
                      className="w-full rounded-xl border border-black/10 bg-white py-3 ps-10 pe-4 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-xs font-semibold text-red-500">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
                  </div>
                )}

                <button onClick={submit} disabled={submitting} className="btn-gradient w-full justify-center">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('platformLoginPage.submit')}
                </button>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="order-1 lg:order-2">
            <div className="rounded-3xl border border-accent/20 bg-accent/5 p-6 sm:p-8">
              <div className="flex items-center gap-2 text-sm font-bold text-accent">
                <Info className="h-4 w-4" /> {t('platformLoginPage.demoTitle')}
              </div>
              <p className="mt-2 text-xs text-neutral-dark/60 dark:text-neutral-light/60">{t('platformLoginPage.demoHint')}</p>
              <div className="mt-5 space-y-3">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => fillDemo(acc.username, acc.password)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 text-start text-xs shadow-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/5"
                  >
                    <div>
                      <div className="font-mono font-bold text-neutral-dark dark:text-neutral-light">{acc.username}</div>
                      <div className="gis-readout mt-0.5 !text-neutral-dark/40 dark:!text-neutral-light/40">{acc.password}</div>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary dark:text-secondary">
                      {t(`platformLoginPage.roles.${acc.roleKey}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </PlatformPageShell>
  )
}
