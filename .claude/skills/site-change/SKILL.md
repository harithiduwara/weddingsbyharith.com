---
name: site-change
description: The working agreement for weddingsbyharith.com — an SDLC with a documented decision trail, a full test gate, a copy proofread, content-integrity rules, and verification by measurement. Use this skill for ANY change to this repository: copy edits, CSS tweaks, new pages, pricing changes, photographs, config, docs. Use it even when the change looks like one line, because the defects this catches are exactly the ones that look like one line. If the request touches site text, prices, client photographs, layout, or anything that will be published, this skill applies.
---

# Changing weddingsbyharith.com

This is a live commercial site for a real photographer with real clients. A
wrong price is a contractual problem, an invented testimonial is a legal one,
and a broken layout costs bookings. The workflow below exists because each step
has already caught something real.

## The shape of a change

1. **Understand the actual request.** If two readings would produce materially
   different work — which packages, which pages, whose names get published —
   ask once and briefly. Otherwise proceed.
2. **Change the data, not the markup.** Everything business-variable lives in
   `site.config.mjs` and `content/*.mjs`. If you are about to type a price, a
   venue or a quote into an HTML file, stop.
3. **Run the gate** (below). All of it.
4. **Proofread** if any user-facing text changed.
5. **Update the record**: `CHANGELOG.md` always; `docs/` when behaviour or a
   decision changed; a new ADR in `docs/adr/` when you chose between real
   alternatives.
6. **Deploy and verify against the live URL**, not against your local build.

## The test gate

```bash
npm run build          # fails on JS/CSS budget breach and on placeholders in --production
npm run test:unit      # template engine, media helper, content integrity, import parsing
npm run test:html      # html-validate across every built page
npm run test:e2e       # Playwright, desktop + mobile
npm run format:check
```

Never report a pass you have not seen. Playwright's line reporter prints the
failure list immediately above the summary, so a `tail` can show green while
tests are failing — check the exit code, not the last line.

Add a test with the change. Anything found by looking at the site should end up
asserted, because the next person will not look as carefully.

## Verify by measurement, not by screenshot

A downscaled screenshot is evidence of almost nothing. In this repo a small
grey separator was misread as a missing glyph, and the false diagnosis reached
three documents and shipped a CSS workaround.

Measure instead. Query the DOM for computed styles and geometry, rasterise a
glyph and count inked pixels, compare an element's left edge against the
content column. When you claim something renders, or does not, say how you know.

Two traps specific to this setup:

- **`dist/` holds whatever was built last.** A staging deploy leaves it built
  with a base path, so the local preview 404s its own stylesheet and every
  measurement you take is of an unstyled page. `predev`/`pretest` rebuild first
  — do not bypass them.
- The browser pane sometimes reports `visibilityState: "hidden"`, and a hidden
  page does not paint. Blank screenshots usually mean that, not a broken page.

## Proofreading

Whenever user-facing text changes, read the rendered copy — not the source.
Extract the text from `dist/**/*.html` and read it as a person would.

Look for: subject–verb agreement, missing commas before `and` joining
independent clauses, missing commas on non-restrictive `which` clauses,
straight quotes where the site uses curly (`’ “ ”`), doubled spaces, and
sentences that begin with a numeral.

Also check for claims that contradict each other across pages. Copy drifts out
of step with data: the site once promised "around 700 edited photographs" while
the largest package delivered 500, and a heading promised complete wedding
galleries directly above a lede explaining they are grouped by kind of shoot.
Those are worth more than any comma.

Inch marks in album sizes (`12"×24"`) stay straight. That is correct
typography, not an oversight.

## Content integrity

These are not style preferences. They are the difference between a site that
can be published and one that cannot.

- **Never invent a testimonial, a client name, a venue or a wedding.** Sample
  copy exists in `content/testimonials.mjs` flagged `placeholder: true`, and the
  production build refuses to ship while that flag is set. Publishing invented
  reviews breaches Sri Lanka's Consumer Affairs Authority Act.
- **The photographs are real, identifiable clients.** Never attach a fabricated
  name, venue or anecdote to a face. Every image needs hand-written alt text
  describing what is actually in the frame; `picture()` throws without it and a
  unit test rejects anything under 25 characters.
- **Prices are contractual.** They come from Harith's price guide. Do not invent
  a figure to fill a gap — a "Custom quote" with real inclusions is better than
  a plausible number. Hide prices behind the `quoteOnly` flag rather than
  deleting them, so a misread scope costs one line to reverse.
- **Placeholders are load-bearing.** `TODO()` values in `site.config.mjs` drive
  the preview ribbon and the production gate. Do not paper over one with an
  invented value.

## Constraints that hold the site together

- **Zero third-party runtime requests.** Fonts, styles, scripts and images are
  all self-hosted; a test asserts no external origin is contacted. No embed
  widget, no CDN font, no analytics. If a feature needs one, it needs an ADR
  first.
- **JavaScript is additive.** The site must work with scripts disabled;
  `tests/e2e/no-js.spec.js` enforces it.
- **Check new colours against `--paper-sunk`**, the darker of the two light
  grounds and therefore the binding contrast constraint, in both themes.
- **Anything that sets `display` must handle `[hidden]` itself** — an author
  declaration beats the user agent's rule, which once left the mobile nav
  permanently open.
- **A component carrying `.shell` must not also set `width`**, or it silently
  defeats the page gutter. That misaligned the header at every breakpoint for
  weeks.

## Deploying

```bash
npm run deploy:staging   # github.io project URL, while DNS points elsewhere
npm run deploy           # custom domain, once DNS is cut over
```

Then check the live URL — routes, the specific thing you changed, and that what
you removed is actually gone. A green build is not evidence that a deploy
worked.

## Writing in Harith's voice

He wrote the About page himself; match it rather than smoothing it. Contractions,
uneven sentence length, concrete detail, the occasional fragment. No aphorism
closing every section, no "not X but Y" on repeat, and go easy on em dashes.
Specifics are what stop copy reading as generated — the ten rupees saved by
walking to school does more work than any adjective.

When he supplies copy, set it rather than rewriting it. His words beat yours.
