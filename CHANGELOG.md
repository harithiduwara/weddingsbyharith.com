# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-09-07

First complete build. Not yet published with real content — see
`docs/06-maintenance.md`.

### Added

- Fifteen pages: home, portfolio index, three wedding collections, about,
  investment, FAQ, journal index with three articles, contact, privacy, 404.
- Static site generator: a ~180-line template engine, a build orchestrator with
  budget and placeholder gates, and a local preview server.
- Build-time responsive image pipeline — AVIF/WebP/JPEG at five widths with
  inline LQIP placeholders and content-hash caching.
- Design system in CSS custom properties, with light and dark themes.
- Progressive enhancement: keyboard-navigable lightbox, mobile drawer, inline
  form validation, scroll reveal. All optional; the site is complete without them.
- SEO: JSON-LD (`LocalBusiness`, `WebSite`, `BreadcrumbList`, `FAQPage`,
  `BlogPosting`, `ImageGallery`), generated sitemap and robots.txt, Open Graph.
- Test suite: 55 unit tests, 184 end-to-end tests across desktop and mobile,
  HTML validation, and link checking.
- Deploy tooling publishing `dist/` to `gh-pages`, with a guard against
  publishing preview content.
- Full SDLC documentation and five architecture decision records.

### Fixed

Defects found and fixed during development, recorded because each is a trap
someone could fall into again:

- Template parser attached an `{{else}}` following a nested `{{/if}}` to the
  inner block, silently mis-nesting conditionals.
- Template engine did not resolve `this.path`, only bare `this`.
- `--ink-faint` failed WCAG AA at 3.21:1 on the sunk panel; `--clay` failed at
  4.42:1; `.tier__flag` reversed white out of a light accent in dark mode at
  2.45:1. All three corrected at the token level.
- The mobile navigation drawer was permanently open: an author `display`
  declaration overrode the user agent's `[hidden]` rule.
- The desktop hamburger toggle was visible at every width — a later
  same-specificity rule won on source order.
- The header CTA rendered white-on-white on any page without a hero.
- Scroll reveal could leave content permanently invisible if the
  IntersectionObserver never fired; it now fails open and never animates
  above-the-fold content.
- Literal `·` separators rendered as blank gaps — Jost's latin subset has no
  U+00B7. Separators are now drawn in CSS.
- The lightbox relied on `::backdrop` for its dark ground, putting near-white
  controls at 1.03:1 against a computed background.
- The preview ribbon collided with the fixed header.
- The lightbox's empty `src=""` triggered a spurious request to the page URL.
- AVIF was encoding at 4:4:4 chroma, roughly doubling file size for no visible
  gain.
- The accessibility audit skipped all below-the-fold content, because
  scroll-revealed elements are transparent and axe ignores them.

### Documentation

- Corrected ADR-0002 and the deployment runbook: they claimed workflow files
  could not be pushed without the `workflow` OAuth scope. GitHub accepted the
  push and CI runs normally, so the claim was wrong.
- Rewrote the DNS section for the domain's actual configuration. It is on
  Cloudflare and currently 301-redirects to Instagram, which means a cutover has
  to remove a redirect rule and disable the proxy for certificate issuance —
  none of which the generic instructions covered.
- Held `html-validate` major updates in Dependabot: v9+ requires Node 22 and CI
  pins Node 20.

### Added (post-deploy)

- Base-path support (`npm run build:staging`, `npm run deploy:staging`), so the
  site can be published to the GitHub project URL while the custom domain still
  points elsewhere. Staging builds rewrite internal URLs for the sub-path, point
  canonicals at the staging origin, omit `CNAME`, and mark every page `noindex`.

### Fixed (post-deploy)

- The home page pinned `og:image` to `hero-01`, the soft-focus frame that was
  rejected as the hero. Every social share would have used it.
