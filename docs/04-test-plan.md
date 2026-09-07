# Phase 5 — Test plan

## 1. Strategy

The site has no server, no database and no user accounts, so the risk profile is
unusual: almost nothing can go wrong at runtime, and almost everything that can
go wrong is a **rendering, accessibility, performance or content** defect that a
human would only notice by looking. The suite is therefore weighted towards
automated inspection of the built output rather than unit-testing logic.

Four layers:

| Layer       | Tool            | What it protects                                         |
| ----------- | --------------- | -------------------------------------------------------- |
| Unit        | `node:test`     | The template engine, the image helper, content integrity |
| Static      | `html-validate` | Structural HTML correctness on every built page          |
| Behavioural | Playwright      | Requirements, in a real browser, on desktop and mobile   |
| Link        | `linkinator`    | Every internal URL actually resolves                     |

Run everything with `npm test` (unit → HTML → e2e). `npm run test:links` needs a
running preview server.

## 2. Current status

| Suite                          | Count    | Status       |
| ------------------------------ | -------- | ------------ |
| Unit                           | 69       | Passing      |
| HTML validity                  | 15 pages | 0 errors     |
| End-to-end (desktop + mobile)  | 184      | Passing      |
| Internal links                 | 573      | 0 broken     |
| axe-core, 11 routes × 2 themes | —        | 0 violations |

## 3. Unit tests

**`tests/unit/template.test.mjs`** — the largest suite, because ADR-0005 accepts
owning a template engine only on the condition that it is properly tested.
Covers interpolation, path resolution, `this.`/`../`/`@root` scoping, block
helpers, partials, and malformed-template errors.

Two cases exist because they were **real bugs found during development**:

- _"an `{{else}}` after a nested `{{/if}}` belongs to the OUTER block"_ — the
  parser could not distinguish returning on a close from returning on an else,
  so nested conditionals silently mis-nested and broke the investment page.
- _"`this.path` resolves"_ — `{{this.ys}}` returned empty because only bare
  `this` was handled.

The escaping tests are a **security boundary**: they assert that a content
author cannot introduce markup through data, deliberately including a
testimonial containing a `<` character.

**`tests/unit/media.test.mjs`** — asserts the `<picture>` contract: alt text is
mandatory (an empty alt requires an explicit `decorative: true`), intrinsic
`width`/`height` are always stamped, AVIF precedes WebP precedes JPEG, and eager
images are never also lazy.

**`tests/unit/basepath.test.mjs`** — the base-path rewriter runs over every
finished document, so a mistake breaks every URL at once. Most of the suite is
about what it must _not_ touch: absolute and protocol-relative URLs, `mailto:`,
fragments, relative paths, slashes in ordinary prose, and — most importantly —
the base64 `data:` URIs carrying each image's blur placeholder.

**`tests/unit/content.test.mjs`** — catches the mistakes a photographer will
actually make when publishing a wedding: referencing a photograph that is not in
`photos/raw/`, duplicating a slug, colliding a collection slug with a journal
slug, or listing price tiers out of ascending order.

## 4. End-to-end tests

Run against Chromium in two projects: **desktop** (1280×720) and **mobile**
(Pixel 7). Test titles cite the requirement ID they cover, so
`grep -rn "FR-07" tests/` establishes coverage.

- **`smoke.spec.js`** — every route returns 200 with exactly one `<h1>`;
  navigation, the lightbox (open, next, arrow keys, Escape), the FAQ accordion,
  pricing, and the 404.
- **`a11y.spec.js`** — axe-core against WCAG 2.0/2.1 A and AA on every route,
  plus the lightbox and the mobile drawer while open. Also checks the skip link
  is the first tab stop, focus rings are visible, `aria-expanded` tracks the
  drawer, reduced motion is honoured, and the dark theme paints its own ground.
- **`no-js.spec.js`** — the whole suite again with `javaScriptEnabled: false`.
  This is the guard against someone later "improving" the site with a
  client-rendered component.
- **`quality.spec.js`** — no horizontal overflow at eight widths from 320 px to
  2560 px; **zero third-party requests**; no cookies; intrinsic dimensions on
  every image; CLS measured live via `PerformanceObserver`.
- **`seo.spec.js`** — canonical URLs, description length, Open Graph tags, title
  uniqueness, JSON-LD that actually parses, sitemap contents, robots.txt, the
  CSP, and the CNAME.

### Settling the page before auditing

`tests/e2e/settle.js` scrolls the page and waits for every `.reveal` to finish
before axe runs. This was added for two reasons, and removing it regresses both:

1. **Coverage.** Scroll-revealed content sits at `opacity: 0`, and axe skips
   fully transparent elements — so auditing a freshly loaded page silently
   skipped everything below the fold.
2. **Determinism.** Sampling mid-fade made axe compute contrast against a
   blended background, producing an intermittent failure that reproduced in
   roughly one run in three.

## 5. Budgets enforced by the build

`tools/build.mjs` fails the build, not just warns, when:

| Budget                                       | Limit | Current           |
| -------------------------------------------- | ----- | ----------------- |
| JavaScript, uncompressed                     | 20 KB | 6.7 KB            |
| CSS, uncompressed                            | 48 KB | 31.8 KB           |
| Placeholder values in a `--production` build | 0     | 13 (preview only) |

## 6. Manual checks before a release

Automation cannot judge these:

1. Do the photographs look right — colour, crop, order?
2. Read the copy aloud. Does it sound like the photographer?
3. Tab through the contact page end to end.
4. Load the site on a real phone on mobile data, not just an emulator.

## 7. Known limitations

- Chromium only. Safari and Firefox are not in the matrix; the CSS avoids
  anything with patchy support, but this is a real gap.
- No visual regression testing. Layout breakage that is valid HTML, accessible
  and non-overflowing would pass.
- Lighthouse budgets in NFR-01/NFR-02 are asserted indirectly (CLS is measured;
  LCP is not). Wiring Lighthouse CI is the obvious next addition.
- `doctype-style` is disabled: Prettier always lowercases the doctype and
  offers no option not to, the HTML spec is case-insensitive there, so the rule
  is pure style and was doing nothing but fighting the formatter.
- `no-inline-style` and `no-redundant-role` are disabled in
  `.htmlvalidate.json`. The first because gallery images carry a per-element
  base64 LQIP that cannot live in a stylesheet; the second because `role="list"`
  on a styled `<ul>` is deliberate — Safari with VoiceOver strips list semantics
  when `list-style: none` is set.
