import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

export default function Seo({ title, description }: { title?: string; description?: string }) {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const t = title || (lang === 'ar'
    ? 'بيور لاين | تقنيات زراعية وحلول الزراعة الذكية'
    : 'PURE LINE | Agricultural Technology & Smart Farming Solutions')
  const d = description || (lang === 'ar'
    ? 'نبني مزارع ذكية مدعومة بالتقنية والبيانات والابتكار.'
    : 'We build intelligent farms powered by technology, data and innovation.')
  return (
    <Helmet htmlAttributes={{ lang, dir: lang === 'ar' ? 'rtl' : 'ltr' }}>
      <title>{t}</title>
      <meta name="description" content={d} />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
    </Helmet>
  )
}
