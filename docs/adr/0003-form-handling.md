# ADR-0003 — Third-party form relay with a `mailto:` fallback

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

FR-07 requires an enquiry form. Static hosting cannot process a POST. The enquiry
path is the site's only conversion mechanism, so it must never be broken — including
in the window before the client has configured anything.

## Decision

The form posts to a configurable endpoint (`site.config.mjs → forms.endpoint`),
compatible with Formspree, Basin, or Web3Forms. When that value is left at its
placeholder, the build **substitutes** a styled `mailto:` block instead of rendering
a form that would silently fail.

Spam is handled with a honeypot field and a time-to-submit check rather than a
CAPTCHA, which would violate NFR-07 (no third-party runtime requests) and add an
accessibility barrier.

## Consequences

**Positive**

- The enquiry path is functional in every configuration state. There is no build in
  which a visitor can fill in a form that goes nowhere.
- No secrets in the repository — form endpoints are public write-only URLs.
- No CAPTCHA, so no third-party JS and no accessibility cost.

**Negative**

- Enquiries transit a third party, which must be named in the privacy notice.
- Free tiers cap submissions (typically 50/month); above that the client pays or
  self-hosts a relay. Acceptable per assumption A1.
- Honeypot + timing stops bulk bots but not a targeted human spammer.
