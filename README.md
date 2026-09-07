# weddingsbyharith.com

The marketing and portfolio website for **Weddings by Harith** — documentary
wedding photography.

A hand-built static site: no framework, three production dependencies, and a
build that refuses to ship placeholder content.

```bash
npm ci
npm run build     # → dist/
npm run dev       # → http://localhost:4321
npm test          # unit + HTML validity + end-to-end
```

> **Status: preview.** Every photograph is an Unsplash placeholder, the
> testimonials are sample copy, the prices are indicative and the contact details
> are unset. Every page carries a red ribbon saying so, and
> `npm run build -- --production` refuses to build until they are replaced.
> See [`docs/06-maintenance.md`](docs/06-maintenance.md) for the go-live checklist.

## What it does

Fifteen pages: home, portfolio index, three full wedding galleries, about,
investment, FAQ, journal with three articles, contact, privacy and a 404.

|                          |                                                           |
| ------------------------ | --------------------------------------------------------- |
| JavaScript shipped       | **6.7 KB** uncompressed                                   |
| CSS shipped              | **31.8 KB** uncompressed                                  |
| Third-party requests     | **zero** — fonts, styles and scripts are all self-hosted  |
| Cookies                  | none                                                      |
| Accessibility            | WCAG 2.2 AA, 0 axe violations across 11 routes × 2 themes |
| Works without JavaScript | entirely                                                  |
| Tests                    | 55 unit + 184 end-to-end, 573 links checked               |
| Hosting cost             | £0                                                        |

Every photograph is served as AVIF with WebP and JPEG fallbacks at five widths,
with an inline blur placeholder and intrinsic dimensions — so a phone downloads
about 29 KB per gallery image instead of 1.5 MB, and cumulative layout shift
stays at zero.

## How it is put together

```
site.config.mjs      all business-variable data — the only file most edits touch
content/*.mjs        collections, packages, testimonials, FAQs, journal
src/
  layouts/ partials/ templates/ pages/   HTML
  styles/            tokens → reset → base → layout → components → pages
  scripts/           one file, progressive enhancement only
  assets/            self-hosted fonts, favicons
photos/raw/          source photographs
tools/
  build.mjs          render, bundle, sitemap, budget + placeholder gates
  template.mjs       ~180-line template engine
  optimize-images.mjs  sharp → AVIF/WebP/JPEG × 5 widths + LQIP, content-hashed
  media.mjs          <picture> construction
  deploy.mjs         publish dist/ → gh-pages
tests/               unit + Playwright
docs/                the SDLC record, including ADRs
```

## Publishing a new wedding

1. Photographs into `photos/raw/`.
2. One entry in `content/collections.mjs`.
3. `npm run build && npm test && npm run deploy`.

The portfolio, home page, footer, sitemap and structured data all follow
automatically. No markup changes.

## Documentation

The project was run through a documented SDLC; the artefacts are real, not
decorative.

| Document                                            |                                         |
| --------------------------------------------------- | --------------------------------------- |
| [SDLC overview](docs/00-sdlc-overview.md)           | Process, phases, definition of done     |
| [Requirements](docs/01-requirements.md)             | Personas, user stories, FR/NFR with IDs |
| [Architecture](docs/02-architecture.md)             | Components, data flow, security posture |
| [Design system](docs/03-design-system.md)           | Colour, type, space, components         |
| [Test plan](docs/04-test-plan.md)                   | Strategy, coverage, known gaps          |
| [Deployment runbook](docs/05-deployment-runbook.md) | Deploy, DNS, rollback, incidents        |
| [Maintenance](docs/06-maintenance.md)               | Go-live checklist and routine tasks     |

Architecture decision records:

- [ADR-0001](docs/adr/0001-static-site-over-framework.md) — no JS framework
- [ADR-0002](docs/adr/0002-github-pages-hosting.md) — GitHub Pages via `gh-pages`
- [ADR-0003](docs/adr/0003-form-handling.md) — form relay with a `mailto:` fallback
- [ADR-0004](docs/adr/0004-image-pipeline.md) — build-time responsive images
- [ADR-0005](docs/adr/0005-bespoke-template-engine.md) — the template engine

## Licence

Source code: [MIT](LICENSE).

Photographs in `photos/raw/` are Unsplash-licensed placeholders — see
[`photos/CREDITS.md`](photos/CREDITS.md). Once replaced with the photographer's
own work, **those photographs are not covered by the MIT licence** and remain
all rights reserved.
