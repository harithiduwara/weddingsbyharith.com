# Phase 2 — Architecture

## 1. Shape of the system

This is a **statically generated brochure site**. There is no server, no database,
and no runtime backend. A Node build script turns data + templates into a folder of
HTML/CSS/JS/images, which a CDN serves.

```
  content/*.mjs ─┐
  site.config.mjs ├─→ tools/build.mjs ─→ dist/ ─→ git branch gh-pages ─→ GitHub Pages ─→ CDN ─→ browser
  src/**         ─┘         │
  photos/raw/*   ──────────→ tools/optimize-images.mjs (sharp) ─→ dist/assets/img/*.{avif,webp,jpg}
```

## 2. Component responsibilities

| Component                     | Responsibility                                                                               | Notes                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `site.config.mjs`             | Single source of truth for business data: name, contact, social, SEO defaults, form endpoint | Satisfies FR-11                              |
| `content/*.mjs`               | Editorial data — collections, packages, testimonials, FAQs, journal posts                    | Plain ES modules; no parser, no frontmatter  |
| `src/layouts`, `src/partials` | HTML shells and reusable fragments                                                           | Consumed by the template engine              |
| `src/pages/**`                | One file per route; declares its own metadata via an exported header block                   | Route = file path                            |
| `tools/template.mjs`          | ~150-line template engine: interpolation, conditionals, loops, includes, escaping            | See ADR-0005                                 |
| `tools/build.mjs`             | Orchestrates: render pages, bundle CSS/JS, copy assets, emit sitemap/robots, enforce budgets | Fails the build on budget breach             |
| `tools/optimize-images.mjs`   | Generates responsive AVIF/WebP/JPEG derivatives and LQIP blur placeholders                   | Content-hashed, cached                       |
| `src/scripts/*`               | Progressive enhancement only — nav drawer, lightbox, form validation, lazy reveal            | Site is fully functional without it (NFR-05) |
| `tests/`                      | Unit, HTML validity, accessibility, end-to-end, performance                                  | See `04-test-plan.md`                        |

## 3. Rendering strategy

**Build-time rendering, zero client-side rendering.** Every page ships as complete
HTML. JavaScript adds behaviour to markup that already exists — the lightbox enhances
links that already point at full-size images; the mobile nav enhances a `<nav>` that
is already usable; the form enhances a `<form>` that already submits.

This is what makes NFR-01 (LCP), NFR-03 (JS budget), and NFR-05 (no-JS) achievable at
the same time. It is also why no client framework is used ([ADR-0001](adr/0001-static-site-over-framework.md)).

## 4. Image pipeline

Photography is the product, so images get the most engineering attention.

1. Originals land in `photos/raw/` at ~2400 px on the long edge.
2. `optimize-images.mjs` emits, per image, widths `[400, 800, 1200, 1600, 2000]` in
   **AVIF** (q50), **WebP** (q72) and **JPEG** (q78, progressive) — plus a 20 px
   base64 LQIP used as a CSS blur placeholder while the real image decodes.
3. A manifest (`dist/assets/img/manifest.json`) records intrinsic dimensions, which
   the templates stamp into `width`/`height` attributes — this is what holds CLS at
   ~0 (NFR-02).
4. `<picture>` emits AVIF → WebP → JPEG so every browser gets the best format it
   understands with no JavaScript.
5. Derivatives are content-hashed and cached; re-running the build only reprocesses
   changed originals.

## 5. Data flow for an enquiry (FR-07/FR-08)

```
visitor fills <form> ─→ client-side validation (enhancement)
                     ─→ if FORM_ENDPOINT configured: POST to relay ─→ email to Harith
                     ─→ if not configured: form is replaced at build time by a
                        prominent mailto: link, so the path is never dead
```

No enquiry data touches this codebase or GitHub. See [ADR-0003](adr/0003-form-handling.md).

## 6. Deployment topology

- `main` — source of truth. Never served.
- `gh-pages` — build output only, force-pushed by `npm run deploy`. Served by Pages.
- Custom domain via `CNAME` in the published output, with HTTPS enforced.

Keeping the built output off `main` means diffs on `main` stay reviewable, which
matters because the whole point of the SDLC docs is traceability.

## 7. Security posture

Static sites have a small attack surface, but not an empty one.

- **No third-party runtime code.** Fonts are self-hosted, there is no analytics
  snippet, no tag manager, no CDN script (NFR-07). Nothing can be changed by a
  third party after deploy.
- **Content Security Policy** delivered via `<meta http-equiv>` (Pages cannot set
  headers): `default-src 'self'`, no `unsafe-inline` for scripts.
- **`rel="noopener noreferrer"`** on every external link.
- **Dependabot** on the npm dev toolchain; dev dependencies never reach the browser.
- **Secrets:** none exist. The form endpoint is a public, write-only URL by design.

## 8. Rejected alternatives

| Considered                             | Rejected because                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Next.js / Astro / Gatsby               | Hundreds of transitive dependencies and a framework upgrade treadmill for a site with no dynamic behaviour. See ADR-0001. |
| WordPress + a photography theme        | Server, database, plugin CVEs, and a monthly bill, to render fifteen static pages.                                        |
| Squarespace / Pixieset                 | Fastest to launch, but no source control, no test suite, no SDLC to speak of — the explicit ask here.                     |
| Netlify / Vercel                       | Excellent, but GitHub Pages meets every requirement at zero cost and the user asked for GitHub hosting.                   |
| Client-side image lazy-loading library | `loading="lazy"` plus `<picture>` is native, free, and faster.                                                            |
