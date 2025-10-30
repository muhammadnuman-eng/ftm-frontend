# Localization Plan

## Objectives
- Internationalize the Next.js frontend and Payload CMS content for `en`, `tr`, `de`, `ar`, `ms`, with `en` as the default.
- Ensure CMS-authored content is editable per locale using Payload's built-in localization features.
- Replace all hard-coded UI copy with maintainable translation resources.
- Maintain SEO, accessibility, and RTL support where required (Arabic).
- Keep the architecture flexible so new locales can be introduced with minimal code changes.

## Strategy
1. **Assess & Scope**
   - Inventory user-facing copy: Payload collections/globals, static site sections, emails, validation messages, metadata.
   - Identify RTL needs, locale-specific assets, and any language-specific compliance requirements.
   - Confirm fallback behavior (e.g., default to English when a translation is missing).

2. **Configure Payload Localization**
   - Enable localization in `payload.config.ts` with the five locales and default `en`.
   - Update each relevant collection/global to mark localized fields, including slugs, meta tags, and media captions if surfaced.
   - Document editor workflow for switching locales and publishing translations.

3. **Set Up Frontend i18n Framework**
   - Add `next-intl` (or comparable) and create `i18n.config.ts` describing locale metadata (code, label, direction).
   - Update `apps/web/next.config.ts` to register the locale list and enable localized routing.
   - Expose utilities (helpers/hooks) to read the active locale, generate locale-aware routes, and format dates/numbers.

4. **Restructure App Routing**
   - Move existing routes under `app/[locale]/` and adjust layouts to read the locale segment.
   - Wrap root layout with the translation provider (server + client components as needed).
   - Set `<html lang>` and `dir` attributes dynamically; ensure middleware redirects `/` to `/en` and leaves APIs/static files untouched.

5. **Create Translation Resources**
   - Establish `src/locales/{locale}.json` (or module-based) message bundles for non-CMS strings.
   - Implement tooling or lint rules to flag untranslated literals.
   - Define key naming conventions and contribution guidelines for translators/developers.

6. **Internationalize Components & Pages**
   - Replace hard-coded strings with translation lookups using `getTranslations`/`useTranslations`.
   - Ensure forms, validation, notifications, and metadata use locale-aware copy.
   - Audit dynamic components (navigation, footers, CTA buttons) for correct message usage.

7. **CMS Data Fetching & Rendering**
   - Update data loaders to request localized Payload content using the `locale` parameter with fallbacks.
   - Adjust ISR/SSG and caching to revalidate per-locale content changes.
   - Handle localized slugs/routes by syncing frontend paths with CMS entries.

8. **RTL & Theming Support**
   - Introduce direction-aware styling (Tailwind logical properties or utility classes) for Arabic.
   - Review components for layout mirroring, iconography, and image direction.
   - Provide a language switcher that respects locale-aware URLs and preserves the current page.

9. **SEO & Metadata**
   - Generate localized titles, descriptions, Open Graph tags.
   - Emit `hreflang` links, localized sitemaps, and update canonical URLs.
   - Ensure Payload SEO plugin emits locale-specific entries.

10. **Quality Assurance & Delivery**
    - Add unit tests for locale helpers and translation fallbacks; consider integration tests for key flows.
    - Perform manual QA per locale (desktop + mobile) focusing on layout, copy accuracy, and fallback behavior.
    - Document deployment steps and translation hand-off processes; create a checklist for onboarding new locales.

## Risk & Mitigation
- **Missing translations**: Implement fallback logic and automated checks to highlight untranslated keys.
- **RTL regressions**: Introduce visual QA checklist and direction-aware CSS utilities early.
- **CMS editorial complexity**: Provide training docs/videos and consider restrictions/validation to prevent partial publishes.
- **Performance**: Monitor bundle size impact of translation resources; leverage code-splitting and lazy-loading where practical.

## Success Criteria
- Users can browse the entire site in any of the five locales with appropriate copy and layout.
- CMS editors can create/update localized content without developer intervention.
- URLs, metadata, and structured data reflect the active locale and support SEO best practices.
- Minimal code changes are needed to add a new locale (update locale config, message bundles, optional styling).
