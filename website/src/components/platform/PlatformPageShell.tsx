import type { ReactNode } from 'react'
import Navbar from '../Navbar'
import Footer from '../Footer'
import Seo from '../ui/Seo'

interface PlatformPageShellProps {
  title?: string
  description?: string
  children: ReactNode
  /** Use a dark GIS-style page background instead of the default light one. */
  dark?: boolean
  className?: string
}

/** Shared page chrome (Seo + Navbar + Footer + top padding for the fixed
 * header) reused by every new platform route so they feel native to the
 * rest of the site rather than bolted-on standalone screens. */
export default function PlatformPageShell({ title, description, children, dark = false, className = '' }: PlatformPageShellProps) {
  return (
    <div className={dark ? 'bg-slate-950 text-slate-100' : ''}>
      <Seo title={title} description={description} />
      <Navbar />
      <main className={`min-h-screen pb-20 pt-28 ${className}`}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
