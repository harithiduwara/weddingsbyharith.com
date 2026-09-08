# Phase 7 — Operation & maintenance

This is the document to read first if you have never touched this repository.

## 1. Going live: what is actually left

Most of the site is now real. Harith's own photographs, his real prices from the
2024/25 guide, his phone, email and Instagram are all in. Four things remain.

### 1.1 Four config fields

In [`site.config.mjs`](../site.config.mjs), the values still wrapped in `TODO()`:

- `contact.baseCity` — the city you are based in
- `about.mentors` — the photographers you assisted. Fill this in and the About
  page swaps its generic paragraph for a specific credential line
- `forms.endpoint` — see §1.3
- `legalName` — only if the registered name differs from the trading name

### 1.2 Real testimonials

`content/testimonials.mjs` is the last piece of invented content on the site.
The quotes are written samples, not real reviews, and each is flagged
`placeholder: true`. Replace them with genuine, permissioned client quotes and
set the flag to `false`.

> Publishing invented testimonials on a live commercial site is dishonest, and
> it breaches Sri Lanka's Consumer Affairs Authority Act on misleading claims.
> The build gate exists so that shipping them requires a deliberate act.

### 1.3 Connect the enquiry form

Create a form at [Formspree](https://formspree.io) (or Basin, or Web3Forms) and
put the endpoint in `forms.endpoint`. Until you do, the contact page renders a
WhatsApp and phone block instead, so the enquiry route is never broken — it is
just less convenient than a form for people who prefer typing.

### 1.4 Confirm the prices

The prices in `content/packages.mjs` are transcribed from the **2024/25** guide.
Confirm they still stand before launch. A published price is a contractual
signal and a stale one is worse than none. The Investment page says which guide
year they came from, which limits the damage but is not a substitute for
checking.

### 1.5 Better photographs, when you can

Everything in `photos/raw/` came out of the Canva PDF, so the largest file is
800 × 1200 and most are around 410 × 615. The build never upscales past a
source's own pixels, and the home page hero is laid out as an editorial split
specifically so the largest photograph renders at 1.00× instead of being
stretched across a full-bleed banner.

Drop the full-resolution originals in under the same filenames and run
`npm run build`. Nothing else changes. Around 2400 px on the long edge is
plenty, and it would let the hero become full-bleed if you wanted it to.

More photographs would also let the portfolio go back to what it is really for:
one complete wedding, start to finish. See §2.

### 1.6 Ship it

```bash
npm run build -- --production   # fails while any placeholder remains
npm test
npm run deploy                  # or deploy:staging until DNS moves
```

The `--production` flag is the gate: it lists exactly what is still a
placeholder and refuses to build until none are.

## 2. Routine tasks

### Launch a portfolio category

`content/collections.mjs` lists every kind of work, including the ones with no
photographs yet. A category publishes **itself** once it has `MIN_GALLERY`
(three) images:

1. Put the photographs in `photos/raw/`.
2. Add them to that category's `images` array with real alt text.
3. `npm run build`.

The card becomes clickable, the gallery page is generated, and the sitemap
picks it up. Below three images it stays listed on the portfolio page as a
service with no link, which is deliberate — half a gallery is worse than none.
`tests/e2e/smoke.spec.js` asserts that an unpublished category is never linked
and never reaches the sitemap.

### Publish a new wedding

The galleries are currently grouped by _kind_ of shoot rather than by wedding,
because the photographs on file came from the price guide. Once you have a full
gallery from one wedding, and that couple's written permission, add it as its
own entry:

1. Put the photographs in `photos/raw/` with a shared prefix, e.g. `mira-01.jpg`.
2. Add an entry to `content/collections.mjs` — slug, title, kind, cover, an
   excerpt, a few `facts`, a two-or-three paragraph story, and the image list.
3. **Write real alt text for every photograph.** `picture()` throws without it,
   and `tests/unit/content.test.mjs` fails if it is under 25 characters. These
   are real, identifiable people; "photograph 3 of 9" is not good enough.
4. Never attach invented names, venues or stories to a real client's face.
5. `npm run build && npm test && npm run deploy`

The portfolio index, home page, footer, sitemap and structured data all update
themselves. No markup changes are required.

### Use the brand logo in the header

Put the file in `src/assets/` and name it in `site.config.mjs`:

```js
brand: { logo: 'logo.svg' },
```

**Send an SVG if you possibly can.** The build inlines it and the CSS paints it
with `currentColor`, so a single file works on the ivory header, over a dark
photograph, and in dark mode. The supplied mark is cream — designed for dark
grounds — and would be invisible on the site's background as a fixed-colour
image.

A raster file is rendered as `<img>` instead and cannot adapt to the
background, so it would need to be dark-on-transparent and would still look
wrong in dark mode. If SVG is not available, a transparent PNG at roughly
600 px wide is the fallback.

The build fails loudly if the named file is missing, and falls back to the text
wordmark when `logo` is `null`.

### Import weddings from Instagram

The posts on `@weddingsbyharith` are already-published weddings with the couples
named in the captions, which makes them the natural source for real portfolio
galleries. See [ADR-0006](adr/0006-instagram-content.md) for why this is an
import rather than a feed widget.

**1. Request the export.** In the Instagram app or on the web:

> Settings → Accounts Centre → Your information and permissions →
> Download your information → Download or transfer information →
> select your account → **Some of your information** → tick **Posts** →
> Download to device

Then, and this matters:

- **Format: JSON.** Not HTML. The importer needs the structured captions, and
  it will stop with a clear message if it finds HTML instead.
- **Media quality: High.** This is what gives you the original uploads rather
  than compressed copies.

The archive arrives by email, usually within a few hours.

**2. Run the import.**

```bash
npm run instagram:import -- ~/Downloads/instagram-weddingsbyharith.zip
```

It copies the photographs into `photos/raw/`, prints a report of what it found,
and writes a draft to `content/collections.generated.mjs`. It deliberately does
**not** overwrite `content/collections.mjs` — grouping by caption is a guess and
these are real, named clients.

The report lists three things worth reading: the weddings it grouped, couples it
skipped for having fewer than three photographs, and captions it could not read
as a couple at all. Anything in the last two lists needs you, not the script.

**3. Finish the draft.** Every generated entry has TODOs in it:

- Write a real excerpt and story for each wedding.
- **Rewrite the alt text.** What the importer generates is truthful but generic
  ("Ruchith & Sandali on their wedding day — photograph 3"). It should describe
  what is actually in the frame.
- Pick a better cover than the first photograph if one exists.
- **Confirm each couple is happy to be named and shown on the site.** They are
  on your public Instagram already, but a portfolio page under their names is a
  different thing, and the privacy page promises you ask.

Then move the file over `content/collections.mjs` and run
`npm run build && npm test`.

### Write a journal post

Add an entry to `content/journal.mjs`. The `body` is an array of
`['h2' | 'p', 'text']` pairs. Keep the title short — the `<title>` tag is
`"<title> · Weddings by Harith"`, and the HTML validator rejects anything over
70 characters, which is also roughly where Google truncates.

### Change prices, FAQs or packages

`content/packages.mjs`, `content/faqs.mjs`. Nothing else to touch. Prices are
plain numbers; the build formats them (`350000` → `Rs 350,000`).

## 3. Keeping it healthy

| Cadence      | Task                                                |
| ------------ | --------------------------------------------------- |
| Every deploy | `npm test`                                          |
| Monthly      | Review and merge Dependabot pull requests           |
| Quarterly    | Refresh the portfolio; retire the oldest collection |
| Quarterly    | Re-read the privacy notice against current guidance |
| Annually     | Confirm domain renewal and DNS records              |

## 4. Gotchas

Things that will waste an afternoon if you do not know them:

- **Literal `·` is fine.** An earlier note here said Jost could not render it;
  that was a misdiagnosis, disproved by rasterising the glyph and counting
  pixels. Use `.meta-list` spans where you want consistent separator spacing.
- **`dist/assets/img` is deliberately not wiped** by a normal build — re-encoding
  50 photographs takes about a minute. `npm run build:clean` forces a full rebuild.
- **Check new colours against `--paper-sunk`**, not `--paper`. It is the darker
  ground and therefore the binding constraint for contrast.
- **Anything that sets `display` must handle `[hidden]` itself.** An author
  `display` declaration beats the user-agent's `[hidden]` rule; this once left
  the mobile nav drawer permanently open. `reset.css` now enforces it globally.
- **`npm run photos:fetch` never overwrites**, so it cannot clobber real
  photographs — but it also will not refresh a placeholder. Delete the file first.

## 5. If you hand this to another developer

Point them at [`docs/00-sdlc-overview.md`](00-sdlc-overview.md), then the ADRs.
The ADRs explain _why_ the odd decisions were made — a bespoke template engine, no
framework, a branch-push deploy — and each one names the conditions under which
it should be revisited.
