import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { LogoIcon } from '../components/ui/Logo'
import Seo from '../components/ui/Seo'

/* Admin stub — reserved for the future PURE LINE control panel. */
export default function AdminPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-mesh-green px-6 text-center">
      <Seo title="PURE LINE — Admin" />
      <div className="max-w-md">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary text-white shadow-xl">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div className="mt-6 flex items-center justify-center gap-2"><LogoIcon /></div>
        <h1 className="mt-6 text-3xl font-black">Admin Panel</h1>
        <p className="mt-3 text-neutral-dark/60 dark:text-neutral-light/60">
          The PURE LINE administration console is coming soon. This route is reserved for farm management, user administration and analytics.
        </p>
        <Link to="/" className="btn-primary mt-8"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /> Back to site</Link>
      </div>
    </div>
  )
}
