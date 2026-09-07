/**
 * Parsing helpers for an Instagram "Download Your Information" export.
 *
 * Kept separate from the CLI in import-instagram.mjs so the fiddly parts —
 * the caption mojibake, the couple-name grouping — can be unit tested without
 * a 2 GB archive on disk.
 */

/**
 * Instagram writes its JSON exports as UTF-8 bytes that have been re-encoded
 * as if they were Latin-1, so "Ruchith & Sandali 🤍" arrives as
 * "Ruchith & Sandali ð¤". This is a long-standing, well-known bug in the
 * export, not something we are doing wrong. Undo it, but only when the result
 * is actually valid — otherwise leave the string alone.
 */
export function fixMojibake(s) {
  if (typeof s !== 'string' || s === '') return '';
  if (!/[ÃÂâðŸ¤í]/.test(s)) return s;
  const decoded = Buffer.from(s, 'latin1').toString('utf8');
  return decoded.includes('�') ? s : decoded;
}

/** Strip hashtags, @mentions, emoji and trailing punctuation from a caption. */
export function cleanCaption(raw) {
  return fixMojibake(raw)
    .split('\n')[0]
    .replace(/#[\p{L}\p{N}_]+/gu, '')
    .replace(/@[\p{L}\p{N}._]+/gu, '')
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}️‍]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[\s|·\-–—,.]+|[\s|·\-–—,.]+$/g, '');
}

/**
 * Pull a couple's names out of a caption.
 *
 * Harith's captions look like "Ruchith&Sandali", "Senuri|Themiya",
 * "AnjaleeNivishka" and "Sonali & Nipuna" — a separator, sometimes missing,
 * between two given names. Returns null when it does not look like a couple,
 * so those posts can be reported rather than silently mis-grouped.
 */
export function parseCouple(caption) {
  const text = cleanCaption(caption);
  if (!text || text.length > 60) return null;

  const sep = text.split(/\s*(?:&|\+|\||\bx\b|\band\b|·)\s*/i).filter(Boolean);
  if (sep.length === 2 && sep.every((n) => /^[\p{L}][\p{L}'’-]{1,20}$/u.test(n.trim()))) {
    return sep.map((n) => titleCase(n.trim()));
  }

  // "AnjaleeNivishka" — two capitalised names run together with no separator.
  const run = text.match(/^([A-Z][a-z’'-]{2,15})([A-Z][a-z’'-]{2,15})$/);
  if (run) return [titleCase(run[1]), titleCase(run[2])];

  return null;
}

const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Normalise one export's posts JSON into a flat list of posts.
 * Handles the bare-array shape and the {"photos": [...]} wrapper, and both the
 * post-level and per-media caption fields.
 */
export function normalisePosts(raw) {
  const list = Array.isArray(raw)
    ? raw
    : (Object.values(raw ?? {}).find((v) => Array.isArray(v)) ?? []);

  return list
    .map((post) => {
      const media = (post.media ?? []).filter((m) => typeof m?.uri === 'string');
      if (media.length === 0) return null;
      const caption = post.title || media.find((m) => m.title)?.title || '';
      const ts = post.creation_timestamp ?? media[0].creation_timestamp ?? 0;
      return {
        caption: fixMojibake(caption),
        timestamp: ts,
        date: ts ? new Date(ts * 1000).toISOString().slice(0, 10) : null,
        media: media.map((m) => ({
          uri: m.uri,
          isVideo: /\.(mp4|mov|webm)$/i.test(m.uri),
          timestamp: m.creation_timestamp ?? ts,
        })),
      };
    })
    .filter(Boolean);
}

/**
 * Group posts into candidate weddings by the couple named in the caption.
 * Posts whose caption is not a couple are returned separately rather than
 * being forced into a group.
 */
export function groupByCouple(posts, { minPhotos = 3 } = {}) {
  const groups = new Map();
  const ungrouped = [];

  for (const post of posts) {
    const couple = parseCouple(post.caption);
    const photos = post.media.filter((m) => !m.isVideo);
    if (!couple || photos.length === 0) {
      ungrouped.push(post);
      continue;
    }
    const key = couple
      .map((n) => n.toLowerCase())
      .sort()
      .join('-');
    if (!groups.has(key)) {
      groups.set(key, { couple: couple.join(' & '), slug: slugify(couple.join('-')), posts: [] });
    }
    groups.get(key).posts.push({ ...post, media: photos });
  }

  const grouped = [...groups.values()]
    .map((g) => {
      const media = g.posts.flatMap((p) => p.media).sort((a, b) => a.timestamp - b.timestamp);
      const dates = g.posts
        .map((p) => p.date)
        .filter(Boolean)
        .sort();
      return { ...g, media, photoCount: media.length, firstPosted: dates[0] ?? null };
    })
    .sort((a, b) => b.photoCount - a.photoCount);

  return {
    weddings: grouped.filter((g) => g.photoCount >= minPhotos),
    tooFew: grouped.filter((g) => g.photoCount < minPhotos),
    ungrouped,
  };
}
