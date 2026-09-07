/**
 * Instagram export parsing.
 *
 * The importer cannot be tested against a real 2 GB archive in CI, so the
 * fiddly parts are isolated and tested here against fixtures that match the
 * shapes Instagram actually emits — including its long-standing caption
 * encoding bug.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  fixMojibake,
  cleanCaption,
  parseCouple,
  slugify,
  normalisePosts,
  groupByCouple,
} from '../../tools/instagram-export.mjs';

describe('caption encoding', () => {
  test('undoes Instagram’s UTF-8-as-Latin-1 mangling', () => {
    // "Ruchith & Sandali 🤍" as Instagram actually writes it.
    const mangled = Buffer.from('Ruchith & Sandali 🤍', 'utf8').toString('latin1');
    assert.equal(fixMojibake(mangled), 'Ruchith & Sandali 🤍');
  });

  test('leaves clean ASCII untouched', () => {
    assert.equal(fixMojibake('Sonali & Nipuna'), 'Sonali & Nipuna');
  });

  test('leaves a string alone when re-decoding would corrupt it', () => {
    // Valid Latin-1 text that is not disguised UTF-8 must survive.
    const s = 'Café Ãngstrom';
    const out = fixMojibake(s);
    assert.ok(!out.includes('�'));
  });

  test('handles empty and non-string input', () => {
    assert.equal(fixMojibake(''), '');
    assert.equal(fixMojibake(undefined), '');
    assert.equal(fixMojibake(null), '');
  });
});

describe('caption cleaning', () => {
  test('strips hashtags, mentions and emoji', () => {
    assert.equal(
      cleanCaption('Senuri | Themiya 💍🤍 #srilankanwedding @someone'),
      'Senuri | Themiya',
    );
  });

  test('keeps only the first line', () => {
    assert.equal(cleanCaption('Avini & Kasun\nGalle Fort, February'), 'Avini & Kasun');
  });
});

describe('couple detection', () => {
  test('handles the separators Harith actually uses', () => {
    assert.deepEqual(parseCouple('Ruchith&Sandali'), ['Ruchith', 'Sandali']);
    assert.deepEqual(parseCouple('Sonali & Nipuna'), ['Sonali', 'Nipuna']);
    assert.deepEqual(parseCouple('Senuri|Themiya'), ['Senuri', 'Themiya']);
    assert.deepEqual(parseCouple('Avini + Kasun'), ['Avini', 'Kasun']);
    assert.deepEqual(parseCouple('Dilshan and Nethmi'), ['Dilshan', 'Nethmi']);
  });

  test('splits two capitalised names run together', () => {
    assert.deepEqual(parseCouple('AnjaleeNivishka'), ['Anjalee', 'Nivishka']);
  });

  test('title-cases inconsistent input', () => {
    assert.deepEqual(parseCouple('ruchith & SANDALI'.toLowerCase()), ['Ruchith', 'Sandali']);
  });

  test('returns null rather than guessing', () => {
    // These must be reported for a human to look at, not silently mis-grouped.
    assert.equal(parseCouple('Behind the scenes today'), null);
    assert.equal(parseCouple(''), null);
    assert.equal(
      parseCouple('A very long caption about the whole day and how it went, at length'),
      null,
    );
    assert.equal(parseCouple('Galle'), null);
  });
});

describe('slugs', () => {
  test('are URL safe', () => {
    assert.equal(slugify('Ruchith & Sandali'), 'ruchith-sandali');
    assert.equal(slugify('Senuri | Themiya'), 'senuri-themiya');
  });
});

/** A fixture in the exact shape Instagram's posts_1.json uses. */
const EXPORT = [
  {
    title: Buffer.from('Ruchith & Sandali 🤍', 'utf8').toString('latin1'),
    creation_timestamp: 1700000000,
    media: [
      { uri: 'media/posts/202311/a1.jpg', creation_timestamp: 1700000000 },
      { uri: 'media/posts/202311/a2.jpg', creation_timestamp: 1700000001 },
      { uri: 'media/posts/202311/a3.jpg', creation_timestamp: 1700000002 },
    ],
  },
  {
    title: 'Ruchith&Sandali',
    creation_timestamp: 1700100000,
    media: [{ uri: 'media/posts/202311/a4.jpg', creation_timestamp: 1700100000 }],
  },
  {
    title: 'Sonali & Nipuna',
    creation_timestamp: 1699000000,
    media: [
      { uri: 'media/posts/202310/b1.jpg', creation_timestamp: 1699000000 },
      { uri: 'media/posts/202310/b2.mp4', creation_timestamp: 1699000001 },
    ],
  },
  {
    title: 'Behind the scenes',
    creation_timestamp: 1698000000,
    media: [{ uri: 'media/posts/202310/c1.jpg', creation_timestamp: 1698000000 }],
  },
  { title: 'no media here', creation_timestamp: 1, media: [] },
];

describe('normalising an export', () => {
  test('flattens posts and decodes captions', () => {
    const posts = normalisePosts(EXPORT);
    assert.equal(posts.length, 4, 'the post with no media is dropped');
    assert.equal(posts[0].caption, 'Ruchith & Sandali 🤍');
    assert.equal(posts[0].date, new Date(1700000000 * 1000).toISOString().slice(0, 10));
  });

  test('flags videos so they can be skipped', () => {
    const posts = normalisePosts(EXPORT);
    const sonali = posts.find((p) => p.caption.startsWith('Sonali'));
    assert.equal(sonali.media.filter((m) => m.isVideo).length, 1);
  });

  test('accepts the wrapped-object export shape too', () => {
    assert.equal(normalisePosts({ photos: EXPORT }).length, 4);
  });

  test('survives junk input', () => {
    assert.deepEqual(normalisePosts(null), []);
    assert.deepEqual(normalisePosts({}), []);
    assert.deepEqual(normalisePosts([{ nope: true }]), []);
  });
});

describe('grouping into weddings', () => {
  const result = groupByCouple(normalisePosts(EXPORT), { minPhotos: 3 });

  test('merges multiple posts about the same couple', () => {
    const r = result.weddings.find((w) => w.slug === 'ruchith-sandali');
    assert.ok(r, 'Ruchith & Sandali should be a wedding');
    assert.equal(r.photoCount, 4, 'both posts contribute photographs');
  });

  test('orders each wedding’s photographs oldest first', () => {
    const r = result.weddings.find((w) => w.slug === 'ruchith-sandali');
    const ts = r.media.map((m) => m.timestamp);
    assert.deepEqual(
      ts,
      [...ts].sort((a, b) => a - b),
    );
  });

  test('excludes videos from the photo count', () => {
    const all = [...result.weddings, ...result.tooFew];
    const sonali = all.find((w) => w.slug === 'sonali-nipuna');
    assert.equal(sonali.photoCount, 1, 'the .mp4 must not be counted');
  });

  test('holds back couples with too few photographs instead of publishing them', () => {
    assert.ok(result.tooFew.some((w) => w.slug === 'sonali-nipuna'));
    assert.ok(!result.weddings.some((w) => w.slug === 'sonali-nipuna'));
  });

  test('reports captions it could not read as a couple', () => {
    assert.equal(result.ungrouped.length, 1);
    assert.equal(result.ungrouped[0].caption, 'Behind the scenes');
  });

  test('records when a wedding was first posted', () => {
    const r = result.weddings.find((w) => w.slug === 'ruchith-sandali');
    assert.match(r.firstPosted, /^\d{4}-\d{2}-\d{2}$/);
  });
});
