# ADR-0004 — Build-time responsive images with `sharp`

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

A photography portfolio is mostly bytes of photograph. Naive delivery of 25 full-size
JPEGs is 40 MB+ and makes NFR-01 (LCP < 2.5 s) unreachable on mobile.

## Decision

Pre-generate derivatives at build time with `sharp`: five widths × three formats
(AVIF, WebP, JPEG), plus a 20 px inline LQIP. Emit `<picture>` with `srcset` and
`sizes`, `loading="lazy"` below the fold, `fetchpriority="high"` on the hero, and
explicit `width`/`height` from a build-time manifest.

## Consequences

**Positive**

- A mobile visitor downloads roughly 60–80 KB per photograph instead of 1.5 MB.
- Explicit intrinsic dimensions hold CLS near zero (NFR-02) with no JavaScript.
- Format negotiation is done by the browser via `<picture>`; no JS, no user-agent
  sniffing, no CDN service required.

**Negative**

- Cold builds are slow (~15 images/second). Mitigated by content-hash caching, so
  incremental builds are near-instant.
- `sharp` ships prebuilt native binaries, so the build is platform-sensitive.
  Pinned in `package.json` and exercised in CI on `ubuntu-latest`.
- Derivatives are committed to `gh-pages`, which grows that branch's history. It is
  force-pushed, so the history is disposable by design.
