import { test, expect } from '@playwright/test';
import { ROUTES } from './routes.js';

test.describe('per-page metadata', () => {
  for (const { path, name } of ROUTES) {
    test(`${name} has canonical, description and Open Graph tags`, async ({ page }) => {
      await page.goto(path);

      const canonical = await page.locator('link[rel=canonical]').getAttribute('href');
      expect(canonical).toBe(`https://weddingsbyharith.com${path}`);

      const desc = await page.locator('meta[name=description]').getAttribute('content');
      expect(desc.length).toBeGreaterThan(50);
      expect(desc.length).toBeLessThan(200);

      for (const prop of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) {
        const v = await page.locator(`meta[property="${prop}"]`).getAttribute('content');
        expect(v, `${prop} missing on ${path}`).toBeTruthy();
      }

      const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(ogImage).toMatch(/^https:\/\/weddingsbyharith\.com\/assets\/img\/.+\.jpg$/);
    });
  }
});

test('page titles are unique across the site', async ({ page }) => {
  const titles = [];
  for (const { path } of ROUTES) {
    await page.goto(path);
    titles.push(await page.title());
  }
  expect(new Set(titles).size).toBe(titles.length);
});

test('FR-14: structured data parses and identifies the business', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(raw); // throws the test if malformed
  expect(data['@context']).toBe('https://schema.org');
  const types = data['@graph'].map((n) => n['@type']);
  expect(types).toContain('LocalBusiness');
  expect(types).toContain('WebSite');
});

test('FR-14: the FAQ page emits FAQPage schema with every question', async ({ page }) => {
  await page.goto('/faq/');
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  const faq = data['@graph'].find((n) => n['@type'] === 'FAQPage');
  expect(faq).toBeDefined();
  expect(faq.mainEntity.length).toBe(10);
  expect(faq.mainEntity[0].acceptedAnswer.text.length).toBeGreaterThan(50);
});

test('FR-14: an article emits BlogPosting with a date', async ({ page }) => {
  await page.goto('/journal/timeline-that-actually-works/');
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  const post = data['@graph'].find((n) => n['@type'] === 'BlogPosting');
  expect(post).toBeDefined();
  expect(post.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test('FR-15: sitemap.xml lists every indexable route and excludes noindex pages', async ({
  request,
}) => {
  const res = await request.get('/sitemap.xml');
  expect(res.status()).toBe(200);
  const xml = await res.text();
  for (const { path } of ROUTES) {
    if (path === '/privacy/') continue; // noindex
    expect(xml, `sitemap missing ${path}`).toContain(
      `<loc>https://weddingsbyharith.com${path}</loc>`,
    );
  }
  expect(xml).not.toContain('/privacy/');
  expect(xml).not.toContain('/404');
});

test('FR-15: robots.txt allows crawling and points at the sitemap', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text();
  expect(txt).toContain('Allow: /');
  expect(txt).toContain('Sitemap: https://weddingsbyharith.com/sitemap.xml');
});

test('the privacy page is excluded from indexing', async ({ page }) => {
  await page.goto('/privacy/');
  const robots = await page.locator('meta[name=robots]').getAttribute('content');
  expect(robots).toContain('noindex');
});

test('a Content-Security-Policy is delivered', async ({ page }) => {
  await page.goto('/');
  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content');
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
});

test('the CNAME file pins the custom domain', async ({ request }) => {
  const txt = await (await request.get('/CNAME')).text();
  expect(txt.trim()).toBe('weddingsbyharith.com');
});
