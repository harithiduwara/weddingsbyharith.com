/**
 * Bring a page to a fully-settled visual state before auditing it.
 *
 * Two problems this solves:
 *
 * 1. Correctness. Scroll-revealed content sits at opacity 0 until it enters
 *    the viewport, and axe skips fully transparent elements — so auditing a
 *    freshly loaded page silently *skips* everything below the fold.
 * 2. Determinism. Sampling mid-fade makes axe compute contrast against a
 *    blended background, which produced an intermittent false failure.
 *
 * Scrolling the whole page and waiting for every reveal to finish fixes both.
 */
export async function settle(page, { timeout = 8000 } = {}) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });

  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('.reveal')].every(
        (el) => parseFloat(getComputedStyle(el).opacity) > 0.99,
      ),
    null,
    { timeout },
  );

  // Let any remaining CSS animation (the image fade-in) reach its end state.
  await page.waitForFunction(
    () => document.getAnimations().every((a) => a.playState !== 'running'),
    null,
    { timeout },
  );
}
