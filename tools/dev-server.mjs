#!/usr/bin/env node
/**
 * Local preview server for dist/.
 *
 * Mirrors GitHub Pages' behaviour closely enough to be useful: directory
 * indexes, a real 404 page, and correct MIME types (an AVIF served as
 * application/octet-stream silently disables the whole image pipeline).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4321;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const isFile = (p) =>
  stat(p).then(
    (s) => s.isFile(),
    () => false,
  );

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  // normalize() collapses any ../ before it can escape dist/.
  let path = join(DIST, normalize(decodeURIComponent(url.pathname)));
  if (!path.startsWith(DIST)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  if (!(await isFile(path))) path = join(path, 'index.html');

  if (await isFile(path)) {
    const body = await readFile(path);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
    return;
  }

  const notFound = join(DIST, '404.html');
  const body = (await isFile(notFound)) ? await readFile(notFound) : 'Not found';
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end(body);
}).listen(PORT, () => {
  console.log(`Preview → http://localhost:${PORT}`);
});
