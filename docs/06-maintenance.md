# Phase 7 — Operation & maintenance

This is the document to read first if you have never touched this repository.

## 1. Going live: the short list

The site currently builds as a **preview**, with a red ribbon on every page,
because it contains placeholder content. To make it real:

### 1.1 Fill in the business details

Edit [`site.config.mjs`](../site.config.mjs). Every value wrapped in `TODO(...)`
needs replacing:

- `contact.email`, `contact.phone`, `contact.phoneHref`
- `contact.baseCity`, `baseRegion`, `baseCountry`, `serviceArea`
- `social.instagram`
- `forms.endpoint` — see §1.3
- `legalName`

### 1.2 Replace the photographs

Every image is an Unsplash placeholder — see [`photos/CREDITS.md`](../photos/CREDITS.md).
Drop your own JPEGs into `photos/raw/` keeping the same filenames, then
`npm run build`. Finally set `placeholder: false` on each entry in
`content/collections.mjs`.

### 1.3 Connect the enquiry form

Create a form at [Formspree](https://formspree.io) (or Basin, or Web3Forms) and
put the endpoint URL in `forms.endpoint`. Until you do, the contact page renders
a `mailto:` block instead — the enquiry route is never broken, but it is also
never as good as a form.

### 1.4 Replace the testimonials

`content/testimonials.mjs` contains **placeholder quotes, not real reviews**.
Replace them with genuine, permissioned quotes from real clients and set
`placeholder: false`.

> Publishing invented testimonials on a live commercial site is dishonest, and
> in the UK it breaches the Consumer Protection from Unfair Trading Regulations.
> The build gate exists to make shipping them require a deliberate act.

### 1.5 Set real prices

`content/packages.mjs`. Then set `placeholder: false`.

### 1.6 Ship it

```bash
npm run build -- --production   # fails while any placeholder remains
npm test
npm run deploy
```

The `--production` flag is the gate: it lists exactly what is still a placeholder
and refuses to build until none are.

## 2. Routine tasks

### Publish a new wedding

1. Put the photographs in `photos/raw/` with a shared prefix, e.g. `mira-01.jpg`.
2. Add an entry to `content/collections.mjs` — slug, couple, venue, location,
   season, cover, a two-or-three paragraph story, and the image list.
3. `npm run build && npm test`
4. `npm run deploy`

The portfolio index, home page, footer, sitemap and structured data all update
themselves. No markup changes are required.

### Write a journal post

Add an entry to `content/journal.mjs`. The `body` is an array of
`['h2' | 'p', 'text']` pairs. Keep the title short — the `<title>` tag is
`"<title> · Weddings by Harith"`, and the HTML validator rejects anything over
70 characters, which is also roughly where Google truncates.

### Change prices, FAQs or packages

`content/packages.mjs`, `content/faqs.mjs`. Nothing else to touch. Prices are
plain numbers; the build formats them (`2950` → `£2,950`).

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

- **Do not put a literal `·` in markup.** Jost's latin subset has no U+00B7 and
  it renders as a blank gap. Use `.meta-list` spans; the dots are drawn in CSS.
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
