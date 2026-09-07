# ADR-0001 — Hand-built static generator instead of a JS framework

- **Status:** Accepted
- **Date:** 2026-09-07
- **Deciders:** Harith (owner), engineering

## Context

The site is fifteen routes of editorial content with no dynamic behaviour, no auth,
and no data that changes per request. It must hit LCP < 2.5 s on mobile (NFR-01),
ship < 20 KB of JavaScript (NFR-03), and work with JavaScript disabled (NFR-05).
It also has to be maintainable by a photographer, not a front-end team.

## Decision

Build a purpose-made static site generator: a ~150-line template engine plus a build
script, with data in plain ES modules. No React, no Vue, no Astro, no Eleventy.

## Consequences

**Positive**

- Runtime JavaScript is only what we deliberately write. NFR-03 and NFR-05 become
  trivially satisfiable rather than a fight against a framework's hydration model.
- Three production dependencies instead of ~900 transitive ones. Dramatically smaller
  supply-chain surface and no upgrade treadmill.
- The whole build is readable in one sitting, so a future maintainer can debug it.

**Negative**

- We own the template engine, including its bugs. Mitigated by unit tests in
  `tests/unit/template.test.mjs` covering escaping, nesting, and loop edge cases.
- No ecosystem plugins. Accepted: the feature list is closed and small.
- Contributors must learn a bespoke (if tiny) syntax rather than a known one.

**Revisit if** the site gains authenticated areas, a CMS, or per-request rendering —
at which point Astro is the recommended migration target, since its content-collection
model maps closely onto `content/*.mjs`.
