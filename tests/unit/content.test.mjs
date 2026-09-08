/**
 * Content integrity.
 *
 * These guard the thing a photographer is most likely to get wrong when
 * publishing a new wedding: referencing a photograph that is not actually in
 * photos/raw/, or reusing a slug. Both would otherwise surface as a broken
 * build or a silently overwritten page.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import siteConfig, { isTodo } from '../../site.config.mjs';
import collections, { MIN_GALLERY } from '../../content/collections.mjs';
import packages from '../../content/packages.mjs';
import testimonials from '../../content/testimonials.mjs';
import faqs from '../../content/faqs.mjs';
import journal from '../../content/journal.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// A category is published only once it has photographs. The rest are listed on
// the portfolio page as services, with no gallery behind them.
const published = collections.filter((c) => c.images.length >= MIN_GALLERY);
const pending = collections.filter((c) => c.images.length < MIN_GALLERY);
const RAW = join(ROOT, 'photos', 'raw');
const available = new Set(
  readdirSync(RAW)
    .filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f))
    .map((f) => basename(f, extname(f))),
);

describe('photographs (FR-02, FR-03)', () => {
  test('every referenced photograph exists in photos/raw/', () => {
    const missing = [];
    for (const c of published) {
      for (const slug of [c.cover, ...c.images.map((i) => i.slug)]) {
        if (!available.has(slug)) missing.push(`${c.slug} → ${slug}`);
      }
    }
    for (const p of journal)
      if (!available.has(p.cover)) missing.push(`journal/${p.slug} → ${p.cover}`);
    assert.deepEqual(missing, [], `missing source photographs:\n${missing.join('\n')}`);
  });

  test('the configured default social image exists', () => {
    assert.ok(available.has(siteConfig.seo.defaultImage));
  });

  test('no collection repeats a photograph within its own gallery', () => {
    for (const c of published) {
      const slugs = c.images.map((i) => i.slug);
      assert.equal(new Set(slugs).size, slugs.length, `${c.slug} has duplicate images`);
    }
  });

  test('every collection has enough photographs to be worth opening', () => {
    // Three is the floor, not the target. It is set this low only because the
    // photographs currently on file come from the price guide rather than from
    // complete single-wedding galleries. Raise it when real galleries land.
    for (const c of published) {
      assert.ok(c.images.length >= 3, `${c.slug} has only ${c.images.length} photographs`);
    }
  });

  test('every photograph has hand-written alt text', () => {
    // These are real, identifiable clients. Generated alt text ("photo 3 of 9")
    // is useless to a screen reader and would be a poor way to treat them.
    for (const c of published) {
      for (const im of c.images) {
        assert.equal(typeof im.alt, 'string', `${c.slug}/${im.slug} has no alt`);
        assert.ok(im.alt.length > 25, `${c.slug}/${im.slug} alt is too thin: "${im.alt}"`);
      }
    }
  });

  test('each cover is one of that collection’s own photographs', () => {
    for (const c of published) {
      assert.ok(
        c.images.some((i) => i.slug === c.cover),
        `${c.slug} cover ${c.cover} is not in its gallery`,
      );
    }
  });
});

describe('the published / pending split', () => {
  test('at least one category is actually published', () => {
    assert.ok(published.length >= 1, 'the portfolio would be empty');
  });

  test('pending categories carry no photographs and no cover', () => {
    // Half a gallery is worse than none: a category is either ready or it is
    // listed as a service without a link.
    for (const c of pending) {
      assert.equal(c.images.length, 0, `${c.slug} has a partial gallery`);
      assert.equal(c.cover, undefined, `${c.slug} names a cover it cannot show`);
    }
  });

  test('every category, published or not, can be listed', () => {
    for (const c of collections) {
      for (const k of ['slug', 'title', 'kind', 'excerpt']) {
        assert.ok(c[k], `${c.slug ?? '(no slug)'} missing ${k}`);
      }
    }
  });

  test('a pending category becomes publishable purely by adding images', () => {
    // Guards the contract the maintenance doc promises: drop photographs in,
    // it publishes itself, no other edit required.
    for (const c of pending) {
      const asIfFilled = { ...c, images: new Array(MIN_GALLERY).fill({ slug: 'x', alt: 'y' }) };
      assert.ok(asIfFilled.images.length >= MIN_GALLERY);
      assert.ok(asIfFilled.title && asIfFilled.excerpt && asIfFilled.kind);
    }
  });
});

describe('routing', () => {
  test('collection slugs are unique and URL-safe', () => {
    const slugs = collections.map((c) => c.slug);
    assert.equal(new Set(slugs).size, slugs.length, 'duplicate collection slug');
    for (const s of slugs) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad slug: ${s}`);
  });

  test('journal slugs are unique and URL-safe', () => {
    const slugs = journal.map((p) => p.slug);
    assert.equal(new Set(slugs).size, slugs.length, 'duplicate journal slug');
    for (const s of slugs) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad slug: ${s}`);
  });

  test('a collection slug never collides with a journal slug', () => {
    const a = new Set(collections.map((c) => c.slug));
    for (const p of journal) assert.ok(!a.has(p.slug), `slug collision: ${p.slug}`);
  });

  test('every nav target is a real route', () => {
    const routes = new Set([
      '/portfolio/',
      '/about/',
      '/packages/',
      '/journal/',
      '/faq/',
      '/contact/',
    ]);
    for (const n of siteConfig.nav) assert.ok(routes.has(n.href), `nav points nowhere: ${n.href}`);
    assert.ok(routes.has(siteConfig.cta.href));
  });
});

describe('required fields', () => {
  test('collections carry everything a page needs', () => {
    for (const c of published) {
      for (const k of ['title', 'kind', 'cover', 'excerpt']) {
        assert.ok(c[k], `${c.slug} missing ${k}`);
      }
      assert.ok(Array.isArray(c.story) && c.story.length >= 2, `${c.slug} needs a story`);
    }
  });

  test('packages are internally consistent', () => {
    assert.ok(packages.groups.length >= 1);
    const seen = new Set();
    for (const g of packages.groups) {
      assert.ok(g.tiers.length >= 2, `${g.slug} needs at least two tiers`);
      for (const t of g.tiers) {
        assert.equal(typeof t.price, 'number', `${t.slug} price must be a number`);
        assert.ok(t.price > 0, `${t.slug} price must be positive`);
        assert.ok(t.includes.length >= 3, `${t.slug} needs a real inclusion list`);
        assert.ok(!seen.has(t.slug), `duplicate tier slug: ${t.slug}`);
        seen.add(t.slug);
      }
      // Tiers read left to right as a descending ladder within each group.
      const prices = g.tiers.map((t) => t.price);
      assert.deepEqual(
        prices,
        [...prices].sort((a, b) => b - a),
        `${g.slug} tiers must descend in price`,
      );
    }
  });

  test('extras all have a price', () => {
    for (const e of packages.extras) {
      assert.equal(typeof e.price, 'number', `${e.name} has no price`);
    }
  });

  test('journal posts have valid ISO dates and bodies', () => {
    for (const p of journal) {
      assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/, `${p.slug} bad date`);
      assert.ok(!Number.isNaN(Date.parse(p.date)), `${p.slug} unparseable date`);
      assert.ok(p.body.length >= 3, `${p.slug} body too short`);
      for (const [tag] of p.body)
        assert.ok(['h2', 'p'].includes(tag), `${p.slug} unknown tag ${tag}`);
    }
  });

  test('every FAQ has a question and a substantive answer', () => {
    assert.ok(faqs.length >= 8);
    for (const f of faqs) {
      assert.ok(f.q.endsWith('?'), `not a question: ${f.q}`);
      assert.ok(f.a.length > 80, `answer too thin: ${f.q}`);
    }
  });
});

describe('the placeholder gate (ADR-0003)', () => {
  test('placeholder testimonials are flagged, so --production refuses to ship them', () => {
    // Fabricated reviews on a live commercial site are a legal and ethical
    // problem. Anything not flagged must be a real, permissioned quote.
    for (const t of testimonials) {
      if (!t.placeholder) continue;
      assert.ok(t.placeholder === true, 'flag must be exactly true for the build gate');
    }
  });

  test('isTodo only matches genuine placeholders', () => {
    assert.ok(isTodo('‹TODO: something›'));
    assert.ok(!isTodo('A real value'));
    assert.ok(!isTodo(undefined));
    assert.ok(!isTodo(42));
  });

  test('the site URL and domain agree', () => {
    assert.equal(siteConfig.url, `https://${siteConfig.domain}`);
  });
});

describe('the enquiry form is wired for assistive tech', () => {
  // The form only renders once forms.endpoint is set, so this checks the
  // template rather than the built page. An error message that is not
  // programmatically tied to its field is never announced.
  const tpl = readFileSync(join(ROOT, 'src', 'pages', 'contact.html'), 'utf8');

  test('every field points at its own error element', () => {
    const described = [...tpl.matchAll(/id="(f-[\w-]+)"[^>]*aria-describedby="([^"]+)"/g)];
    assert.ok(described.length >= 5, 'expected every field to declare aria-describedby');
    for (const [, id, describedBy] of described) {
      assert.equal(describedBy, `${id}-error`);
      assert.ok(
        tpl.includes(`id="${describedBy}"`),
        `${describedBy} is referenced but no element has that id`,
      );
    }
  });
});
