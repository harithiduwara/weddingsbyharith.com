/**
 * The <picture> builder. Its contract is what keeps CLS at zero and what
 * guarantees no image ships without alt text.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { picture, fullSrc, preloadLink } from '../../tools/media.mjs';

const entry = {
  slug: 'demo',
  width: 1800,
  height: 1200,
  aspect: 1.5,
  orientation: 'landscape',
  lqip: 'data:image/jpeg;base64,AAAA',
  sources: {
    avif: [
      { w: 400, file: 'demo-400.aa.avif' },
      { w: 800, file: 'demo-800.aa.avif' },
    ],
    webp: [
      { w: 400, file: 'demo-400.aa.webp' },
      { w: 800, file: 'demo-800.aa.webp' },
    ],
    jpeg: [
      { w: 400, file: 'demo-400.aa.jpg' },
      { w: 800, file: 'demo-800.aa.jpg' },
    ],
  },
};

describe('accessibility contract (NFR-04)', () => {
  test('a missing alt is a build error', () => {
    assert.throws(() => picture(entry, {}), /alt text is required/);
    assert.throws(() => picture(entry, { alt: '   ' }), /alt text is required/);
  });

  test('an empty alt requires an explicit decorative flag', () => {
    assert.throws(() => picture(entry, { alt: '' }), /alt text is required/);
    assert.doesNotThrow(() => picture(entry, { alt: '', decorative: true }));
  });

  test('alt text is escaped', () => {
    const html = picture(entry, { alt: 'Tom & Jo\'s "day"' });
    assert.ok(html.includes('alt="Tom &amp; Jo&#39;s &quot;day&quot;"'));
    assert.ok(!html.includes('alt="Tom & Jo'));
  });
});

describe('layout stability (NFR-02)', () => {
  test('intrinsic width and height are always stamped', () => {
    const html = picture(entry, { alt: 'x' });
    assert.ok(html.includes('width="1800"'));
    assert.ok(html.includes('height="1200"'));
  });
});

describe('format negotiation (NFR-12)', () => {
  test('AVIF and WebP sources precede the JPEG fallback', () => {
    const html = picture(entry, { alt: 'x' });
    const avif = html.indexOf('image/avif');
    const webp = html.indexOf('image/webp');
    const img = html.indexOf('<img');
    assert.ok(avif > -1 && webp > -1, 'modern formats missing');
    assert.ok(avif < webp, 'AVIF must be offered before WebP');
    assert.ok(webp < img, 'sources must precede the img fallback');
    assert.ok(html.includes('demo-800.aa.jpg'), 'JPEG fallback missing from src');
  });

  test('srcset lists every generated width', () => {
    const html = picture(entry, { alt: 'x' });
    assert.ok(html.includes('demo-400.aa.avif 400w'));
    assert.ok(html.includes('demo-800.aa.avif 800w'));
  });
});

describe('loading strategy (NFR-01)', () => {
  test('below-the-fold images are lazy', () => {
    assert.ok(picture(entry, { alt: 'x' }).includes('loading="lazy"'));
  });

  test('eager images get fetch priority and are never lazy', () => {
    const html = picture(entry, { alt: 'x', eager: true });
    assert.ok(html.includes('fetchpriority="high"'));
    assert.ok(!html.includes('loading="lazy"'));
  });

  test('the LQIP is inlined so it costs no extra request', () => {
    assert.ok(picture(entry, { alt: 'x' }).includes('background-image:url(data:image/jpeg'));
    assert.ok(!picture(entry, { alt: 'x', lqip: false }).includes('background-image'));
  });
});

describe('helpers', () => {
  test('fullSrc returns the largest JPEG', () => {
    assert.equal(fullSrc(entry), '/assets/img/demo-800.aa.jpg');
  });

  test('preloadLink emits an AVIF imagesrcset', () => {
    const link = preloadLink(entry, '100vw');
    assert.ok(link.includes('rel="preload"'));
    assert.ok(link.includes('imagesrcset="/assets/img/demo-400.aa.avif 400w'));
  });

  test('a null entry is a build error, not a blank image', () => {
    assert.throws(() => picture(null, { alt: 'x' }), /missing manifest entry/);
  });
});
