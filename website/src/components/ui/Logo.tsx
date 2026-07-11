import { useTranslation } from 'react-i18next'

/* PRIMARY BRAND MARK — Concept 1 "Growth + Technology"
   A leaf whose central vein is a circuit line with sensor nodes. */
export function LogoIcon({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="pl-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3CB371" />
          <stop offset="1" stopColor="#0F6B3A" />
        </linearGradient>
      </defs>
      {/* leaf body */}
      <path d="M52 12C30 12 14 26 14 46c0 2 .3 4 .8 6C34 52 50 36 52 12Z"
        fill="url(#pl-leaf)" />
      {/* leaf lower fold */}
      <path d="M14.8 52C10 40 12 24 30 16 20 28 16 40 14.8 52Z" fill="#0F6B3A" opacity="0.55" />
      {/* circuit vein */}
      <path d="M15 51 L44 20" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M27 38 L36 40 M33 33 L40 30" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* sensor nodes */}
      <circle cx="44" cy="20" r="3.4" fill="#D4AF37" />
      <circle cx="36" cy="40" r="2.4" fill="#D4AF37" />
      <circle cx="40" cy="30" r="2.2" fill="#D4AF37" />
    </svg>
  )
}

export default function Logo({ light = false }: { light?: boolean }) {
  const { i18n } = useTranslation()
  const ar = i18n.language === 'ar'
  return (
    <span className="flex items-center gap-2.5 select-none">
      <LogoIcon />
      <span className="flex flex-col leading-none">
        <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-neutral-dark dark:text-white'}`}>
          {ar ? 'بيور لاين' : 'PURE LINE'}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
          {ar ? 'تقنيات زراعية' : 'AgriTech'}
        </span>
      </span>
    </span>
  )
}
