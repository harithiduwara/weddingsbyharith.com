/**
 * Rewrites root-absolute URLs so the site can be served from a sub-path.
 *
 * GitHub project pages live at `<user>.github.io/<repo>/`, but every internal
 * URL in this site is root-absolute (`/assets/…`, `/portfolio/`). Rather than
 * thread a base variable through every template — which would be easy to forget
 * in one place and produce a single silent 404 — the whole rendered document is
 * rewritten once, here, where it can be tested in isolation.
 *
 * Only URL-bearing attributes and CSS url() are touched. Absolute URLs, data:
 * URIs, mailto: and fragment links are all left alone.
 */
const ATTRS = /(\s(?:href|src|action|content)=")\/(?!\/)/g;
const SRCSET = /(\s(?:srcset|imagesrcset)=")([^"]*)"/g;
const CSS_URL = /url\((['"]?)\/(?!\/)/g;

export function applyBasePath(text, base) {
  if (!base) return text;
  const clean = base.replace(/\/+$/, '');
  if (!clean) return text;

  return text
    .replace(ATTRS, `$1${clean}/`)
    .replace(SRCSET, (_m, prefix, list) => {
      const rewritten = list
        .split(',')
        .map((candidate) => candidate.replace(/^(\s*)\/(?!\/)/, `$1${clean}/`))
        .join(',');
      return `${prefix}${rewritten}"`;
    })
    .replace(CSS_URL, `url($1${clean}/`);
}

export default applyBasePath;
