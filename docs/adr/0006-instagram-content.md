# ADR-0006 — Import Instagram content from the data export, not a feed widget

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

The client asked to bring his Instagram posts (`@weddingsbyharith`) onto the
site. The account is public and its captions carry couple names — _Ruchith &
Sandali_, _Sonali & Nipuna_, _Senuri | Themiya_ — so the posts are not just a
feed, they are the real, already-published weddings the portfolio has been
missing.

Three facts constrained the answer.

**Instagram's image URLs expire.** Measured against a live URL from the profile:
the `oe` parameter decoded to an expiry **4.4 days** away. Any approach that
stores or references a `scontent.cdninstagram.com` URL breaks within a week.
Images have to be downloaded and self-hosted whatever else is decided.

**The site promises zero third-party requests.** NFR-07 is asserted by a test
(`quality.spec.js`), enforced by a `default-src 'self'` CSP, and stated as fact
on the privacy page: no cookies, no analytics, nothing loaded from anybody
else's server.

**The API route needs credentials the project should not hold.** The Instagram
Basic Display API was retired in December 2024. Its replacement requires a
Professional account, a Meta developer app, and a 60-day token that must be
refreshed on a schedule.

## Decision

Import from Instagram's **"Download Your Information"** export. A local script
(`tools/import-instagram.mjs`) reads the archive, groups posts into weddings by
the couple named in the caption, copies the photographs into `photos/raw/`, and
writes a **draft** data file for a human to review before publication.

## Consequences

**Positive**

- Nothing changes at runtime. No third-party scripts, no cookies, no CSP
  exemption, no contradiction of the privacy notice, and no expiring URLs.
- The export contains the **original uploads**, which are far better than the
  410 × 615 files currently on file from the price guide PDF. This fixes the
  resolution problem as a side effect.
- No Meta app, no access token, no 60-day refresh, no credential in the repo.
- It works with a personal account. The API route does not.
- The importer never writes `content/collections.mjs` directly. Caption-based
  grouping is a guess, and these are real named clients, so a person confirms
  it before it is published.

**Negative**

- Refreshing is manual: request a new export, re-run the import. There is no
  "latest post" freshness.
- Exports take anywhere from minutes to a couple of days to arrive.
- The export gives the date a post was published, not the wedding date. The
  importer presents it as a month ("November 2023") rather than implying a
  precise day it cannot know.

**Rejected: a third-party feed widget** (Elfsight, LightWidget, SnapWidget).
Fastest to add and the worst fit. It loads Meta's scripts into every page,
sets cookies, tracks visitors, requires weakening the CSP, and would make the
privacy page untrue. On a site whose whole performance and privacy story is
"everything is served from this domain", it is the single change that would
undo the most.

**Rejected for now: Graph API sync.** A scheduled Action pulling new posts is
the right answer _if_ automatic freshness becomes worth the setup. It needs a
Professional account, a Meta app and token rotation, and it returns Instagram's
compressed renditions rather than the originals. Revisit if the client starts
posting weekly and wants the site to follow on its own.

## Testing note

The parsing is covered by `tests/unit/instagram-export.test.mjs` against
fixtures matching Instagram's real export schema, including its long-standing
bug of writing captions as UTF-8 bytes re-encoded as Latin-1 (so `🤍` arrives
as `ð¤`). The importer was also run end-to-end against a synthetic export
before being committed.
