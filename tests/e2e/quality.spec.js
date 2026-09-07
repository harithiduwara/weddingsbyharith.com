import { test, expect } from '@playwright/test';
import { ROUTES } from './routes.js';

/** NFR-06: no horizontal overflow anywhere, at any supported width. */
const WIDTHS = [320, 375, 414, 768, 1024, 1280, 1440, 2560];

test.describe('responsive layout', () => {
  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const offenders = [];
      for (const { path } of ROUTES) {
        await page.goto(path);
        const overflow = await page.evaluate(() => {
          const de = document.documentElement;
          return { scrollW: de.scrollWidth, clientW: de.clientWidth };
        });
        // 1px of tolerance for sub-pixel rounding.
        if (overflow.scrollW > overflow.clientW + 1) {
          offenders.push(`${path}: ${overflow.scrollW} > ${overflow.clientW}`);
        }
      }
      expect(offenders).toEqual([]);
    });
  }
});

/** NFR-07: no third-party runtime requests. */
test('the site makes no requests to any other origin', async ({ page }) => {
  const external = new Set();
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol !== 'data:') {
      external.add(url.origin);
    }
  });
  for (const { path } of ROUTES) {
    await page.goto(path, { waitUntil: 'networkidle' });
  }
  expect([...external]).toEqual([]);
});

test('no cookies are set', async ({ page, context }) => {
  await page.goto('/');
  await page.goto('/contact/');
  expect(await context.cookies()).toEqual([]);
});

/** NFR-01 / NFR-02: the things that actually make a photo site fast. */
test('every content image declares intrinsic dimensions', async ({ page }) => {
  const offenders = [];
  for (const { path } of ROUTES) {
    await page.goto(path);
    const bad = await page.evaluate(() =>
      [...document.images]
        .filter((i) => !i.getAttribute('width') || !i.getAttribute('height'))
        .filter((i) => !i.closest('#lightbox'))
        .map((i) => i.currentSrc || i.src),
    );
    if (bad.length) offenders.push(`${path}: ${bad.join(', ')}`);
  }
  expect(offenders).toEqual([]);
});

test('modern image formats are offered ahead of JPEG', async ({ page }) => {
  await page.goto('/portfolio/ramparts-at-six/');
  const types = await page.evaluate(() =>
    [...document.querySelectorAll('.gallery__item source')].map((s) => s.type),
  );
  expect(types).toContain('image/avif');
  expect(types).toContain('image/webp');
});

test('below-the-fold images are lazy, the hero is not', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('.hero__media img');
  await expect(hero).toHaveAttribute('fetchpriority', 'high');
  expect(await hero.getAttribute('loading')).toBeNull();
});

test('cumulative layout shift stays near zero on the home page', async ({ page }) => {
  await page.goto('/');
  const cls = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) total += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => resolve(total), 2500);
      }),
  );
  expect(cls).toBeLessThan(0.05);
});
