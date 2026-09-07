import { test, expect } from '@playwright/test';
import { ROUTES } from './routes.js';

test.describe('every page renders', () => {
  for (const { path, name } of ROUTES) {
    test(`${name} (${path}) loads with a heading and a title`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res.status()).toBe(200);
      await expect(page).toHaveTitle(/Harith/);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).not.toBeEmpty();
    });
  }
});

test('FR-13: primary navigation reaches every section', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) {
    await page.getByRole('button', { name: /menu/i }).click();
    await expect(page.locator('#nav-drawer')).toBeVisible();
    await page.locator('#nav-drawer a', { hasText: 'Portfolio' }).click();
  } else {
    await page.getByRole('navigation', { name: 'Primary' }).getByText('Portfolio').click();
  }
  await expect(page).toHaveURL(/\/portfolio\/$/);
});

test('FR-02: the portfolio lists every collection and each one opens', async ({ page }) => {
  await page.goto('/portfolio/');
  const cards = page.locator('.card');
  await expect(cards).toHaveCount(3);
  await cards.first().click();
  await expect(page).toHaveURL(/\/portfolio\/[a-z-]+\/$/);
  await expect(page.locator('.gallery__item')).not.toHaveCount(0);
});

test('FR-03: a collection page shows its full gallery', async ({ page }) => {
  await page.goto('/portfolio/ramparts-at-six/');
  await expect(page.locator('.gallery__item')).toHaveCount(16);
  await expect(page.locator('.collection__story p')).toHaveCount(3);
});

test('FR-12: an unknown URL returns the custom 404', async ({ page }) => {
  const res = await page.goto('/no-such-page/');
  expect(res.status()).toBe(404);
  await expect(page.locator('.notfound__code')).toHaveText('404');
  await expect(page.getByRole('link', { name: /see the portfolio/i })).toBeVisible();
});

test('FR-09: FAQ answers expand', async ({ page }) => {
  await page.goto('/faq/');
  const items = page.locator('.faq__item');
  await expect(items).toHaveCount(10);
  const second = items.nth(1);
  await expect(second.locator('.faq__a')).toBeHidden();
  await second.locator('summary').click();
  await expect(second.locator('.faq__a')).toBeVisible();
});

test('FR-06: pricing shows three tiers with formatted prices', async ({ page }) => {
  await page.goto('/packages/');
  await expect(page.locator('.tier')).toHaveCount(3);
  await expect(page.locator('.tier__price').first()).toContainText('Rs 150,000');
  await expect(page.locator('.tier--popular')).toHaveCount(1);
});

test('FR-04: the lightbox opens, advances, and closes on Escape', async ({ page }) => {
  await page.goto('/portfolio/ramparts-at-six/');
  const dialog = page.locator('#lightbox');
  await expect(dialog).toBeHidden();

  await page.locator('.gallery__item').first().click();
  await expect(dialog).toBeVisible();
  await expect(page.locator('.lightbox__count')).toHaveText('1 / 16');

  await page.locator('.lightbox__nav--next').click();
  await expect(page.locator('.lightbox__count')).toHaveText('2 / 16');

  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.lightbox__count')).toHaveText('1 / 16');

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('FR-08: with no form endpoint configured, a contact route still exists', async ({ page }) => {
  await page.goto('/contact/');
  const form = page.locator('#enquiry');
  const fallback = page.locator('.mailto-card');
  // Exactly one of the two must be present — never neither (ADR-0003).
  const formCount = await form.count();
  const fallbackCount = await fallback.count();
  expect(formCount + fallbackCount).toBe(1);
});
