#!/usr/bin/env node
/**
 * Static site build (Phase 4 — Implementation).
 *
 *   node tools/build.mjs [--production] [--skip-images]
 *
 * Steps: optimise images → render pages → bundle CSS/JS → copy assets →
 * emit sitemap/robots → enforce budgets and the placeholder gate.
 *
 * The build is intentionally noisy about failure. A silently-wrong marketing
 * site is worse than one that refuses to build.
 */
import { readdir, readFile, writeFile, mkdir, rm, cp, access } from 'node:fs/promises';
import { join, dirname, basename, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderTemplate } from './template.mjs';
import { optimizeAll } from './optimize-images.mjs';
import { picture, preloadLink, fullSrc } from './media.mjs';
import { applyBasePath } from './basepath.mjs';
import siteConfig, { isTodo } from '../site.config.mjs';
import collections, { MIN_GALLERY } from '../content/collections.mjs';
import packages from '../content/packages.mjs';
import testimonials from '../content/testimonials.mjs';
import faqs from '../content/faqs.mjs';
import journal from '../content/journal.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');

const args = new Set(process.argv.slice(2));
const PRODUCTION = args.has('--production');
const SKIP_IMAGES = args.has('--skip-images');

/**
 * --preview-url=<url> builds for a staging origin, typically the GitHub project
 * page, so the site can be looked at before the custom domain's DNS is cut over.
 * It rewrites internal URLs for the sub-path, points canonicals at the staging
 * origin, omits CNAME (which would otherwise redirect the staging URL away),
 * and marks every page noindex so it cannot compete with the real site.
 */
const previewArg = [...args].find((a) => a.startsWith('--preview-url='));
const PREVIEW = previewArg ? new URL(previewArg.slice('--preview-url='.length)) : null;
const BASE_PATH = PREVIEW ? PREVIEW.pathname.replace(/\/+$/, '') : '';
const ORIGIN = PREVIEW ? PREVIEW.origin : siteConfig.url;

const BUDGETS = { js: 20 * 1024, css: 48 * 1024 }; // NFR-03

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );
const log = (msg) => console.log(msg);
const warnings = [];
const warn = (msg) => warnings.push(msg);

/* ── Placeholder detection ─────────────────────────────────────────────── */

function findPlaceholders() {
  const found = [];
  const walk = (obj, path) => {
    if (isTodo(obj)) return found.push(path);
    if (Array.isArray(obj)) return obj.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (obj && typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) walk(v, path ? `${path}.${k}` : k);
    }
  };
  walk(siteConfig, 'site.config');
  if (testimonials.some((t) => t.placeholder)) found.push('content/testimonials (sample copy)');
  if (packages.placeholder) found.push('content/packages (placeholder pricing)');
  if (collections.some((c) => c.placeholder))
    found.push('content/collections (placeholder imagery)');
  return found;
}

/* ── Asset bundling ────────────────────────────────────────────────────── */

/**
 * Conservative minification: strips comments and per-line indentation only.
 * It deliberately does not rewrite tokens — an aggressive regex minifier that
 * mangles a CSS `content:` string or a JS regex literal would be a silent
 * correctness bug, and gzip recovers most of the difference anyway.
 */
function squeeze(code, { block = true } = {}) {
  let out = code;
  if (block) out = out.replace(/\/\*[\s\S]*?\*\//g, '');
  return out
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== '')
    .map((l) => l.replace(/^\s+/, (m) => (m.length > 1 ? ' ' : m)))
    .join('\n');
}

async function bundle(dir, order, ext) {
  const files = await readdir(join(SRC, dir));
  const present = files.filter((f) => f.endsWith(ext));
  const missing = order.filter((f) => !present.includes(f));
  if (missing.length) throw new Error(`bundle: missing ${dir}/${missing.join(', ')}`);
  const extra = present.filter((f) => !order.includes(f));
  if (extra.length) warn(`${dir}/: not in bundle order, skipped — ${extra.join(', ')}`);

  const parts = [];
  for (const f of order) {
    parts.push(`/* ${dir}/${f} */\n` + (await readFile(join(SRC, dir, f), 'utf8')));
  }
  return squeeze(parts.join('\n'));
}

/* ── Templates ─────────────────────────────────────────────────────────── */

async function loadPartials() {
  const dir = join(SRC, 'partials');
  const out = {};
  for (const f of await readdir(dir)) {
    if (f.endsWith('.html')) out[basename(f, '.html')] = await readFile(join(dir, f), 'utf8');
  }
  return out;
}

/** Pull the leading `<!-- { …json… } -->` block off a page file. */
function extractMeta(src, id) {
  const m = src.match(/^\s*<!--\s*(\{[\s\S]*?\})\s*-->/);
  if (!m) throw new Error(`${id}: missing leading metadata comment`);
  let meta;
  try {
    meta = JSON.parse(m[1]);
  } catch (e) {
    throw new Error(`${id}: metadata is not valid JSON — ${e.message}`);
  }
  return { meta, body: src.slice(m[0].length) };
}

/* ── Structured data (FR-14) ───────────────────────────────────────────── */

function jsonLd(page, ctx) {
  const graph = [
    {
      '@type': 'LocalBusiness',
      '@id': `${siteConfig.url}/#business`,
      name: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
      image: `${siteConfig.url}${ctx.ogImage}`,
      priceRange: '££££',
      ...(isTodo(siteConfig.contact.email) ? {} : { email: siteConfig.contact.email }),
      ...(isTodo(siteConfig.contact.phoneHref) ? {} : { telephone: siteConfig.contact.phoneHref }),
      ...(isTodo(siteConfig.contact.baseCity)
        ? {}
        : {
            address: {
              '@type': 'PostalAddress',
              addressLocality: siteConfig.contact.baseCity,
              addressRegion: siteConfig.contact.baseRegion,
              addressCountry: siteConfig.contact.baseCountry,
            },
          }),
      ...(isTodo(siteConfig.social.instagram) ? {} : { sameAs: [siteConfig.social.instagram] }),
    },
    {
      '@type': 'WebSite',
      '@id': `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      publisher: { '@id': `${siteConfig.url}/#business` },
    },
  ];

  if (page.route !== '/') {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteConfig.url}/` },
        ...(page.breadcrumb ?? []).map((b, i) => ({
          '@type': 'ListItem',
          position: i + 2,
          name: b.label,
          item: `${siteConfig.url}${b.href}`,
        })),
      ],
    });
  }
  if (page.jsonLdExtra) graph.push(...page.jsonLdExtra);

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

/* ── Main ──────────────────────────────────────────────────────────────── */

const started = Date.now();
log(
  `\n▸ Building ${siteConfig.name} ` +
    `${PRODUCTION ? '(production)' : '(preview content)'}` +
    `${PREVIEW ? ` → staging at ${ORIGIN}${BASE_PATH}` : ''}`,
);

const placeholders = findPlaceholders();

// Keep dist/assets/img — it is the expensive, cached artefact.
for (const entry of (await exists(DIST)) ? await readdir(DIST) : []) {
  if (entry !== 'assets') await rm(join(DIST, entry), { recursive: true, force: true });
}
for (const entry of (await exists(join(DIST, 'assets')))
  ? await readdir(join(DIST, 'assets'))
  : []) {
  if (entry !== 'img') await rm(join(DIST, 'assets', entry), { recursive: true, force: true });
}
await mkdir(DIST, { recursive: true });

const images = SKIP_IMAGES
  ? JSON.parse(await readFile(join(ROOT, '.cache', 'images.json'), 'utf8'))
  : await optimizeAll({ quiet: true });
log(`  images: ${Object.keys(images).length} in manifest`);

const img = (slug) => {
  const e = images[slug];
  if (!e) throw new Error(`No image named "${slug}" — is photos/raw/${slug}.jpg present?`);
  return e;
};

/* Decorate content with rendered markup ------------------------------------ */

const SIZES = {
  hero: '100vw',
  grid: '(min-width: 1100px) 33vw, (min-width: 700px) 50vw, 100vw',
  wide: '(min-width: 1100px) 66vw, 100vw',
  card: '(min-width: 900px) 40vw, 100vw',
};

// Every photograph carries its own alt text written by hand: these are real,
// identifiable clients, not stock, so a generated "photograph 3 of 9" would be
// both useless to a screen reader and faintly disrespectful.
const publishedCollections = collections.filter((c) => c.images.length >= MIN_GALLERY);
const pendingCollections = collections.filter((c) => c.images.length < MIN_GALLERY);

const decoratedCollections = publishedCollections.map((c) => {
  const coverAlt = c.images.find((im) => im.slug === c.cover)?.alt ?? c.title;
  return {
    ...c,
    href: `/portfolio/${c.slug}/`,
    coverHtml: picture(img(c.cover), {
      alt: coverAlt,
      sizes: SIZES.card,
      className: 'photo--cover',
    }),
    gallery: c.images.map((im, i) => {
      const e = img(im.slug);
      return {
        slug: im.slug,
        alt: im.alt,
        full: fullSrc(e),
        width: e.width,
        height: e.height,
        orientation: e.orientation,
        html: picture(e, { alt: im.alt, sizes: SIZES.grid, eager: i < 2 }),
      };
    }),
    imageCount: c.images.length,
  };
});

// Prices are grouped for display (£2,950 not £2950) but kept as numbers in
// content/packages.mjs so they stay sortable and machine-readable.
const money = new Intl.NumberFormat('en-GB');
// encodeURIComponent leaves ! ' ( ) * alone. They are legal in a query string,
// but an apostrophe then gets HTML-escaped into &#39; inside the href, which
// browsers do decode correctly but which makes the raw attribute ambiguous to
// read and to test. Encoding them too keeps the URL free of anything that
// needs HTML escaping at all.
const encodeStrict = (s) =>
  encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
const waLink = (text) => `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeStrict(text)}`;
const withPrice = (t) => ({ ...t, priceDisplay: money.format(t.price) });
const decoratedPackages = {
  ...packages,
  groups: packages.groups.map((g) => ({
    ...g,
    tiers: g.tiers.map((t) => ({
      ...withPrice(t),
      // Phrased to read correctly for both "Gold" and "Package I", since the
      // non-wedding tiers are literally named "Package I", "Package II".
      whatsappHref: waLink(
        `Hi Harith, I saw the ${t.name} option under ${g.name} on your website. Is my date free?`,
      ),
    })),
  })),
  extras: packages.extras.map(withPrice),
  // Flattened for the enquiry form's package selector.
  allTiers: packages.groups.flatMap((g) =>
    g.tiers.map((t) => ({ ...t, groupName: g.name, label: `${g.name} — ${t.name}` })),
  ),
  fromDisplay: money.format(Math.min(...packages.groups[0].tiers.map((t) => t.price))),
};

const decoratedJournal = journal
  .slice()
  .sort((a, b) => b.date.localeCompare(a.date))
  .map((p) => ({
    ...p,
    href: `/journal/${p.slug}/`,
    dateDisplay: new Date(p.date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    coverHtml: picture(img(p.cover), {
      alt: p.title,
      sizes: SIZES.card,
      className: 'photo--cover',
    }),
    bodyHtml: p.body
      .map(([tag, text]) => (tag === 'h2' ? `<h2 class="prose__h">${text}</h2>` : `<p>${text}</p>`))
      .join('\n'),
  }));

/* Page set ------------------------------------------------------------------ */

const partials = await loadPartials();
const layout = await readFile(join(SRC, 'layouts', 'base.html'), 'utf8');

const pageFiles = [];
async function collect(dir, prefix = '') {
  for (const e of await readdir(join(SRC, 'pages', dir), { withFileTypes: true })) {
    if (e.isDirectory()) await collect(join(dir, e.name), `${prefix}${e.name}/`);
    else if (e.name.endsWith('.html')) pageFiles.push({ dir, file: e.name, prefix });
  }
}
await collect('');

const pages = [];

for (const { dir, file, prefix } of pageFiles) {
  const id = `src/pages/${prefix}${file}`;
  const raw = await readFile(join(SRC, 'pages', dir, file), 'utf8');
  const { meta, body } = extractMeta(raw, id);
  const name = basename(file, '.html');
  const route =
    meta.route ??
    (name === 'index' ? `/${prefix}` : name === '404' ? '/404' : `/${prefix}${name}/`);
  const page = { ...meta, id, route, template: body };
  // The FAQ route earns a FAQPage graph node; it is the one page whose rich
  // result meaningfully changes the search listing (FR-14).
  if (route === '/faq/') {
    page.jsonLdExtra = [
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ];
  }
  pages.push(page);
}

// Generated: one page per collection (FR-03)
const collectionTpl = await readFile(join(SRC, 'templates', 'collection.html'), 'utf8');
for (const c of decoratedCollections) {
  pages.push({
    title: c.title,
    description: c.excerpt,
    route: c.href,
    ogImage: c.cover,
    bodyClass: 'page--collection',
    breadcrumb: [
      { label: 'Portfolio', href: '/portfolio/' },
      { label: c.title, href: c.href },
    ],
    template: collectionTpl,
    data: { collection: c },
    id: `generated:collection/${c.slug}`,
    jsonLdExtra: [
      {
        '@type': 'ImageGallery',
        name: c.title,
        description: c.excerpt,
        url: `${siteConfig.url}${c.href}`,
      },
    ],
  });
}

// Generated: one page per journal post (FR-10)
const journalTpl = await readFile(join(SRC, 'templates', 'journal-post.html'), 'utf8');
for (const p of decoratedJournal) {
  pages.push({
    title: p.title,
    description: p.excerpt,
    route: p.href,
    ogImage: p.cover,
    bodyClass: 'page--article',
    breadcrumb: [
      { label: 'Journal', href: '/journal/' },
      { label: p.title, href: p.href },
    ],
    template: journalTpl,
    data: { post: p },
    id: `generated:journal/${p.slug}`,
    jsonLdExtra: [
      {
        '@type': 'BlogPosting',
        headline: p.title,
        description: p.excerpt,
        datePublished: p.date,
        image: `${siteConfig.url}${fullSrc(img(p.cover))}`,
        author: { '@type': 'Person', name: 'Harith' },
        publisher: { '@id': `${siteConfig.url}/#business` },
      },
    ],
  });
}

/* Render -------------------------------------------------------------------- */

const formConfigured = !isTodo(siteConfig.forms.endpoint);
const emailConfigured = !isTodo(siteConfig.contact.email);
const mentorsKnown = !isTodo(siteConfig.about.mentors);

// Inline the brand SVG so it can inherit currentColor; fall back to <img> for
// a raster file, and to the text wordmark when no logo is configured at all.
const logoFile = siteConfig.brand?.logo ?? null;
let brandLogo = null;
if (logoFile) {
  const logoPath = join(SRC, 'assets', logoFile);
  if (!(await exists(logoPath))) {
    throw new Error(`brand.logo is "${logoFile}" but src/assets/${logoFile} does not exist`);
  }
  brandLogo = logoFile.endsWith('.svg')
    ? (await readFile(logoPath, 'utf8'))
        .replace(/<\?xml[^>]*\?>/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s(?:width|height)="[^"]*"/g, '')
        .trim()
    : `<img src="/assets/${logoFile}" alt="" width="180" height="48">`;
}

const globals = {
  site: siteConfig,
  collections: decoratedCollections,
  pendingCollections,
  featured: decoratedCollections.filter((c) => c.featured),
  packages: decoratedPackages,
  testimonials,
  faqs,
  journal: decoratedJournal,
  year: new Date().getFullYear(),
  formConfigured,
  emailConfigured,
  mentorsKnown,
  brandLogo,
  hasBrandLogo: Boolean(brandLogo),
  isPreview: placeholders.length > 0,
  placeholderCount: placeholders.length,
  heroHtml: picture(img('wedding-02'), {
    alt: 'A couple hold each other under a large tree, the bride’s train spread across the grass.',
    sizes: '(min-width: 62rem) 34rem, 100vw',
    eager: true,
  }),
  heroPreload: preloadLink(img('wedding-02'), '(min-width: 62rem) 34rem, 100vw'),
  aboutHtml: picture(img('wedding-05'), {
    alt: 'A close portrait in low light. The bride in a red saree, the groom just behind her.',
    sizes: SIZES.card,
  }),
  ctaHtml: picture(img('wedding-06'), {
    alt: '',
    decorative: true,
    sizes: SIZES.hero,
    className: 'photo--hero',
  }),
  servicesWhatsapp: waLink(
    "Hi Harith, I'd like a quote for a shoot that isn't a wedding. Here's what I need:",
  ),
  // CSP needs the form relay's origin explicitly; '' when unconfigured.
  formOrigin: formConfigured ? new URL(siteConfig.forms.endpoint).origin : '',
  img: (slug, alt, sizes) => picture(img(slug), { alt, sizes }),
};

let htmlBytes = 0;
for (const page of pages) {
  const ogEntry = img(page.ogImage ?? siteConfig.seo.defaultImage);
  const ctx = {
    ...globals,
    ...(page.data ?? {}),
    navItems: siteConfig.nav.map((n) => ({
      ...n,
      current: page.route === n.href || (n.href !== '/' && page.route.startsWith(n.href)),
    })),
    page: {
      ...page,
      canonical: `${ORIGIN}${BASE_PATH}${page.route === '/404' ? '/404' : page.route}`,
      noindex: PREVIEW ? true : page.noindex,
      fullTitle:
        page.route === '/'
          ? `${siteConfig.name} — ${siteConfig.tagline}`
          : siteConfig.seo.titleTemplate.replace('%s', page.title),
    },
    ogImage: fullSrc(ogEntry),
  };
  ctx.ogImage = fullSrc(ogEntry);
  ctx.ogImageAbs = `${ORIGIN}${BASE_PATH}${fullSrc(ogEntry)}`;
  ctx.page.jsonLd = jsonLd(page, ctx);
  ctx.page.preload = page.route === '/' ? globals.heroPreload : '';

  let content;
  try {
    content = renderTemplate(page.template, ctx, partials);
  } catch (e) {
    throw new Error(`Rendering ${page.id}: ${e.message}`);
  }
  // Conditional blocks leave ragged line ends behind; trimming them keeps the
  // output diffable and satisfies the validator's no-trailing-whitespace rule.
  const html = applyBasePath(renderTemplate(layout, { ...ctx, content }, partials), BASE_PATH)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line, i, all) => !(line === '' && all[i - 1] === ''))
    .join('\n');

  const outPath =
    page.route === '/404'
      ? join(DIST, '404.html')
      : join(DIST, page.route.replace(/^\//, ''), 'index.html');
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, html);
  htmlBytes += Buffer.byteLength(html);
}
log(`  pages:  ${pages.length} rendered (${(htmlBytes / 1024).toFixed(0)} KB HTML)`);

/* Assets -------------------------------------------------------------------- */

const css = await bundle(
  'styles',
  ['fonts.css', 'tokens.css', 'reset.css', 'base.css', 'layout.css', 'components.css', 'pages.css'],
  '.css',
);
const js = await bundle('scripts', ['enhance.js'], '.js');

await mkdir(join(DIST, 'assets'), { recursive: true });
await writeFile(join(DIST, 'assets', 'site.css'), applyBasePath(css, BASE_PATH));
await writeFile(join(DIST, 'assets', 'site.js'), js);
await cp(join(SRC, 'assets'), join(DIST, 'assets'), { recursive: true });
if (BASE_PATH) {
  const manifestPath = join(DIST, 'assets', 'site.webmanifest');
  await writeFile(manifestPath, applyBasePath(await readFile(manifestPath, 'utf8'), BASE_PATH));
}

const cssBytes = Buffer.byteLength(css);
const jsBytes = Buffer.byteLength(js);
log(`  assets: CSS ${(cssBytes / 1024).toFixed(1)} KB · JS ${(jsBytes / 1024).toFixed(1)} KB`);

/* sitemap + robots + Pages plumbing (FR-15) --------------------------------- */

const indexable = pages.filter((p) => p.route !== '/404' && p.noindex !== true);
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  indexable
    .map(
      (p) =>
        `  <url><loc>${ORIGIN}${BASE_PATH}${p.route}</loc>` +
        `<changefreq>${p.route === '/' ? 'weekly' : 'monthly'}</changefreq>` +
        `<priority>${p.route === '/' ? '1.0' : p.route.startsWith('/portfolio') ? '0.8' : '0.6'}</priority>` +
        '</url>',
    )
    .join('\n') +
  '\n</urlset>\n';
await writeFile(join(DIST, 'sitemap.xml'), sitemap);

await writeFile(
  join(DIST, 'robots.txt'),
  PREVIEW
    ? `User-agent: *\nDisallow: /\n`
    : `User-agent: *\nAllow: /\n\nSitemap: ${siteConfig.url}/sitemap.xml\n`,
);
// A CNAME on a preview build would redirect the staging URL to the custom
// domain, which is the one thing a preview must not do.
if (PREVIEW) {
  await rm(join(DIST, 'CNAME'), { force: true });
} else {
  await writeFile(join(DIST, 'CNAME'), `${siteConfig.domain}\n`);
}
await writeFile(join(DIST, '.nojekyll'), '');

/* Gates --------------------------------------------------------------------- */

const failures = [];
if (jsBytes > BUDGETS.js) {
  failures.push(`JS budget: ${(jsBytes / 1024).toFixed(1)} KB > ${BUDGETS.js / 1024} KB (NFR-03)`);
}
if (cssBytes > BUDGETS.css) {
  failures.push(`CSS budget: ${(cssBytes / 1024).toFixed(1)} KB > ${BUDGETS.css / 1024} KB`);
}

if (placeholders.length) {
  if (PRODUCTION) {
    failures.push(
      `${placeholders.length} placeholder value(s) remain — a production build must not ship them:\n` +
        placeholders.map((p) => `      · ${p}`).join('\n'),
    );
  } else {
    warn(`${placeholders.length} placeholder value(s); a preview ribbon is shown on every page.`);
  }
}

for (const w of warnings) log(`  ⚠ ${w}`);

if (failures.length) {
  console.error('\n✗ Build failed:\n' + failures.map((f) => `    ${f}`).join('\n') + '\n');
  process.exit(1);
}

log(`✓ Built to dist/ in ${((Date.now() - started) / 1000).toFixed(1)}s\n`);
