/**
 * Turns a manifest entry into <picture> markup.
 *
 * Deliberately produced at build time rather than by a client-side helper: the
 * browser must be able to start fetching the right image from the raw HTML,
 * before any JavaScript runs (NFR-01, NFR-05).
 */
import { escapeHtml } from './template.mjs';

const MIME = { avif: 'image/avif', webp: 'image/webp', jpeg: 'image/jpeg' };
const ORDER = ['avif', 'webp']; // <img> itself carries the JPEG fallback

const srcset = (list) => list.map((s) => `/assets/img/${s.file} ${s.w}w`).join(', ');

/**
 * @param {object} entry     manifest entry from optimize-images
 * @param {object} o
 * @param {string} o.alt     required; throws if missing (accessibility, NFR-04)
 * @param {string} o.sizes   CSS `sizes` descriptor
 * @param {boolean} o.eager  above-the-fold: preload-priority, no lazy loading
 * @param {string} o.className
 * @param {boolean} o.lqip   inline blur-up placeholder as a CSS background
 */
export function picture(entry, o = {}) {
  if (!entry) throw new Error('picture(): missing manifest entry');
  // Purely decorative images must pass alt: '' *and* decorative: true, so that a
  // missing alt is always a build error rather than an accidental empty string.
  if (typeof o.alt !== 'string' || (o.alt.trim() === '' && !o.decorative)) {
    throw new Error(`picture(): alt text is required for "${entry.slug}"`);
  }

  const sizes = o.sizes ?? '100vw';
  const jpeg = entry.sources.jpeg;
  const fallback = jpeg[jpeg.length - 1];

  const sources = ORDER.filter((f) => entry.sources[f]?.length)
    .map(
      (f) =>
        `<source type="${MIME[f]}" srcset="${srcset(entry.sources[f])}" sizes="${escapeHtml(sizes)}">`,
    )
    .join('');

  const cls = ['photo', o.className].filter(Boolean).join(' ');
  const style = o.lqip === false ? '' : ` style="background-image:url(${entry.lqip})"`;

  const imgAttrs = [
    `src="/assets/img/${fallback.file}"`,
    `srcset="${srcset(jpeg)}"`,
    `sizes="${escapeHtml(sizes)}"`,
    `width="${entry.width}"`,
    `height="${entry.height}"`,
    `alt="${escapeHtml(o.alt)}"`,
    o.eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"',
  ].join(' ');

  return (
    `<picture class="${cls}" data-orientation="${entry.orientation}"${style}>` +
    `${sources}<img ${imgAttrs}></picture>`
  );
}

/** The <link rel=preload> for the LCP image. Shaves ~300ms off a cold mobile load. */
export function preloadLink(entry, sizes) {
  const avif = entry.sources.avif;
  if (!avif?.length) return '';
  // href is technically optional alongside imagesrcset, but older engines
  // ignore the preload entirely without it — and it is the required attribute
  // as far as the HTML validator is concerned.
  const mid = avif[Math.min(1, avif.length - 1)];
  return (
    `<link rel="preload" as="image" type="image/avif" href="/assets/img/${mid.file}" ` +
    `imagesrcset="${srcset(avif)}" imagesizes="${escapeHtml(sizes)}" fetchpriority="high">`
  );
}

/** Full-resolution URL used as the lightbox target and the <a href> fallback. */
export function fullSrc(entry) {
  const jpeg = entry.sources.jpeg;
  return `/assets/img/${jpeg[jpeg.length - 1].file}`;
}
