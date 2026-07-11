import { useTranslation } from 'react-i18next'
import { Users, Cpu, Award, Target } from 'lucide-react'
import Reveal from '../ui/Reveal'

export default function About() {
  const { t } = useTranslation()
  const cards = [
    { icon: Users, title: 'about.whoTitle', text: 'about.whoText' },
    { icon: Cpu, title: 'about.whatTitle', text: 'about.whatText' },
    { icon: Award, title: 'about.expertiseTitle', text: 'about.expertiseText' },
    { icon: Target, title: 'about.missionTitle', text: 'about.missionText' },
  ]
  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="container-px grid gap-14 lg:grid-cols-2 lg:items-center">
        <div>
          <Reveal><span className="eyebrow">{t('about.eyebrow')}</span></Reveal>
          <Reveal delay={0.05}><h2 className="section-title mt-5">{t('about.title')}</h2></Reveal>
          <Reveal delay={0.1}><p className="mt-6 text-lg text-neutral-dark/70 dark:text-neutral-light/70">{t('about.lead')}</p></Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {cards.map((c, i) => (
              <Reveal key={i} delay={0.1 + i * 0.08}>
                <div className="group h-full rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white dark:text-secondary">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-bold">{t(c.title)}</h3>
                  <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-light/60">{t(c.text)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* abstract supporting visual */}
        <Reveal delay={0.15}>
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl glass p-8">
            <div className="absolute inset-0 bg-mesh-green opacity-60" />
            <svg viewBox="0 0 400 400" className="relative h-full w-full">
              <defs>
                <linearGradient id="ab-g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#3CB371" /><stop offset="1" stopColor="#0F6B3A" />
                </linearGradient>
              </defs>
              {[...Array(5)].map((_, r) => (
                <g key={r} opacity={0.7 - r * 0.08}>
                  <ellipse cx="200" cy={90 + r * 55} rx={150 - r * 6} ry="20" fill="none" stroke="url(#ab-g)" strokeWidth="1.5" />
                  {[...Array(6)].map((_, c) => (
                    <circle key={c} cx={70 + c * 52} cy={90 + r * 55} r="4" fill={c % 3 === 0 ? '#D4AF37' : '#3CB371'} />
                  ))}
                </g>
              ))}
              <path d="M200 340 C 200 260 240 250 250 200 C 258 160 240 130 270 110"
                fill="none" stroke="#D4AF37" strokeWidth="2" />
            </svg>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
