import { useTranslation } from 'react-i18next'
import Reveal from '../ui/Reveal'
import FarmDashboard from '../FarmDashboard'

export default function Platform() {
  const { t } = useTranslation()
  return (
    <section id="platform" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-neutral-light dark:bg-white/[0.02]" />
      <div className="container-px">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal><span className="eyebrow">{t('platform.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h2 className="section-title mt-5">{t('platform.title')}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-4 text-lg text-neutral-dark/60 dark:text-neutral-light/60">{t('platform.subtitle')}</p></Reveal>
        </div>

        {/* browser window frame mockup */}
        <Reveal delay={0.15}>
          <div className="mx-auto mt-14 max-w-6xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl shadow-primary/10 dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-black/5 bg-slate-100 px-4 py-3 dark:border-white/5 dark:bg-slate-800">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <div className="mx-auto flex items-center gap-2 rounded-md bg-white px-4 py-1 text-xs text-slate-400 dark:bg-slate-900">
                <span className="h-2 w-2 rounded-full bg-secondary" /> {t('platform.browserUrl')}
              </div>
            </div>
            <FarmDashboard />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
