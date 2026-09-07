# ADR-0005 — A bespoke ~150-line template engine

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

ADR-0001 rules out a framework, but fifteen pages sharing a header, footer, and
`<head>` cannot be hand-maintained without duplication — the duplication would
guarantee drift in exactly the places (meta tags, nav links) where drift is most
expensive.

## Decision

Implement a minimal engine in `tools/template.mjs` supporting: `{{ expr }}`
(HTML-escaped), `{{{ expr }}}` (raw), `{{#if}}/{{else}}/{{/if}}`,
`{{#each}}/{{/each}}` with `@index`/`@first`/`@last`, and `{{> partial }}`.
Escaping is on by default; raw output is opt-in and explicit.

## Consequences

**Positive**

- No dependency, and the syntax is a recognisable Mustache/Handlebars subset, so it
  is familiar despite being bespoke.
- Escape-by-default means a content author cannot accidentally introduce an XSS
  vector by putting a `<` in a testimonial.

**Negative**

- We own its correctness. Mitigated by `tests/unit/template.test.mjs`, which is the
  most thorough unit suite in the project and covers nesting, escaping, missing
  keys, and malformed tags.
- No partial arguments or macros. If a template ever needs them, that is the signal
  to reconsider ADR-0001.
