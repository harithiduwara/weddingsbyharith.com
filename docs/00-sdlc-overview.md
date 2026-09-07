# SDLC Overview — WeddingsByHarith.com

This project follows a lightweight, documented software development lifecycle. Every
phase has a written artefact so decisions are traceable and reversible.

| #   | Phase                           | Artefact                                                   | Status   |
| --- | ------------------------------- | ---------------------------------------------------------- | -------- |
| 1   | Requirements & analysis         | [`01-requirements.md`](01-requirements.md)                 | Complete |
| 2   | Architecture & design decisions | [`02-architecture.md`](02-architecture.md), [`adr/`](adr/) | Complete |
| 3   | Design system & UX              | [`03-design-system.md`](03-design-system.md)               | Complete |
| 4   | Implementation                  | source in `src/`, `tools/`, `content/`                     | Complete |
| 5   | Verification & validation       | [`04-test-plan.md`](04-test-plan.md), `tests/`             | Complete |
| 6   | Release & deployment            | [`05-deployment-runbook.md`](05-deployment-runbook.md)     | Complete |
| 7   | Operation & maintenance         | [`06-maintenance.md`](06-maintenance.md)                   | Complete |

## Process model

A **incremental / iterative** model, not waterfall. Requirements were fixed up front
because the scope is a brochure site with a known shape, but implementation proceeded
in vertical slices (design system → layout engine → page → tests) so that every
increment was independently verifiable.

## Definition of Done

A change is done when **all** of the following hold:

1. The relevant document in `docs/` reflects the change.
2. `npm run build` succeeds with zero warnings.
3. `npm test` passes — unit, HTML validity, accessibility, and end-to-end.
4. Lighthouse budgets in `docs/04-test-plan.md` are met.
5. The change is on a branch, reviewed via pull request, and merged to `main`.

## Traceability

Every requirement in `01-requirements.md` carries an ID (`FR-n`, `NFR-n`).
Tests in `tests/` reference those IDs in their titles, so coverage of a requirement
can be established by grepping the test suite:

```
grep -rn "FR-07" tests/
```
