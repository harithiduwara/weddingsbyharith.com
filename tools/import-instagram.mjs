#!/usr/bin/env node
/**
 * Turn an Instagram "Download Your Information" export into portfolio galleries.
 *
 *   npm run instagram:import -- ~/Downloads/instagram-weddingsbyharith.zip
 *   npm run instagram:import -- ~/Downloads/instagram-export/ --max 30
 *
 * Copies the photographs into photos/raw/ and writes a *draft* data file at
 * content/collections.generated.mjs. It deliberately does not overwrite
 * content/collections.mjs: the captions decide how weddings get grouped, and
 * that guess needs a human to look at it before it goes on a public site.
 *
 * Nothing is uploaded and nothing is sent anywhere. This reads a local folder.
 */
import { readFile, writeFile, readdir, mkdir, copyFile, stat, rm } from 'node:fs/promises';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

import { normalisePosts, groupByCouple, slugify } from './instagram-export.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'photos', 'raw');
const OUT = join(ROOT, 'content', 'collections.generated.mjs');

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--'));
const maxArg = args.find((a) => a.startsWith('--max='));
const MAX_PER_WEDDING = maxArg ? Number(maxArg.split('=')[1]) : 40;
const MIN_PHOTOS = 3;

if (!target) {
  console.error(
    'Usage: npm run instagram:import -- <path to export .zip or folder> [--max=40]\n' +
      '\nRequest the export from Instagram first:\n' +
      '  Settings → Accounts Centre → Your information and permissions →\n' +
      '  Download your information → choose JSON, and High media quality.\n',
  );
  process.exit(1);
}

const exists = (p) =>
  stat(p).then(
    () => true,
    () => false,
  );

/** "2023-11-14" → "November 2023". The post date is the only date an export
 *  gives us; it is close to the wedding date but is not the same thing, so it
 *  is presented as a month rather than implying a precise wedding day. */
const monthOf = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : null;

/** Recursively find files matching a predicate, skipping nothing clever. */
async function find(dir, match, out = [], depth = 0) {
  if (depth > 8) return out;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await find(p, match, out, depth + 1);
    else if (match(e.name)) out.push(p);
  }
  return out;
}

/* ── Locate the export ────────────────────────────────────────────────── */

let root = target;
let temp = null;

if (target.endsWith('.zip')) {
  if (!(await exists(target))) {
    console.error(`✗ No such file: ${target}`);
    process.exit(1);
  }
  temp = join(tmpdir(), `ig-export-${Date.now()}`);
  await mkdir(temp, { recursive: true });
  console.log('▸ Unzipping the export…');
  execFileSync('unzip', ['-q', target, '-d', temp]);
  root = temp;
} else if (!(await exists(root))) {
  console.error(`✗ No such folder: ${root}`);
  process.exit(1);
}

try {
  const postFiles = await find(root, (n) => /^posts_\d+\.json$/i.test(n));
  if (postFiles.length === 0) {
    console.error(
      '✗ No posts_*.json found in that export.\n' +
        '  The most likely cause is that HTML was chosen instead of JSON when\n' +
        '  requesting the download. Re-request it and pick JSON.',
    );
    process.exit(1);
  }
  console.log(`▸ Found ${postFiles.length} posts file(s)`);

  let posts = [];
  for (const f of postFiles) {
    posts = posts.concat(normalisePosts(JSON.parse(await readFile(f, 'utf8'))));
  }
  console.log(`  ${posts.length} posts`);

  const { weddings, tooFew, ungrouped } = groupByCouple(posts, { minPhotos: MIN_PHOTOS });

  /* ── Copy the photographs in ───────────────────────────────────────── */

  await mkdir(RAW, { recursive: true });
  const collections = [];
  let copied = 0;
  let missing = 0;

  for (const w of weddings) {
    const media = w.media.slice(0, MAX_PER_WEDDING);
    const images = [];

    for (const [i, m] of media.entries()) {
      const src = join(root, m.uri);
      if (!(await exists(src))) {
        // Some exports nest media under a second folder level.
        const alt = (await find(root, (n) => n === basename(m.uri)))[0];
        if (!alt) {
          missing++;
          continue;
        }
        m.resolved = alt;
      }
      const from = m.resolved ?? src;
      const name = `${w.slug}-${String(images.length + 1).padStart(2, '0')}${extname(from).toLowerCase()}`;
      await copyFile(from, join(RAW, name));
      copied++;
      images.push({
        slug: basename(name, extname(name)),
        alt: `${w.couple} on their wedding day — photograph ${images.length + 1}`,
      });
    }

    if (images.length < MIN_PHOTOS) continue;

    collections.push({
      slug: w.slug,
      title: w.couple,
      couple: w.couple,
      kind: monthOf(w.firstPosted) ?? 'Wedding',
      cover: images[0].slug,
      featured: collections.length < 3,
      excerpt: 'TODO — one or two lines about this wedding.',
      facts: [
        ...(monthOf(w.firstPosted) ? [{ label: 'When', value: monthOf(w.firstPosted) }] : []),
        { label: 'Photographs', value: `${images.length}` },
      ],
      story: ['TODO — a paragraph about the day.', 'TODO — a second paragraph.'],
      images,
    });
  }

  /* ── Write the draft data file ─────────────────────────────────────── */

  const body =
    `/**\n` +
    ` * GENERATED by tools/import-instagram.mjs — a DRAFT, not a finished file.\n` +
    ` *\n` +
    ` * Before using it, replace content/collections.mjs with this and then:\n` +
    ` *   1. Write a real excerpt and story for each wedding.\n` +
    ` *   2. Rewrite the alt text. It is generated and merely truthful; it should\n` +
    ` *      describe what is in the photograph.\n` +
    ` *   3. Pick a better cover than the first photograph if one exists.\n` +
    ` *   4. Confirm each couple is happy to be named and shown.\n` +
    ` */\nexport default ${JSON.stringify(collections, null, 2)};\n`;
  await writeFile(OUT, body);

  /* ── Report ────────────────────────────────────────────────────────── */

  console.log(`\n▸ Imported ${collections.length} weddings, ${copied} photographs`);
  for (const c of collections) {
    console.log(`  ${c.couple.padEnd(28)} ${c.images.length} photos → photos/raw/${c.slug}-*`);
  }
  if (missing) console.log(`  ⚠ ${missing} referenced files were not found in the export`);

  if (tooFew.length) {
    console.log(`\n▸ Skipped — fewer than ${MIN_PHOTOS} photographs:`);
    for (const w of tooFew) console.log(`  ${w.couple.padEnd(28)} ${w.photoCount}`);
  }

  if (ungrouped.length) {
    console.log(`\n▸ Captions that did not read as a couple (${ungrouped.length}):`);
    for (const p of ungrouped.slice(0, 15)) {
      console.log(`  ${(p.caption || '(no caption)').slice(0, 60)}`);
    }
    if (ungrouped.length > 15) console.log(`  …and ${ungrouped.length - 15} more`);
  }

  console.log(
    `\n✓ Draft written to content/collections.generated.mjs` +
      `\n\n  Next: read it, fix the TODOs, then move it over content/collections.mjs` +
      `\n  and run \`npm run build && npm test\`.\n`,
  );
} finally {
  if (temp) await rm(temp, { recursive: true, force: true });
}
