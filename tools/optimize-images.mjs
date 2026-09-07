#!/usr/bin/env node
/**
 * Build-time responsive image pipeline (ADR-0004).
 *
 * For every original in photos/raw/, emits AVIF + WebP + JPEG derivatives at a
 * ladder of widths, plus a tiny inline LQIP used as a blur-up placeholder, and
 * records intrinsic dimensions in a manifest so templates can stamp
 * width/height on every <img> and hold CLS at ~0 (NFR-02).
 *
 * Derivatives are keyed by a hash of (source bytes + encode settings), so an
 * unchanged photo is never re-encoded. Cold build ≈ 90 s; warm build ≈ 0 s.
 */
import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'photos', 'raw');
const OUT = join(ROOT, 'dist', 'assets', 'img');
const MANIFEST = join(ROOT, '.cache', 'images.json');

export const WIDTHS = [400, 800, 1200, 1600, 2000];
// sharp defaults AVIF to 4:4:4 chroma, which roughly doubles the file size for
// photographic content at no perceptible quality gain. 4:2:0 is the right call
// for photographs; it is the same subsampling JPEG has used for thirty years.
const FORMATS = {
  avif: { ext: 'avif', opts: { quality: 45, effort: 5, chromaSubsampling: '4:2:0' } },
  webp: { ext: 'webp', opts: { quality: 70, effort: 5, smartSubsample: true } },
  jpeg: {
    ext: 'jpg',
    opts: { quality: 76, progressive: true, mozjpeg: true, chromaSubsampling: '4:2:0' },
  },
};
const SETTINGS_HASH = createHash('sha1')
  .update(JSON.stringify({ WIDTHS, FORMATS }))
  .digest('hex')
  .slice(0, 8);

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

async function loadCache() {
  try {
    return JSON.parse(await readFile(MANIFEST, 'utf8'));
  } catch {
    return {};
  }
}

/** Encode one source image into every format × width. Returns a manifest entry. */
async function processOne(file, cache) {
  const slug = basename(file, extname(file));
  const buf = await readFile(join(RAW, file));
  const hash = createHash('sha1').update(buf).update(SETTINGS_HASH).digest('hex').slice(0, 10);

  const cached = cache[slug];
  if (cached?.hash === hash) {
    // Trust the cache only if the files are actually still on disk.
    const sample = cached.sources.jpeg?.at(-1)?.file;
    if (sample && (await exists(join(OUT, sample)))) return { entry: cached, reused: true };
  }

  const image = sharp(buf, { failOn: 'error' });
  const meta = await image.metadata();
  const widths = WIDTHS.filter((w) => w <= meta.width).concat(
    WIDTHS.every((w) => w > meta.width) ? [meta.width] : [],
  );

  const sources = {};
  for (const [fmt, { ext, opts }] of Object.entries(FORMATS)) {
    sources[fmt] = [];
    for (const w of widths) {
      const name = `${slug}-${w}.${hash}.${ext}`;
      const dest = join(OUT, name);
      if (!(await exists(dest))) {
        await sharp(buf)
          .resize({ width: w, withoutEnlargement: true })
          .toFormat(fmt, opts)
          .toFile(dest);
      }
      sources[fmt].push({ w, file: name });
    }
  }

  // 20 px blurred placeholder, inlined as a data URI — no extra request.
  const lqipBuf = await sharp(buf).resize({ width: 20 }).blur(1.2).jpeg({ quality: 40 }).toBuffer();

  const entry = {
    slug,
    hash,
    width: meta.width,
    height: meta.height,
    aspect: +(meta.width / meta.height).toFixed(4),
    orientation: meta.width >= meta.height ? 'landscape' : 'portrait',
    lqip: `data:image/jpeg;base64,${lqipBuf.toString('base64')}`,
    sources,
  };
  return { entry, reused: false };
}

export async function optimizeAll({ quiet = false } = {}) {
  await mkdir(OUT, { recursive: true });
  await mkdir(dirname(MANIFEST), { recursive: true });

  const cache = await loadCache();
  const files = (await readdir(RAW)).filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f)).sort();

  const manifest = {};
  let built = 0;
  let reusedCount = 0;

  // Modest concurrency: sharp is already multithreaded internally.
  const CONCURRENCY = 4;
  let cursor = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < files.length) {
        const f = files[cursor++];
        const { entry, reused } = await processOne(f, cache);
        manifest[entry.slug] = entry;
        if (reused) reusedCount++;
        else built++;
      }
    }),
  );

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest));

  if (!quiet) {
    console.log(`  images: ${files.length} sources — ${built} encoded, ${reusedCount} from cache`);
  }
  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = Date.now();
  const m = await optimizeAll();
  console.log(`Done in ${((Date.now() - t) / 1000).toFixed(1)}s — ${Object.keys(m).length} images`);
}
