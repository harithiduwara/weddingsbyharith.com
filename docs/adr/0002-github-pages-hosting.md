# ADR-0002 — Host on GitHub Pages via a `gh-pages` branch

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

The client asked for GitHub hosting. GitHub Pages offers three publishing modes:
deploy-from-branch (root), deploy-from-branch (`/docs`), and GitHub Actions.

The deciding constraint is that the build emits a `dist/` folder. Serving `main`
at root would mean either committing build output onto `main` — making every
diff unreviewable — or restructuring the source to be servable directly, which
would rule out a build step and therefore the image pipeline.

A second constraint was anticipated and turned out not to exist: the deploying
account's token reports only `gist, read:org, repo`, and pushes containing
`.github/workflows/` are commonly rejected without the `workflow` scope. In
practice GitHub accepted the push, and CI runs normally. The workflows are
therefore live, and the migration path below is available immediately rather
than being gated on a credential change.

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

**Migration path:** `.github/workflows/deploy.yml` is already committed and CI
already runs on every pull request. Adopting Actions-based deployment is just
uncommenting its `push` trigger and switching Settings → Pages → Source to
"GitHub Actions"; `npm run deploy` then becomes redundant.
