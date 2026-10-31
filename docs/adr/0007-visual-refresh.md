# ADR-0007 — Visual refresh: modern editorial styling over the existing structure

- **Status:** Accepted
- **Date:** 2026-10-31

## Context

Harith asked for the site to look more modern, pointing at a draft redesign
(top bar with a pill CTA, layered hero photographs, a scrolling marquee, a
testimonial slider and a dark closing section). He was offered three options:
the sidebar layout of another photographer's site he admired, the draft
redesign, or a mix. He chose the draft redesign.

## Decision

Restyle within the existing templates, tokens and content model rather than
replacing them. No page, route, price, testimonial or photograph changes. The
new pieces follow the site's standing constraints:

- No third-party requests: no CDN font was added; the draft used Inter, the site
  keeps its self-hosted Jost.
- JavaScript stays additive: the slider is a scroll-snap row first and gains its
  controls from `enhance.js`.
- Contrast is measured, not estimated, in both themes.

## Consequences

- CSS grew from 33.9 KB to 38.0 KB and JS from 8.2 KB to 10.2 KB, both inside
  the NFR-03 budgets (48 KB and 20 KB).
- The marquee is the site's first infinite animation, so `settle()` now skips
  infinite animations when waiting for a page to come to rest.
- The draft's theme toggle was left out: the site already follows the system
  colour scheme, and a toggle would need stored state for no clear gain.
