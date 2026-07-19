# PURE LINE — Website

Premium bilingual (EN/AR) marketing site for **PURE LINE**, an Agricultural Technology company.
Built with **Vite + React 18 + TypeScript + TailwindCSS + Framer Motion + react-i18next**.

## Features
- Fully responsive, mobile-first, fast, SEO-ready (react-helmet-async + JSON-LD Organization schema).
- Bilingual English / Arabic with full **RTL** layout flip (`dir="rtl"` + Tailwind `rtl:` variants).
- Dark mode (Tailwind `class` strategy) with a persisted navbar toggle.
- Framer Motion scroll-reveal, hover states and animated counters throughout.
- CSS/SVG-only atmospheric backgrounds (gradient meshes, circuit/leaf line-art) — no image placeholders.
- One-page layout: Hero, About, Services, Stats, Why Choose Us, Projects (filterable), Technology, Farm Management Platform (interactive SaaS dashboard mockup), Contact.
- Routes: `/` (site), `/chat` (AI assistant UI), `/admin` (stub).

## Getting started
```bash
npm install
npm run dev      # http://localhost:5173
```

## Production build
```bash
npm run build    # type-checks (tsc -b) then builds to dist/
npm run preview  # preview the production build locally
```

## Structure
```
src/
  components/
    Navbar.tsx  Footer.tsx  FarmDashboard.tsx
    sections/   Hero About Services Stats WhyChooseUs Projects Technology Platform Contact
    ui/         Logo Reveal Counter Seo
  locales/      en.json  ar.json
  pages/        ChatPage.tsx  AdminPage.tsx
  lib/          theme.ts
  App.tsx  main.tsx  i18n.ts  index.css
public/         favicon.svg  og-image.svg
```

## Theming
Colors live in `tailwind.config.js`:
- primary `#0F6B3A`, secondary `#3CB371`, accent gold `#D4AF37`, neutrals.
Fonts (Google Fonts, loaded in `index.html`): **Inter** (Latin) and **Tajawal / Cairo** (Arabic, applied when `dir="rtl"`).

## Notes
- The contact form and chat UI are client-side. The chat page `fetch`es `/api/chat` — point it at the FastAPI backend in `../chatbot/backend`.
test
