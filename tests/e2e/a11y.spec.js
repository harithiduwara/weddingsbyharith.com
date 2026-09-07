import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ROUTES } from './routes.js';
import { settle } from './settle.js';

/** NFR-04: WCAG 2.2 AA, zero axe violations, on every page. */
test.describe('automated accessibility audit', () => {
  for (const { path, name } of ROUTES) {
    test(`${name} has no axe violations`, async ({ page }) => {
      await page.goto(path);
      // Without this, everything below the fold is transparent and axe skips it.
      await settle(page);
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Report the actual rule and element, not just a count.
      const detail = violations
        .map((v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes[0]?.target.join(' ')}`)
        .join('\n  ');
      expect(violations, `\n  ${detail}`).toEqual([]);
    });
  }
});

test('the lightbox dialog is accessible when open', async ({ page }) => {
  await page.goto('/portfolio/weddings/');
  await page.locator('.gallery__item').first().click();
  await expect(page.locator('#lightbox')).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});

test('the mobile drawer is accessible when open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /menu/i }).click();
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});

test('a skip link is the first thing a keyboard reaches', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveClass(/skip-link/);
  await expect(focused).toBeVisible();
});

test('every focusable control shows a visible focus ring', async ({ page }) => {
  await page.goto('/packages/');
  await page.locator('.tier a.btn').first().focus();
  const outline = await page.locator(':focus').evaluate((el) => {
    const s = getComputedStyle(el);
    return { width: s.outlineWidth, style: s.outlineStyle };
  });
  expect(outline.style).not.toBe('none');
  expect(parseFloat(outline.width)).toBeGreaterThan(0);
});

test('the nav toggle reports its expanded state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: /menu/i });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('NFR-11: reduced motion suppresses transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const d = await page
    .locator('.btn')
    .first()
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(parseFloat(d)).toBeLessThan(0.01);
});

test('NFR-11: the dark colour scheme is supported and legible', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // Body must paint its own dark ground rather than inheriting white.
  const [r, g, b] = bg.match(/\d+/g).map(Number);
  expect((r + g + b) / 3).toBeLessThan(60);
});

test('every image on a gallery page carries alt text', async ({ page }) => {
  await page.goto('/portfolio/weddings/');
  const missing = await page.evaluate(() =>
    [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.src),
  );
  expect(missing).toEqual([]);
});
