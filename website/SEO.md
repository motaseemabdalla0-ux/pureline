# PURE LINE — SEO Reference

## Target keywords
Agricultural Technology · Smart Farming · Modern Farms · Precision Agriculture ·
Farm Development · Smart Irrigation · Agricultural Solutions · Greenhouse · IoT Farming · Saudi AgriTech

## Global meta (index.html)
- **Title (EN):** PURE LINE | Agricultural Technology & Smart Farming Solutions
- **Title (AR):** بيور لاين | تقنيات زراعية وحلول الزراعة الذكية
- **Description (EN):** PURE LINE builds intelligent farms powered by technology, data and innovation. Smart farming, precision agriculture, advanced irrigation, greenhouse solutions and farm development.
- **Description (AR):** نبني مزارع ذكية مدعومة بالتقنية والبيانات والابتكار.
- **theme-color:** #0F6B3A
- Per-language `<title>`/`<meta description>` are injected at runtime via `react-helmet-async` (`src/components/ui/Seo.tsx`), including `html[lang]` and `html[dir]`.

## Open Graph / Twitter
- og:type = website · og:site_name = PURE LINE · og:url = https://pureline.com
- og:title = "PURE LINE | Future Agriculture Starts Here"
- og:description = "Intelligent farms powered by technology, data and innovation…"
- og:image = /og-image.svg · og:locale = en_US · og:locale:alternate = ar_SA
- twitter:card = summary_large_image (title + description mirrored)

## JSON-LD structured data
`Organization` schema embedded in `index.html`: name, alternateName (بيور لاين), url, logo, description,
foundingDate, areaServed (SA), address (Riyadh, SA), contactPoint (phone/email, EN+AR), sameAs social links.

## Per-section keyword mapping
| Section | Primary keywords |
|---|---|
| Hero | Agricultural Technology, Smart Farming, Future Agriculture |
| About | AgriTech company, agronomy, agricultural digital transformation |
| Services | Smart Farming Solutions, Farm Development, Advanced Irrigation, Greenhouse Solutions, Agricultural Consulting, Digital Transformation |
| Statistics | proven results, projects delivered, client satisfaction |
| Why Choose Us | industry expertise, sustainable farming, modern technology |
| Projects | Smart Farms, Irrigation Projects, Greenhouses, Farm Construction, Monitoring Systems, Precision Agriculture |
| Technology | IoT Sensors, Smart Irrigation, Satellite Monitoring, AI Analytics, Precision Agriculture |
| Platform | Farm Management Platform, farm monitoring software, agricultural SaaS |
| Contact | agricultural solutions Saudi Arabia, Riyadh smart farm |

## Recommendations
- Add a `sitemap.xml` and `robots.txt` at deploy time (served by nginx).
- Register hreflang alternates (`en`, `ar`) once real URLs exist.
- Replace `/og-image.svg` with a rendered 1200×630 PNG for social platforms that ignore SVG OG images.
