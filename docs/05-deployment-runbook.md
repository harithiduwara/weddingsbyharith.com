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

**Read this before changing anything.** As of 2026-09-07 `weddingsbyharith.com`
is already live: it is registered, its nameservers are Cloudflare
(`lex.ns.cloudflare.com`, `karina.ns.cloudflare.com`), and it currently returns
a **301 redirect to `https://www.instagram.com/weddingsbyharith`**.

Pointing the domain at this site therefore _replaces_ that Instagram redirect.
That is a business decision, not a deployment step. GitHub Pages is already
serving the site correctly — verified by resolving the domain to a GitHub edge
IP directly — so the only thing standing between this repository and a live
site is the DNS cutover below.

#### Step 1 — remove the Instagram redirect

In the Cloudflare dashboard for the zone, delete the rule producing the 301.
Look under **Rules → Redirect Rules**, and also **Rules → Page Rules** on older
zones. If this rule survives, it will keep winning regardless of the DNS records
below, because it is evaluated at Cloudflare's edge before any origin is
contacted.

#### Step 2 — point the records at GitHub Pages

Replace the apex records with GitHub's:

| Type  | Name  | Value                      | Proxy        |
| ----- | ----- | -------------------------- | ------------ |
| A     | `@`   | `185.199.108.153`          | **DNS only** |
| A     | `@`   | `185.199.109.153`          | **DNS only** |
| A     | `@`   | `185.199.110.153`          | **DNS only** |
| A     | `@`   | `185.199.111.153`          | **DNS only** |
| AAAA  | `@`   | `2606:50c0:8000::153`      | **DNS only** |
| AAAA  | `@`   | `2606:50c0:8001::153`      | **DNS only** |
| AAAA  | `@`   | `2606:50c0:8002::153`      | **DNS only** |
| AAAA  | `@`   | `2606:50c0:8003::153`      | **DNS only** |
| CNAME | `www` | `harithiduwara.github.io.` | **DNS only** |

#### Step 3 — the Cloudflare proxy, specifically

Set the proxy status to **DNS only** (grey cloud), at least initially. With the
orange cloud on, GitHub cannot complete its ACME challenge and will never issue
a certificate, which leaves the site unreachable over HTTPS with a confusing
error.

Once GitHub reports the certificate as issued, you may re-enable the proxy — but
only with Cloudflare's SSL/TLS mode set to **Full (strict)**. "Flexible" mode
combined with GitHub's own HTTPS redirect produces an infinite redirect loop.

Honestly, leaving it on DNS only is the better default here: GitHub Pages is
already a CDN with free TLS, so Cloudflare's proxy adds a second cache and a
second failure mode for no benefit on a static site.

#### Step 4 — finish in GitHub

**Settings → Pages → Custom domain** → `weddingsbyharith.com`, then tick
**Enforce HTTPS** once the certificate is issued (usually under an hour, up to
24 in the worst case).

`dist/CNAME` is generated on every build from `site.config.mjs`, so the custom
domain survives force-pushes to `gh-pages`. Never add a CNAME file by hand.

### 3.3 Verify

```bash
curl -sI https://weddingsbyharith.com | head -1        # expect 200
curl -s https://weddingsbyharith.com/sitemap.xml | head -3
```

## 4. CI

`.github/workflows/ci.yml` is live and runs on every pull request and every push
to `main`: format check, build, unit tests, HTML validation, Playwright on
desktop and mobile, and a link check. The image cache is keyed on the contents
of `photos/raw/`, so a warm run skips the ~60 s encode.

`deploy.yml` is committed but deliberately left on `workflow_dispatch` only. To
switch deployment from the branch push to Actions: uncomment its `push` trigger
and set **Settings → Pages → Source** to **GitHub Actions**. `npm run deploy`
then becomes redundant.

### Node baseline

CI pins **Node 20**. `html-validate` v9 and above call `fs.globSync`, which does
not exist before Node 22, so major updates to it are held in
`.github/dependabot.yml` until the project's Node baseline moves. Raise
`engines.node` and the CI `node-version` together, then remove that ignore.

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
