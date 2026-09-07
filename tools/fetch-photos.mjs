#!/usr/bin/env node
/**
 * Downloads placeholder photography into photos/raw/.
 *
 * Idempotent: files that already exist are skipped, so re-running is cheap and
 * a photographer's real photos are never overwritten by placeholders.
 */
import { mkdir, writeFile, access, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHOTOS } from './photos.manifest.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'photos', 'raw');
const WIDTH = 1800;
const CONCURRENCY = 6;

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

async function fetchOne([slug, id]) {
  const dest = join(RAW, `${slug}.jpg`);
  if (await exists(dest)) return { slug, skipped: true };

  const url = `https://images.unsplash.com/${id}?w=${WIDTH}&q=80&fm=jpg&fit=max`;
  const res = await fetch(url, { headers: { 'User-Agent': 'weddingsbyharith-build' } });
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status} for ${id}`);

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10_000) throw new Error(`${slug}: suspiciously small (${buf.length} B)`);
  await writeFile(dest, buf);
  return { slug, bytes: buf.length };
}

async function pool(items, limit, fn) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      try {
        results.push(await fn(items[i]));
      } catch (err) {
        results.push({ slug: items[i][0], error: err.message });
      }
    }
  });
  await Promise.all(workers);
  return results;
}

await mkdir(RAW, { recursive: true });
console.log(`Fetching ${PHOTOS.length} placeholder photographs → photos/raw/`);

const results = await pool(PHOTOS, CONCURRENCY, fetchOne);
const failed = results.filter((r) => r.error);
const fetched = results.filter((r) => r.bytes);
const skipped = results.filter((r) => r.skipped);

const files = await readdir(RAW);
let total = 0;
for (const f of files) total += (await stat(join(RAW, f))).size;

console.log(
  `  downloaded ${fetched.length}, already present ${skipped.length}, failed ${failed.length}`,
);
console.log(`  photos/raw is now ${(total / 1e6).toFixed(1)} MB across ${files.length} files`);

if (failed.length) {
  console.error('\nFailures (these slugs will be missing from galleries):');
  for (const f of failed) console.error(`  ${f.slug}: ${f.error}`);
  process.exitCode = 1;
}
