import { test, expect } from '@playwright/test';

/* The 2026 restyle: layered hero, marquee, testimonial slider, dark band. */

test('the testimonial slider advances, and the counter follows', async ({ page }) => {
  await page.goto('/');
  const count = page.locator('.slider-nav__count');
  const total = await page.locator('#quotes .quote').count();
  await expect(count).toHaveText(`01 / 0${total}`);
  await page.locator('.slider-nav__btn[aria-label="Next quote"]').click();
  await expect(count).toHaveText(`02 / 0${total}`);
  await expect(page.locator('.slider-nav__dot').nth(1)).toHaveAttribute('aria-current', 'true');
  // Wraps backwards from the first quote to the last.
  await page.locator('.slider-nav__dot').first().click();
  await expect(count).toHaveText(`01 / 0${total}`);
  await page.locator('.slider-nav__btn[aria-label="Previous quote"]').click();
  await expect(count).toHaveText(`0${total} / 0${total}`);
});

test('without script the quotes are a plain scrollable row', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.slider-nav')).toHaveCount(0);
  const overflow = await page.locator('#quotes').evaluate((el) => getComputedStyle(el).overflowX);
  expect(overflow).toBe('auto');
  await context.close();
});

test('the marquee is hidden from assistive tech and lists real package groups', async ({
  page,
}) => {
  await page.goto('/');
  const marquee = page.locator('.marquee');
  await expect(marquee).toHaveAttribute('aria-hidden', 'true');
  await expect(marquee).toContainText('Weddings');
  await expect(marquee).toContainText('Engagements');
});

test('the marquee stands still for reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const name = await page
    .locator('.marquee__track')
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(name).toBe('none');
  await context.close();
});

test('the hero layers sit inside the hero frame, never past the gutter', async ({ page }) => {
  await page.goto('/');
  const vw = page.viewportSize().width;
  for (const sel of ['.hero__layer--a', '.hero__layer--b']) {
    const box = await page.locator(sel).boundingBox();
    expect(box.x).toBeGreaterThan(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vw);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vw);
});

test('the closing band is dark in both themes', async ({ browser }) => {
  for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({ colorScheme });
    const page = await context.newPage();
    await page.goto('/about/');
    const bg = await page
      .locator('.cta-band')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const [r, g, b] = bg.match(/\d+/g).map(Number);
    expect(r + g + b, `${colorScheme}: ${bg}`).toBeLessThan(90);
    await context.close();
  }
});
