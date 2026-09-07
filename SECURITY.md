# Security policy

## Scope

This is a static marketing website. It has no server-side code, no database, no
authentication, and no user accounts. The attack surface is correspondingly
small, but not empty.

## Reporting

Please report suspected vulnerabilities privately via GitHub's **Security →
Report a vulnerability** on this repository, rather than opening a public issue.

## Design decisions that reduce risk

- **No third-party runtime code.** Fonts, styles and scripts are all served from
  this origin. There is no analytics snippet, tag manager or CDN script, so
  nothing about the site can be changed by a third party after it is deployed.
  This is asserted by a test, not just intended.
- **Content Security Policy** delivered via `<meta http-equiv>`, since GitHub
  Pages cannot set response headers: `default-src 'self'`, `object-src 'none'`,
  `base-uri 'none'`, and no `unsafe-inline` for scripts.
- **Escape-by-default templating.** The template engine HTML-escapes every
  interpolation; raw output requires explicit triple braces. Escaping is
  covered by unit tests treated as a security boundary.
- **No secrets in the repository.** None exist. The enquiry form endpoint is a
  public, write-only URL by design.
- **Dependencies are development-only** apart from `sharp`, and none of them
  reach the browser. Dependabot watches them weekly.

## Known accepted risks

- CSP is delivered by meta tag, so `frame-ancestors`, HSTS and
  `X-Content-Type-Options` cannot be set. This is a GitHub Pages limitation
  accepted in [ADR-0002](docs/adr/0002-github-pages-hosting.md).
- Enquiry data transits a third-party form relay
  ([ADR-0003](docs/adr/0003-form-handling.md)); the provider is named in the
  privacy notice.
- Spam protection is a honeypot plus a time-to-submit check, not a CAPTCHA.
  This stops bulk bots but not a determined human.
