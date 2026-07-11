import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'

export default function Hero() {
  const { t } = useTranslation()
  return (
    <section id="top" className="relative flex min-h-screen items-center overflow-hidden pt-24">
      {/* animated abstract smart-farm background */}
      <div className="absolute inset-0 -z-10 bg-mesh-green" />
      <div className="absolute inset-0 -z-10 opacity-[0.15] dark:opacity-[0.12]"
        style={{ backgroundImage: 'linear-gradient(#0F6B3A 1px, transparent 1px), linear-gradient(90deg, #0F6B3A 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      {/* circuit / leaf line art */}
      <svg className="absolute right-0 top-0 -z-10 h-full w-2/3 opacity-30" viewBox="0 0 600 600" fill="none" preserveAspectRatio="xMidYMid slice">
        <motion.path d="M300 550 C 300 400 380 380 420 300 C 460 220 420 140 500 100"
          stroke="#3CB371" strokeWidth="2" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.5, ease: 'easeInOut' }} />
        <motion.path d="M300 550 C 300 420 240 400 200 320 C 160 240 200 180 140 120"
          stroke="#D4AF37" strokeWidth="1.5" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.5, delay: 0.4, ease: 'easeInOut' }} />
        {[[420, 300], [500, 100], [200, 320], [140, 120], [300, 550]].map(([cx, cy], i) => (
          <motion.circle key={i} cx={cx} cy={cy} r="6" fill="#3CB371"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + i * 0.2 }} />
        ))}
      </svg>
      <div className="absolute -left-24 top-1/3 -z-10 h-96 w-96 rounded-full bg-secondary/20 blur-3xl animate-float" />
      <div className="absolute -right-16 bottom-1/4 -z-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      <div className="container-px">
        <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="eyebrow">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> {t('hero.badge')}
        </motion.span>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-6 max-w-4xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          {t('hero.title')}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-6 max-w-2xl text-lg text-neutral-dark/70 dark:text-neutral-light/70 sm:text-xl">
          {t('hero.subtitle')}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-10 flex flex-wrap gap-4">
          <a href="#about" className="btn-primary">{t('hero.learnMore')} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></a>
          <a href="#contact" className="btn-ghost">{t('hero.contactUs')}</a>
        </motion.div>
      </div>

      <motion.a href="#about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs font-medium text-neutral-gray">
        {t('hero.scroll')}
        <motion.span animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </motion.a>
    </section>
  )
}
