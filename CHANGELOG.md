# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] — 2026-09-07

Harith supplied his 2024/25 price guide. Real prices, real photographs, and the
last of the invented content removed.

### Added

- **Harith's own photographs** replace all fifty Unsplash placeholders. Nine
  images extracted from the price guide PDF, each with hand-written alt text.
- **Real pricing**, transcribed in full: four wedding packages (LKR 120,000 to
  230,000), three engagement, two homecoming and two casual-shoot packages, plus
  six extras. Previously three invented tiers.
- Real email (`weddingsbyharith@gmail.com`), confirming the Instagram handle.

### Changed

- **The home page hero is now an editorial split rather than a full-bleed
  banner.** The photographs are portrait-orientation and top out at 800 × 1200;
  a 100vh banner would have upscaled one by roughly 2×, which a photography site
  cannot afford. The hero now renders at 1.00×.
- **Galleries are grouped by kind of work, not by wedding.** The three invented
  weddings — couples, venues, guest counts, anecdotes — are gone. They were
  harmless against stock photography and unacceptable against photographs of
  real, identifiable clients.
- Copy acknowledges that a full day is covered by two or three photographers,
  which the packages commit to and the first-person copy previously ignored.
- Investment page restructured for four package groups; the enquiry form's
  selector lists all eleven.
- `photos/CREDITS.md` and `LICENSE` now state that the photographs are Harith's
  own and reserved, not Unsplash-licensed.

### Removed

- `tools/fetch-photos.mjs`, `tools/photos.manifest.mjs` and the `photos:fetch`
  script. With real client work in `photos/raw/`, a command that drops stock
  photography into that folder is a liability rather than a convenience.

### Fixed

- Collection pages titled "Weddings — undefined" after the `couple` field was
  removed.
- Package group intros were being set as display headings; "LKR" orphaned onto
  its own line above each price; and the price read "from LKR230,000" with no
  space to a screen reader.
- Package card buttons now align across a row.
- The preview ribbon still claimed stock photography and indicative pricing,
  both of which are now real.

## [1.1.0] — 2026-09-07

Real business details, and the site relocated from placeholder Britain to Sri
Lanka. The copy was also rewritten throughout to sound like a person wrote it.

### Changed

- Business identity: **Harith Iduwara Weddings** (also _Weddings by Harith_),
  nine years' experience, BSc in Computer Science from the University of
  Colombo, phone and WhatsApp on 071 603 3886.
- **Relocated to Sri Lanka.** The placeholder portfolio was entirely British —
  Cornwall, Somerset, the Dolomites, £ pricing, UK GDPR — which was wrong for a
  Sri Lankan photographer. Galleries are now Galle Fort, a tea bungalow in
  Dickoya and a ridge above Ella.
- Pricing moved from GBP to **LKR** (Rs 150,000 / 350,000 / 650,000), and the
  tiers were restructured around how Sri Lankan weddings actually work: the
  third tier is now _Wedding and Homecoming_ rather than a Western
  "whole weekend".
- FAQ and journal rewritten around real local conditions: nekath times fixing
  the ceremony, sunset at six all year near the equator rather than the UK's
  four-hour seasonal swing, and the two monsoons.
- Privacy notice now cites Sri Lanka's Personal Data Protection Act No. 9 of
  2022, retaining the GDPR note for overseas couples.
- The Investment page moved from `/investment/` to **`/packages/`**, keeping
  "Investment" as the navigation label.
- Copy rewritten site-wide for a human voice: contractions, uneven sentence
  rhythm, concrete detail, far fewer em-dashes, and none of the tidy aphorisms
  that were closing every section.
- Instagram set from the redirect the domain already points at; worth
  confirming before launch.

### Fixed

- Phone numbers now use non-breaking spaces so they cannot wrap mid-digit, and
  `tel:` links contain only the number — surrounding words inside the link were
  failing the validator's `tel-non-breaking` rule.
- The About page's sticky portrait was vertically centred by `.split`, leaving a
  large dead gap above it.
- A sentence opened with a numeral ("9 years later").
- The smoke test asserted every page title contained "Weddings by Harith", which
  the home page no longer does now that it leads with the business name.

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
