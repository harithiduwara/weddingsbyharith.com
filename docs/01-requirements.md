# Phase 1 — Requirements & Analysis

## 1. Business context

Harith is a wedding photographer trading as **Weddings by Harith**. The website is the
top of the sales funnel: a couple discovers it via search, Instagram, or a venue
referral, spends 2–6 minutes evaluating the work, and either submits an enquiry or
leaves. There is no e-commerce, no login, and no user-generated content.

The single business metric that matters is **qualified enquiries per month**.
Everything on the site either moves a visitor toward the enquiry form or gets out of
the way.

## 2. Stakeholders

| Stakeholder                     | Interest                                                      |
| ------------------------------- | ------------------------------------------------------------- |
| Harith (owner/operator)         | Bookings; ability to update galleries without a developer     |
| Engaged couples (primary users) | Judge photographic quality fast; understand price and process |
| Wedding planners & venues       | Verify professionalism before referring                       |
| Search engines                  | Crawl, understand, and rank the content                       |

## 3. User personas

**P1 — "The Researcher" (Priya, 29).** Twelve months out. Comparing eight
photographers on a laptop. Wants volume of work, consistency of style, and a full
gallery of one real wedding start-to-finish — not just highlight frames.

**P2 — "The Deadline" (Sam, 34).** Eight weeks out, original photographer cancelled.
On a phone, on a train. Needs to know availability and starting price within 30
seconds, and to contact Harith without a laptop.

**P3 — "The Referrer" (Dana, venue coordinator).** Checking credibility before adding
Harith to a preferred-supplier list. Wants an about page, contact details, and
evidence of shooting at real venues.

## 4. User stories

- **US-1** As Priya, I want to view a complete wedding gallery so I can judge whether
  the photographer is consistent across a whole day, not just in ten hero shots.
- **US-2** As Sam, I want the starting price visible without emailing anyone so I do
  not waste time on someone out of budget.
- **US-3** As Sam, I want to submit an enquiry from a phone in under a minute.
- **US-4** As Dana, I want to see who the photographer is and how they work.
- **US-5** As Harith, I want to add a new wedding gallery by editing one data file and
  dropping in photos, without touching page markup.
- **US-6** As a visitor using a screen reader, I want to navigate galleries and submit
  the enquiry form without sighted assistance.

## 5. Functional requirements

| ID    | Requirement                                                                                                                     | Story      | Priority |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- |
| FR-01 | Home page presents a hero, a positioning statement, featured collections, social proof, a pricing signpost, and an enquiry CTA  | US-1,2     | Must     |
| FR-02 | Portfolio index lists every collection with a representative cover image and metadata (venue, season)                           | US-1       | Must     |
| FR-03 | Each collection has its own page with a full gallery of images and a short narrative                                            | US-1       | Must     |
| FR-04 | Gallery images open in a keyboard-navigable lightbox with next/previous and Escape-to-close                                     | US-1, US-6 | Must     |
| FR-05 | About page covers the photographer, approach, and credentials                                                                   | US-4       | Must     |
| FR-06 | Investment page lists three packages with inclusions and a starting price                                                       | US-2       | Must     |
| FR-07 | Contact page provides a validated enquiry form capturing name, email, date, venue, and message                                  | US-3       | Must     |
| FR-08 | Enquiry form degrades to a working `mailto:` link when no form backend is configured                                            | US-3       | Must     |
| FR-09 | FAQ page answers the ten most common pre-booking questions                                                                      | US-2, US-4 | Should   |
| FR-10 | Journal (blog) index and article pages for SEO and venue-specific landing content                                               | —          | Should   |
| FR-11 | All business-variable data (contact details, packages, collections, testimonials) lives in editable data files, never in markup | US-5       | Must     |
| FR-12 | Custom 404 page that routes visitors back into the portfolio                                                                    | —          | Should   |
| FR-13 | Site-wide navigation with a mobile drawer, and a persistent enquiry CTA                                                         | US-2, US-3 | Must     |
| FR-14 | Structured data (`LocalBusiness`, `ImageObject`, `FAQPage`, `BreadcrumbList`) emitted as JSON-LD                                | —          | Should   |
| FR-15 | `sitemap.xml` and `robots.txt` generated at build time from the actual page list                                                | —          | Should   |

## 6. Non-functional requirements

| ID     | Requirement                                                                        | Target                                | Verified by                                              |
| ------ | ---------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| NFR-01 | Largest Contentful Paint on a mid-tier mobile, 4G                                  | < 2.5 s                               | Lighthouse CI                                            |
| NFR-02 | Cumulative Layout Shift                                                            | < 0.05                                | Lighthouse CI; intrinsic `width`/`height` on every image |
| NFR-03 | Total JavaScript shipped, uncompressed                                             | < 20 KB                               | build-time budget check                                  |
| NFR-04 | Accessibility                                                                      | WCAG 2.2 AA, zero axe-core violations | `tests/e2e/a11y.spec.js`                                 |
| NFR-05 | Works with JavaScript disabled — all content readable, all links functional        | 100% of content                       | `tests/e2e/no-js.spec.js`                                |
| NFR-06 | Responsive from 320 px to 2560 px with no horizontal overflow                      | all breakpoints                       | `tests/e2e/responsive.spec.js`                           |
| NFR-07 | No third-party runtime requests by default (no CDN fonts, no trackers)             | 0 requests                            | `tests/e2e/privacy.spec.js`                              |
| NFR-08 | Every page valid HTML5                                                             | 0 errors                              | `html-validate`                                          |
| NFR-09 | No broken internal links                                                           | 0                                     | `linkinator`                                             |
| NFR-10 | Hosting cost                                                                       | $0                                    | GitHub Pages                                             |
| NFR-11 | Respects `prefers-reduced-motion` and `prefers-color-scheme`                       | both                                  | `tests/e2e/a11y.spec.js`                                 |
| NFR-12 | Images served as AVIF with WebP and JPEG fallbacks, correctly sized per breakpoint | all gallery images                    | build pipeline + `tests/unit/`                           |

## 7. Explicitly out of scope

Client photo-delivery galleries, online booking or payment, a CMS or admin UI,
multi-language content, and user accounts. Each would change the architecture from a
static site to an application; see [ADR-0001](adr/0001-static-site-over-framework.md).

## 8. Constraints & assumptions

- **C1** Hosting is GitHub Pages: static files only, no server-side execution.
- **C2** The domain `weddingsbyharith.com` is owned by the client and its DNS is
  under their control. DNS records are documented but not applied by this project.
- **C3** Photography in this repository is Unsplash-licensed placeholder work. It is
  clearly marked in `content/collections.mjs` and `photos/CREDITS.md` and **must** be
  replaced with the photographer's own work before commercial launch.
- **C4** Business contact details are placeholders pending client input; the build
  fails loudly if placeholders reach a production build (see `tools/build.mjs`).
- **A1** Enquiry volume is low enough (< 100/month) that a free third-party form
  relay is sufficient.
