# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.11.0] — 2026-09-08

### Changed

- **"Custom quote" is said once, in its own section**, instead of appearing as a
  label on seven separate cards. The Investment page is now: the four priced
  wedding packages, one **Custom quotes** section, extras, and how booking works.
- That section absorbs the old "Beyond weddings" block, so engagements,
  homecomings, casual shoots, studio, product, food, corporate and events are
  named together in one place with a single "Ask for a quote" button.

Prices for the quoted groups remain in `content/packages.mjs` behind
`quoteOnly`, unpublished but available as the basis for quoting.

### Removed

- The per-card `.tier__price--quote` style and the repeated per-group note,
  both now unused.

## [1.10.0] — 2026-09-08

### Changed

- **Only weddings publish prices.** Engagements, Homecoming and Casual shoots
  now show "Custom quote" with their inclusions still listed, and a note saying
  they are quoted per job.

The 2024/25 figures for those groups are **not deleted** — they stay in
`content/packages.mjs` as the basis for quoting, hidden by a `quoteOnly: true`
flag on the group. Removing that one line publishes a group's prices again.
Extras stay priced, since they attach to the wedding packages.

### Added

- A test asserting weddings show `from LKR …`, every other group shows exactly
  "Custom quote", and no figure leaks into a quoted group.

## [1.9.0] — 2026-09-08

### Fixed

- **The header ignored the page gutter.** `.header__inner` carries `.shell` but
  also set `width: 100%`, and components.css loads after layout.css, so the
  header ran edge to edge. The brand sat 20px left of the content column on a
  phone and 56px out on desktop, at every breakpoint, since the site was built.
  Reported from a phone screenshot.
- **Too much dead space under the hero on mobile.** 164px of padding beneath a
  76px fixed header left ~88px blank above the fold, where the hero is a single
  stacked column. Now 36px on small screens, unchanged on desktop.
- `npm run dev` and `npm test` ran against whatever `dist/` happened to hold, so
  a staging deploy left both broken until someone rebuilt by hand — the base
  path made the local preview 404 its own stylesheet. `predev` and `pretest`
  now rebuild first.

### Added

- Regression tests asserting the brand lines up with the content column at 320,
  390, 768, 1024 and 1440px.

## [1.8.0] — 2026-09-08

A proofread of every page of copy.

### Fixed

- **Subject–verb disagreement**: "Eight groupings takes about fifteen minutes"
  → "take".
- **Missing commas before `and`** joining independent clauses, in two journal
  sentences, and a missing comma on the non-restrictive "…into fewer rooms,
  which is better for photographs".
- `"documentary"` used straight quotes where the site uses curly everywhere
  else. Inch marks in album sizes (`12"×24"`) are left straight, which is
  correct.
- "whatever was scheduled either side" → "on either side".
- The rain article's excerpt ended "A short argument for stopping", leaving the
  reader hanging.
- The `<title>` read "…Wedding photography in Sri Lanka." with a trailing full
  stop.
- Preview ribbon said "5 item(s)".
- **The home page contradicted itself**: a heading promising "Whole days, start
  to finish" sat directly above a lede explaining the galleries are grouped by
  kind of shoot. Left over from the old structure.
- A placeholder testimonial claimed "Seven hundred photographs" when the largest
  package delivers 500.
- The homecoming description said "at his family home", assuming the couple.
  Now "usually at the groom's family home", which is the tradition and states it
  as such.
- **`.meta-list` separators were a drawn box with empty `content`**, so a screen
  reader read "Full-day coverage6 photographs" with no separation. Now a real
  `·` character, which the accessibility tree exposes.

### Corrected documentation

An earlier claim that **Jost cannot render U+00B7** was wrong, and had been
written into the design system, the maintenance guide and the changelog as
fact. Rasterising each glyph and counting inked pixels shows `·` renders in both
site fonts (30 inked pixels at 48px) while a genuinely missing glyph inks the
tofu box at 614. The original symptom was a small, light-grey dot at 13.6px
misread as absent in a downscaled screenshot. The 1.1.0 entry is annotated
rather than rewritten.

## [1.7.0] — 2026-09-08

### Changed

- **The portfolio now covers every kind of work Harith does**, not just
  weddings. `content/collections.mjs` lists Weddings, Engagements & couples,
  Studio, Product, Food, Corporate and Events.
- A category **publishes itself** once it has three photographs. Below that it
  is listed on the portfolio page as a service with no link, because half a
  gallery is worse than none. Launching one is now: add images, run the build.

### Fixed

- The portfolio page's meta description still advertised "Galle Fort, the hill
  country and a sunrise on a ridge above Ella" — venues belonging to the
  invented weddings deleted in 1.2.0. It had been live in search results since.

### Added

- Unit tests for the published/pending split, including one asserting a pending
  category needs nothing but images to go live.
- End-to-end tests asserting an unpublished category is listed but never
  linked, returns 404 if guessed, and never appears in the sitemap.

## [1.6.0] — 2026-09-08

### Added

- **A "Beyond weddings" section on the Investment page** covering studio,
  product, food, corporate and event shoots. These are described and quoted on
  request rather than priced, because the price guide has no figures for them
  and inventing any would be worse than none. One WhatsApp button asks for a
  quote.
- `about.otherServices` in `site.config.mjs`, so the list lives in one place.

### Changed

- The About page credentials line listed "weddings, corporate, food, product
  and family", which no longer matched the services Harith actually names. It
  now reads weddings, studio, product, food, corporate and events.

### Note

Harith mentioned **family shoots** in an earlier message but not in his latest
list, so they are left out. Adding them back is one line in `site.config.mjs`.
"Corporate" is spelled correctly on the site.

## [1.5.0] — 2026-09-08

### Changed

- **The About page is now Harith's own copy**, in his own words, lightly set
  rather than rewritten. It closes on his line: "Because your wedding happens
  once. Your memories shouldn't."
- Timeline corrected throughout: a camera in hand from around age five, Head of
  Photography for Pahasara at UCSC, years of assisting, and the **first wedding
  in December 2020**.

### Fixed

- The site said weddings had been photographed **since 2019**. The correct date
  is December 2020. It appeared on the home page statistics, in the home
  introduction and in the About narrative.
- Removed the last "since 2017" framing along with it.

### Note

Details Harith mentioned earlier are not in his final copy and were therefore
dropped rather than merged in: the Photographic Society at D. S. Senanayake
College, winning Pilibimbu, saving bus fare for the Canon EOS 60D in 2014, and
the first paid shoot for Cafe Noir in 2016. They are strong credentials and can
be folded back in on request.

## [1.4.0] — 2026-09-08

### Changed

- **Package CTAs open WhatsApp** instead of the contact form, each with the
  package already named in the message. Built in `build.mjs` rather than the
  template, because the message needs percent-encoding and the template engine
  only does HTML escaping.
- **The About page is now Harith's actual story**: his father's camera, a PSP
  with a camera bolted to it, three years of saved bus fare, a Canon EOS 60D in
  grade 11, the Photographic Society at D. S. Senanayake College, winning
  Pilibimbu, a first paid food shoot for Cafe Noir in 2016, a Sony A7 III in
  2019, and a Computer Science degree begun in a pandemic. It replaces the
  version I had written from three bare facts.
- Home page statistics now cite 1,000+ shoots and weddings since 2019.

### Fixed

- Copy claimed "around 700 edited photographs" for a full day. The real
  packages deliver 150 to 500, so the site was over-promising against its own
  price list. Corrected in the FAQ and on the home page.
- "Nine years" appeared in several places on an inconsistent basis. Replaced
  with the actual dates: paid work since 2016, weddings since 2019.
- The generated WhatsApp message read "the Package I package (Engagements)",
  since the non-wedding tiers are literally named "Package I".
- WhatsApp URLs no longer contain HTML entities: `encodeURIComponent` leaves
  apostrophes alone, which then became `&#39;` inside the href. Browsers decode
  that correctly but it made the attribute ambiguous to read and to test.

### Added

- End-to-end test asserting all eleven package CTAs point at wa.me, open in a
  new tab with `noopener`, carry a distinct prefilled message, and have an
  accessible name that includes the package — eleven links reading only "Ask
  about this one" would be useless to a screen reader.

## [1.3.0] — 2026-09-07

Tooling to turn the Instagram account into real, named portfolio galleries.

### Added

- `tools/instagram-export.mjs` and `tools/import-instagram.mjs`, plus
  `npm run instagram:import`. Reads an Instagram "Download Your Information"
  archive, groups posts into weddings by the couple named in the caption,
  copies the photographs into `photos/raw/`, and writes a reviewable draft to
  `content/collections.generated.mjs`.
- 21 unit tests covering the parsing, including Instagram's long-standing bug
  of writing captions as UTF-8 bytes re-encoded as Latin-1 — so `🤍` arrives as
  `ð¤` and has to be decoded back.
- [ADR-0006](docs/adr/0006-instagram-content.md) recording why this is an
  import rather than an embedded feed widget.

### Notes

- Instagram's CDN URLs were measured as expiring **4.4 days** out, so any
  approach referencing them rots within a week. Self-hosting is not a
  preference here, it is the only durable option.
- The importer never writes `content/collections.mjs` directly. Grouping by
  caption is a guess and these are real, named clients, so a person confirms it.
- Generated alt text is truthful but generic and is flagged for rewriting.

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
- Literal `·` separators believed to render as blank gaps, attributed to Jost
  lacking U+00B7; separators were redrawn in CSS. **This diagnosis was wrong —
  see 1.8.0.**
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
