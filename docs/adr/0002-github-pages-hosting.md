# ADR-0002 — Host on GitHub Pages via a `gh-pages` branch

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

The client asked for GitHub hosting. GitHub Pages offers three publishing modes:
deploy-from-branch (root), deploy-from-branch (`/docs`), and GitHub Actions.

Two constraints shaped the choice. First, the build emits a `dist/` folder, so
serving `main` at root would mean either committing build output onto `main` or
restructuring the source to be servable directly. Second, the deploying account's
OAuth token lacks the `workflow` scope, so a push containing `.github/workflows/`
is rejected outright — an Actions-based deploy could not be established without a
credential change by the client.

## Decision

Publish from a dedicated `gh-pages` branch containing only build output, pushed by
`npm run deploy`. Ship the CI/CD workflow files in the repository so that an
Actions-based deploy can be switched on later without rework.

## Consequences

**Positive**

- `main` stays clean: reviewable diffs, no generated noise, no merge conflicts in
  minified output.
- Deployment works today with the credentials that actually exist.
- Zero hosting cost, free TLS, global CDN, custom-domain support.

**Negative**

- Deploys are triggered from a developer machine, so the build environment is not
  pinned. Mitigated by `engines` in `package.json` and by CI running the same build
  on every pull request once the workflow scope is granted.
- No preview deploys per pull request.
- Pages cannot set HTTP response headers, so CSP must be delivered via a `<meta>`
  tag and header-only protections (HSTS, `X-Frame-Options`) are unavailable.

**Migration path:** run `gh auth refresh -s workflow`, push
`.github/workflows/deploy.yml`, and switch the Pages source to GitHub Actions. The
workflow is already written and committed.
