import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import SatelliteImage from '../ui/SatelliteImage'

export default function Hero() {
  const { t } = useTranslation()
  return (
    <section id="top" className="relative flex min-h-screen items-center overflow-hidden pt-24">
      {/* Real satellite-imagery background (NASA GIBS, dark-graded for text legibility) */}
      <div className="absolute inset-0 -z-20">
        <SatelliteImage source="alula_wide" variant="dark" alt={t('hero.imageAlt')} className="h-full w-full" priority showAttribution={false} />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-neutral-dark via-neutral-dark/60 to-neutral-dark/20 dark:from-neutral-dark dark:via-neutral-dark/70 dark:to-neutral-dark/30" />
      <div className="absolute inset-0 -z-10 opacity-[0.1]"
        style={{ backgroundImage: 'linear-gradient(#3CB371 1px, transparent 1px), linear-gradient(90deg, #3CB371 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="gis-scanline -z-10" aria-hidden="true" />
      <div className="absolute -left-24 top-1/3 -z-10 h-96 w-96 rounded-full bg-secondary/10 blur-3xl animate-float" />
      <div className="absolute -right-16 bottom-1/4 -z-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      <div className="container-px">
        <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="eyebrow bg-white/10 text-white border-white/20 dark:bg-primary/5 dark:text-secondary dark:border-primary/20">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> {t('hero.badge')}
        </motion.span>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-6 max-w-4xl text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
          {t('hero.title')}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-6 max-w-2xl text-lg text-white/75 sm:text-xl">
          {t('hero.subtitle')}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-10 flex flex-wrap gap-4">
          <a href="#about" className="btn-primary">{t('hero.learnMore')} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></a>
          <a href="#contact" className="btn-ghost border-white/30 text-white hover:bg-white/10 dark:border-primary/30 dark:text-secondary dark:hover:bg-primary/5">{t('hero.contactUs')}</a>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="gis-readout mt-8 inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-white/60 backdrop-blur-sm">
          {t('hero.coords')}
        </motion.div>
      </div>

      <motion.a href="#about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs font-medium text-white/70">
        {t('hero.scroll')}
        <motion.span animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </motion.a>
    </section>
  )
}
