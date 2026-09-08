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
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});

test('the mobile drawer behaves as a modal and cleans up after itself', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Menu', exact: true });
  const drawer = page.locator('#nav-drawer');

  await toggle.click();
  await expect(drawer).toBeVisible();

  // showModal() makes the rest of the page inert; hand-rolled drawers leave it
  // tabbable, which strands keyboard users behind the overlay.
  const trapped = await page.evaluate(() => {
    const d = document.querySelector('#nav-drawer');
    const behind = [...document.querySelectorAll('main a, footer a')].filter((a) => !d.contains(a));
    behind[0]?.focus();
    return { isModal: d.matches(':modal'), focusEscaped: behind[0] === document.activeElement };
  });
  expect(trapped.isModal).toBe(true);
  expect(trapped.focusEscaped).toBe(false);

  // The toggle is outside the dialog and therefore inert while it is open, so
  // the drawer needs its own close control — without one, a touch user with no
  // keyboard can only leave by picking a link.
  const closeBtn = page.getByRole('button', { name: /close menu/i });
  await expect(closeBtn).toBeVisible();
  await closeBtn.click();
  await expect(drawer).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  const after = await page.evaluate(() => ({
    overflow: document.body.style.overflow,
    focusOnToggle: document.activeElement === document.querySelector('.nav__toggle'),
  }));
  expect(after.overflow).toBe('');
  expect(after.focusOnToggle).toBe(true);
});

test('gallery navigation is visible without a hover, and big enough to hit', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'this is about devices that cannot hover');
  await page.goto('/portfolio/weddings/');
  await page.locator('.gallery__item').first().click();
  await expect(page.locator('#lightbox')).toBeVisible();

  for (const dir of ['prev', 'next']) {
    const btn = page.locator(`.lightbox__nav--${dir}`);
    // Hover-to-reveal is invisible on a touch screen, which left the gallery
    // with no apparent way to advance.
    await expect(btn).toHaveCSS('opacity', '1');
    const box = await btn.locator('span').boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

test('WCAG 2.2 target size: navigation links are at least 24px tall', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  // Links inside a sentence are exempt from SC 2.5.8; a list of nav links is not.
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('.footer__list a, .nav__link, .drawer a')]
      .map((a) => ({ t: a.textContent.trim(), h: a.getBoundingClientRect().height }))
      .filter((x) => x.h > 0 && x.h < 24),
  );
  expect(small).toEqual([]);
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
  const toggle = page.getByRole('button', { name: 'Menu', exact: true });
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
