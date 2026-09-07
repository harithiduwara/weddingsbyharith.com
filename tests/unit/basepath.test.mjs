/**
 * The base-path rewriter. It runs over every finished document, so a mistake
 * here breaks every URL on the site at once — hence the emphasis on what it
 * must NOT touch.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { applyBasePath } from '../../tools/basepath.mjs';

const B = '/weddingsbyharith.com';

describe('rewrites internal URLs', () => {
  test('href, src and action', () => {
    assert.equal(applyBasePath('<a href="/portfolio/">', B), `<a href="${B}/portfolio/">`);
    assert.equal(applyBasePath('<img src="/a.jpg">', B), `<img src="${B}/a.jpg">`);
    assert.equal(applyBasePath('<form action="/x">', B), `<form action="${B}/x">`);
  });

  test('the bare root link', () => {
    assert.equal(applyBasePath('<a href="/">Home</a>', B), `<a href="${B}/">Home</a>`);
  });

  test('every candidate in a srcset', () => {
    const out = applyBasePath('<img srcset="/a-400.jpg 400w, /a-800.jpg 800w">', B);
    assert.ok(out.includes(`${B}/a-400.jpg 400w`));
    assert.ok(out.includes(`${B}/a-800.jpg 800w`));
  });

  test('imagesrcset on a preload link', () => {
    const out = applyBasePath('<link imagesrcset="/a.avif 400w, /b.avif 800w">', B);
    assert.ok(out.includes(`${B}/a.avif`));
    assert.ok(out.includes(`${B}/b.avif`));
  });

  test('CSS url() with and without quotes', () => {
    assert.equal(applyBasePath("url('/assets/f.woff2')", B), `url('${B}/assets/f.woff2')`);
    assert.equal(applyBasePath('url(/assets/f.woff2)', B), `url(${B}/assets/f.woff2)`);
  });
});

describe('leaves everything else alone', () => {
  test('absolute URLs', () => {
    const html = '<a href="https://example.com/x">';
    assert.equal(applyBasePath(html, B), html);
  });

  test('protocol-relative URLs', () => {
    const html = '<script src="//cdn.example.com/x.js">';
    assert.equal(applyBasePath(html, B), html);
  });

  test('mailto and tel', () => {
    const html = '<a href="mailto:a@b.com"><a href="tel:+441234">';
    assert.equal(applyBasePath(html, B), html);
  });

  test('fragments and relative paths', () => {
    const html = '<a href="#intro"><a href="sub/page/">';
    assert.equal(applyBasePath(html, B), html);
  });

  test('data: URIs — the LQIP placeholders must survive intact', () => {
    const html = '<picture style="background-image:url(data:image/jpeg;base64,AAA/BBB)">';
    assert.equal(applyBasePath(html, B), html);
  });

  test('a slash inside ordinary text', () => {
    const html = '<p>Coverage is 10/10 hours, and/or more.</p>';
    assert.equal(applyBasePath(html, B), html);
  });
});

describe('degenerate inputs', () => {
  test('an empty base is a no-op', () => {
    const html = '<a href="/x">';
    assert.equal(applyBasePath(html, ''), html);
    assert.equal(applyBasePath(html, undefined), html);
    assert.equal(applyBasePath(html, '/'), html);
  });

  test('trailing slashes on the base are normalised', () => {
    assert.equal(applyBasePath('<a href="/x">', '/base/'), '<a href="/base/x">');
    assert.equal(applyBasePath('<a href="/x">', '/base'), '<a href="/base/x">');
  });

  test('is idempotent in the sense that it never doubles a prefix it just added', () => {
    // Applying to already-rewritten output would double-prefix, which is why the
    // build applies it exactly once, at the end. Documented here deliberately.
    const once = applyBasePath('<a href="/x">', B);
    assert.equal(once, `<a href="${B}/x">`);
    assert.notEqual(applyBasePath(once, B), once);
  });
});
