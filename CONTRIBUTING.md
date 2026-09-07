# Contributing

## Setup

```bash
npm ci
npx playwright install chromium
npm run dev          # http://localhost:4321
```

Node 20.11+ is required (`engines` in `package.json`).

## Workflow

1. Branch off `main`: `git checkout -b fix/short-description`
2. Make the change.
3. `npm run build && npm test`
4. `npm run format`
5. Open a pull request.

Never commit to `main` directly, and never commit to `gh-pages` by hand — it is
force-pushed by `npm run deploy` and any manual commit will be discarded.

## Definition of done

A change is not done until all of these hold:

- [ ] `npm run build` succeeds with no new warnings
- [ ] `npm test` passes (unit, HTML validity, end-to-end)
- [ ] JS stays under 20 KB and CSS under 48 KB — the build enforces this
- [ ] The relevant document in `docs/` reflects the change
- [ ] `CHANGELOG.md` has an entry
- [ ] New content data has a corresponding test in `tests/unit/content.test.mjs`

## House rules

These are not style preferences; each one has a defect behind it.

**No colour, size or duration may be hard-coded.** Add a token in
`src/styles/tokens.css`. Check any new colour pairing against `--paper-sunk` —
it is the darker of the two light grounds and therefore the binding contrast
constraint — in **both** themes.

**JavaScript is additive only.** If a feature needs JS to be readable or
navigable, it is the wrong feature. `tests/e2e/no-js.spec.js` enforces this.

**No third-party runtime requests.** No CDN fonts, no analytics, no embeds.
`tests/e2e/quality.spec.js` asserts zero external origins. Self-host it or do
without it.

**Every image needs alt text.** `picture()` throws without it. A decorative
image must pass `alt: ''` _and_ `decorative: true`, so that a missing alt is
always an error rather than an accidental empty string.

**Content goes in `content/`, never in markup.** If you find yourself typing a
price, a venue or a testimonial into an HTML file, stop.

**Escape by default.** Use `{{ }}`. Reach for `{{{ }}}` only for markup you
generated yourself in `build.mjs`, never for anything from `content/`.

## Adding a dependency

Don't, unless you have to. Three production dependencies is a feature — see
[ADR-0001](docs/adr/0001-static-site-over-framework.md). If you genuinely need
one, say in the pull request what it does, what it weighs, and what it would
take to write it yourself.

## Commit messages

Imperative mood, one concern per commit, and say _why_ rather than _what_ when
the what is obvious from the diff.

```
Darken --ink-faint to clear WCAG AA

3.21:1 against --paper-sunk for 13.6px metadata; AA needs 4.5:1.
```
