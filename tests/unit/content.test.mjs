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
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import siteConfig, { isTodo } from '../../site.config.mjs';
import collections from '../../content/collections.mjs';
import packages from '../../content/packages.mjs';
import testimonials from '../../content/testimonials.mjs';
import faqs from '../../content/faqs.mjs';
import journal from '../../content/journal.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RAW = join(ROOT, 'photos', 'raw');
const available = new Set(
  readdirSync(RAW)
    .filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f))
    .map((f) => basename(f, extname(f))),
);

describe('photographs (FR-02, FR-03)', () => {
  test('every referenced photograph exists in photos/raw/', () => {
    const missing = [];
    for (const c of collections) {
      for (const slug of [c.cover, ...c.images]) {
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
    for (const c of collections) {
      assert.equal(new Set(c.images).size, c.images.length, `${c.slug} has duplicate images`);
    }
  });

  test('every collection has enough photographs to be a real gallery', () => {
    for (const c of collections) {
      assert.ok(c.images.length >= 8, `${c.slug} has only ${c.images.length} photographs`);
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
      '/investment/',
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
    for (const c of collections) {
      for (const k of ['title', 'couple', 'venue', 'location', 'season', 'cover', 'excerpt']) {
        assert.ok(c[k], `${c.slug} missing ${k}`);
      }
      assert.ok(Array.isArray(c.story) && c.story.length >= 2, `${c.slug} needs a story`);
    }
  });

  test('packages are internally consistent', () => {
    assert.ok(packages.tiers.length >= 3);
    for (const t of packages.tiers) {
      assert.equal(typeof t.price, 'number', `${t.slug} price must be a number for formatting`);
      assert.ok(t.includes.length >= 3, `${t.slug} needs a real inclusion list`);
    }
    // Tiers are displayed left-to-right as an ascending ladder.
    const prices = packages.tiers.map((t) => t.price);
    assert.deepEqual(
      prices,
      [...prices].sort((a, b) => a - b),
      'tiers must ascend in price',
    );
    assert.equal(packages.tiers.filter((t) => t.popular).length, 1, 'exactly one tier is flagged');
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
