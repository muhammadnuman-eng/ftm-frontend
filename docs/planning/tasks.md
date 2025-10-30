# Localization Tasks

## Preparation
- [ ] Audit all user-visible copy (frontend, Payload collections/globals, emails) and document required locales & fallbacks.
- [ ] Confirm Arabic RTL expectations and gather locale-specific asset needs.

## CMS Configuration
- [ ] Enable localization in `payload.config.ts` with locales [`en`, `tr`, `de`, `ar`, `ms`] and default `en`.
- [ ] Update localized fields for each relevant collection/global (including slugs/meta) and migrate existing data if needed.
- [ ] Create editor documentation for managing translations within Payload.

## Frontend Foundation
- [ ] Install and configure `next-intl` with `i18n.config.ts` describing locale metadata and helper utilities.
- [ ] Update `apps/web/next.config.ts` and middleware to support `/[locale]` routing with `/` → `/en` redirects.
- [ ] Refactor `app/` routes under `[locale]` and wrap layouts with translation providers setting `lang`/`dir` attributes.

## Translation Resources & UI Updates
- [ ] Create `src/locales/{locale}.json` bundles and establish naming conventions / lint checks for translation keys.
- [ ] Replace hard-coded UI strings, metadata, and validation messages with localized lookups.
- [ ] Build/refresh language switcher with locale-aware navigation preserving current path.

## Data & SEO
- [ ] Update Payload data fetchers to request localized content with fallbacks and adjust ISR/SSG behavior per locale.
- [ ] Ensure localized slugs/routes align between Payload and Next.js generation.
- [ ] Implement localized SEO output (titles, descriptions, `hreflang`, sitemap updates) and verify Payload SEO plugin settings.

## Styling, QA, and Handoff
- [ ] Introduce RTL-aware styling utilities and visually QA Arabic pages for layout regressions.
- [ ] Add unit/integration tests for i18n helpers and fallback behavior; configure linting to catch untranslated literals.
- [ ] Document translator handoff workflow and checklist for adding new locales.
