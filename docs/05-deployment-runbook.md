# Phase 6 — Deployment runbook

## 1. Topology

```
main       source of truth. Never served.
gh-pages   build output only, force-pushed. This is what GitHub Pages serves.
```

See [ADR-0002](adr/0002-github-pages-hosting.md) for why deployment is a branch
push rather than a GitHub Action.

## 2. Routine deploy

```bash
npm ci
npm run build
npm test
npm run deploy
```

`npm run deploy` creates a temporary git worktree, replaces its contents with
`dist/`, commits, and force-pushes to `gh-pages`. It never touches your working
tree or current branch, and it removes the worktree afterwards.

**It refuses to publish a preview build.** If placeholder content is still
present the HTML carries a preview ribbon, and the deploy stops. To publish one
deliberately — to show the client, for instance:

```bash
npm run deploy -- --force
```

## 3. First-time setup (one-off)

### 3.1 Enable Pages

```bash
gh api -X POST repos/harithiduwara/weddingsbyharith.com/pages \
  -f "source[branch]=gh-pages" -f "source[path]=/"
```

Or: **Settings → Pages → Source: Deploy from a branch → `gh-pages` / `(root)`**.

### 3.2 DNS for the custom domain

At the registrar for `weddingsbyharith.com`:

| Type  | Host  | Value                      |
| ----- | ----- | -------------------------- |
| A     | `@`   | `185.199.108.153`          |
| A     | `@`   | `185.199.109.153`          |
| A     | `@`   | `185.199.110.153`          |
| A     | `@`   | `185.199.111.153`          |
| AAAA  | `@`   | `2606:50c0:8000::153`      |
| AAAA  | `@`   | `2606:50c0:8001::153`      |
| AAAA  | `@`   | `2606:50c0:8002::153`      |
| AAAA  | `@`   | `2606:50c0:8003::153`      |
| CNAME | `www` | `harithiduwara.github.io.` |

Then **Settings → Pages → Custom domain** → `weddingsbyharith.com`, and tick
**Enforce HTTPS** once the certificate is issued (usually under an hour; it can
take up to 24).

`dist/CNAME` is generated on every build from `site.config.mjs`, so the custom
domain survives force-pushes. Do not add a CNAME file by hand.

### 3.3 Verify

```bash
curl -sI https://weddingsbyharith.com | head -1        # expect 200
curl -s https://weddingsbyharith.com/sitemap.xml | head -3
```

## 4. Enabling CI (requires a credential change)

The workflows in `.github/workflows/` are written and committed but **cannot be
pushed by an OAuth token without the `workflow` scope**. GitHub rejects the push
outright. To enable them:

```bash
gh auth refresh -s workflow
```

Then push the workflow files. `ci.yml` runs build + tests on every pull request;
`deploy.yml` can take over deployment, at which point switch **Settings → Pages
→ Source** to **GitHub Actions** and `npm run deploy` becomes redundant.

## 5. Rollback

The published site is a branch, so rollback is a revert:

```bash
git fetch origin gh-pages
git log --oneline origin/gh-pages          # find the last good deploy
git push --force origin <good-sha>:gh-pages
```

Live again within a minute or two. Alternatively, check out the matching `main`
commit, rebuild, and redeploy — slower but reproducible.

## 6. Incident checklist

| Symptom                               | Likely cause                              | Action                                             |
| ------------------------------------- | ----------------------------------------- | -------------------------------------------------- |
| Site 404s entirely                    | Pages source reset, or `gh-pages` deleted | Re-run `npm run deploy`, re-check Settings → Pages |
| Custom domain 404s, `github.io` works | `CNAME` missing from the build output     | Confirm `dist/CNAME`, redeploy                     |
| Certificate error                     | Custom domain changed; cert re-issuing    | Untick and re-tick Enforce HTTPS, wait             |
| Images missing, HTML fine             | `dist/assets/img` not published           | `rm -rf dist .cache && npm run build`, redeploy    |
| CSS unstyled                          | `site.css` missing or CSP blocked it      | Check the browser console; verify the CSP meta tag |
| Enquiries stopped arriving            | Form relay quota or endpoint changed      | Test the form; check the provider dashboard        |

## 7. What is _not_ automated

- DNS. Records are documented above but applied by hand at the registrar.
- The Pages settings toggle.
- Certificate issuance.

These are deliberate: each is a one-off with a credential this project does not
and should not hold.
