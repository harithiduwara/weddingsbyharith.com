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
  await expect(cards).toHaveCount(2);
  await cards.first().click();
  await expect(page).toHaveURL(/\/portfolio\/[a-z-]+\/$/);
  await expect(page.locator('.gallery__item')).not.toHaveCount(0);
});

test('FR-03: a collection page shows its full gallery', async ({ page }) => {
  await page.goto('/portfolio/weddings/');
  await expect(page.locator('.gallery__item')).toHaveCount(6);
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

test('FR-06: pricing shows every package with formatted prices', async ({ page }) => {
  await page.goto('/packages/');
  // 4 wedding + 3 engagement + 2 homecoming + 2 casual
  await expect(page.locator('.tier')).toHaveCount(11);
  await expect(page.locator('.tier__price').first()).toContainText('LKR 230,000');
  await expect(page.locator('.addons tbody tr')).toHaveCount(6);
});

test('every package CTA opens a WhatsApp chat naming that package', async ({ page }) => {
  await page.goto('/packages/');
  const ctas = page.locator('.tier a.btn');
  await expect(ctas).toHaveCount(11);

  const links = await ctas.evaluateAll((els) =>
    els.map((a) => ({
      href: a.href,
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel'),
      name: a.textContent.replace(/\s+/g, ' ').trim(),
    })),
  );

  const messages = new Set();
  for (const l of links) {
    const url = new URL(l.href);
    expect(url.origin + url.pathname).toBe('https://wa.me/94716033886');
    expect(l.target).toBe('_blank');
    // Without noopener the opened tab can navigate this one away.
    expect(l.rel).toContain('noopener');

    const text = url.searchParams.get('text');
    expect(text, `no prefilled message on ${l.href}`).toBeTruthy();
    messages.add(text);

    // Eleven links reading only "Ask about this one" would be useless to a
    // screen reader, so each must carry its package name.
    expect(l.name).toMatch(/Ask about this one — .+/);
  }

  // Every package must produce its own distinct message.
  expect(messages.size).toBe(11);
});

test('FR-04: the lightbox opens, advances, and closes on Escape', async ({ page }) => {
  await page.goto('/portfolio/weddings/');
  const dialog = page.locator('#lightbox');
  await expect(dialog).toBeHidden();

  await page.locator('.gallery__item').first().click();
  await expect(dialog).toBeVisible();
  await expect(page.locator('.lightbox__count')).toHaveText('1 / 6');

  await page.locator('.lightbox__nav--next').click();
  await expect(page.locator('.lightbox__count')).toHaveText('2 / 6');

  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.lightbox__count')).toHaveText('1 / 6');

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
