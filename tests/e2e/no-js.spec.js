import { test, expect } from '@playwright/test';
import { ROUTES } from './routes.js';

/**
 * NFR-05. The site is progressive enhancement, so with JavaScript disabled
 * everything must still be readable and navigable. This is the suite that
 * would catch someone "improving" the site with a client-rendered component.
 */
test.use({ javaScriptEnabled: false });

test.describe('with JavaScript disabled', () => {
  for (const { path, name } of ROUTES) {
    test(`${name} still renders its content`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('main')).not.toBeEmpty();
    });
  }
});

test('content is not hidden by the reveal animation', async ({ page }) => {
  await page.goto('/');
  // .reveal only becomes transparent under html.js, which never gets added.
  const hidden = await page.evaluate(
    () =>
      [...document.querySelectorAll('.reveal')].filter(
        (el) => parseFloat(getComputedStyle(el).opacity) < 0.9,
      ).length,
  );
  expect(hidden).toBe(0);
});

test('the header is legible on pages without a hero', async ({ page }) => {
  await page.goto('/about/');
  const bg = await page.locator('.header').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});

test('FR-04: gallery images are still reachable as plain links', async ({ page }) => {
  await page.goto('/portfolio/weddings/');
  const href = await page.locator('.gallery__item').first().getAttribute('href');
  expect(href).toMatch(/^\/assets\/img\/.+\.jpg$/);
  const res = await page.request.get(href);
  expect(res.status()).toBe(200);
});

test('navigation works without the drawer script', async ({ page }) => {
  await page.goto('/');
  // The drawer is hidden, but the footer carries a full navigation.
  await page.locator('.footer__list a', { hasText: 'Portfolio' }).first().click();
  await expect(page).toHaveURL(/\/portfolio\/$/);
});

test('FAQ answers are readable via native <details>', async ({ page }) => {
  await page.goto('/faq/');
  await page.locator('.faq__item summary').nth(2).click();
  await expect(page.locator('.faq__item').nth(2).locator('.faq__a')).toBeVisible();
});
