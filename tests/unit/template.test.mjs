/**
 * Unit tests for the bespoke template engine.
 *
 * ADR-0005 accepts the risk of owning a template engine on the condition that
 * it is thoroughly tested. This is that test suite. The escaping and nesting
 * cases matter most: the first is a security boundary, the second is where the
 * engine actually had a bug during development.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { renderTemplate as r, escapeHtml } from '../../tools/template.mjs';

describe('interpolation', () => {
  test('replaces a simple value', () => {
    assert.equal(r('Hello {{name}}', { name: 'Harith' }), 'Hello Harith');
  });

  test('resolves dotted paths', () => {
    assert.equal(r('{{a.b.c}}', { a: { b: { c: 'deep' } } }), 'deep');
  });

  test('renders missing keys as empty, not "undefined"', () => {
    assert.equal(r('[{{nope}}]', {}), '[]');
    assert.equal(r('[{{a.b.c}}]', { a: {} }), '[]');
  });

  test('renders 0 and false rather than swallowing them', () => {
    assert.equal(r('{{n}}/{{b}}', { n: 0, b: false }), '0/false');
  });
});

describe('escaping (security boundary)', () => {
  test('escapes HTML by default', () => {
    assert.equal(
      r('{{v}}', { v: '<script>alert(1)</script>' }),
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  test('escapes quotes so attribute injection is impossible', () => {
    assert.equal(
      r('<a title="{{v}}">', { v: '" onmouseover="evil()' }),
      '<a title="&quot; onmouseover=&quot;evil()">',
    );
  });

  test('escapes ampersands and apostrophes', () => {
    assert.equal(escapeHtml(`Tom & Jerry's`), 'Tom &amp; Jerry&#39;s');
  });

  test('triple braces opt out of escaping', () => {
    assert.equal(r('{{{v}}}', { v: '<em>ok</em>' }), '<em>ok</em>');
  });

  test('content authors cannot inject markup through data', () => {
    // A testimonial with a stray angle bracket must stay text.
    const out = r('<p>{{quote}}</p>', { quote: 'We paid < £3000 and it was worth it' });
    assert.ok(!out.includes('<£'), 'raw < leaked into markup');
    assert.ok(out.includes('&lt;'), 'expected an escaped entity');
  });
});

describe('conditionals', () => {
  test('if / else', () => {
    assert.equal(r('{{#if x}}Y{{else}}N{{/if}}', { x: true }), 'Y');
    assert.equal(r('{{#if x}}Y{{else}}N{{/if}}', { x: false }), 'N');
  });

  test('an empty array is falsy', () => {
    assert.equal(r('{{#if xs}}Y{{else}}N{{/if}}', { xs: [] }), 'N');
    assert.equal(r('{{#if xs}}Y{{else}}N{{/if}}', { xs: [1] }), 'Y');
  });

  test('unless inverts', () => {
    assert.equal(r('{{#unless x}}N{{/unless}}', { x: false }), 'N');
    assert.equal(r('{{#unless x}}N{{/unless}}', { x: true }), '');
  });

  test('an {{else}} after a nested {{/if}} belongs to the OUTER block', () => {
    // This is the regression that broke the investment page during development:
    // the else was being attached to the inner if, silently mis-nesting.
    const t = '{{#if p}}A{{#if q}}B{{/if}}{{else}}C{{/if}}';
    assert.equal(r(t, { p: true, q: true }), 'AB');
    assert.equal(r(t, { p: true, q: false }), 'A');
    assert.equal(r(t, { p: false, q: true }), 'C');
  });
});

describe('iteration', () => {
  test('each with this', () => {
    assert.equal(r('{{#each xs}}[{{this}}]{{/each}}', { xs: ['a', 'b'] }), '[a][b]');
  });

  test('index helpers', () => {
    assert.equal(
      r('{{#each xs}}{{@number}}{{#unless @last}},{{/unless}}{{/each}}', { xs: [9, 9, 9] }),
      '1,2,3',
    );
    assert.equal(r('{{#each xs}}{{#if @first}}F{{/if}}{{/each}}', { xs: [1, 2] }), 'F');
  });

  test('../ reaches the parent scope', () => {
    assert.equal(
      r('{{#each xs}}{{../t}}{{n}}{{/each}}', { t: 'T', xs: [{ n: 1 }, { n: 2 }] }),
      'T1T2',
    );
  });

  test('@root reaches the top level from any depth', () => {
    assert.equal(
      r('{{#each xs}}{{#each this.ys}}{{@root.tag}}{{this}}{{/each}}{{/each}}', {
        tag: 'R',
        xs: [{ ys: [1, 2] }],
      }),
      'R1R2',
    );
  });

  test('outer scope is visible inside each without ../', () => {
    assert.equal(r('{{#each xs}}{{sym}}{{n}}{{/each}}', { sym: '£', xs: [{ n: 5 }] }), '£5');
  });

  test('each over an empty or missing list falls back to else', () => {
    assert.equal(r('{{#each xs}}x{{else}}none{{/each}}', { xs: [] }), 'none');
    assert.equal(r('{{#each xs}}x{{else}}none{{/each}}', {}), 'none');
  });
});

describe('partials', () => {
  test('includes and shares the current scope', () => {
    assert.equal(r('{{> p }}', { t: 'X' }, { p: '<h1>{{t}}</h1>' }), '<h1>X</h1>');
  });

  test('partials nest', () => {
    assert.equal(r('{{> a }}', { v: 'v' }, { a: '[{{> b }}]', b: '{{v}}' }), '[v]');
  });

  test('an unknown partial is a build error, not a silent blank', () => {
    assert.throws(() => r('{{> missing }}', {}), /unknown partial/);
  });
});

describe('malformed templates fail loudly', () => {
  test('unclosed block', () => {
    assert.throws(() => r('{{#each xs}}x', { xs: [] }), /unclosed/);
  });
  test('mismatched closer', () => {
    assert.throws(() => r('{{#if a}}x{{/each}}', {}), /does not match/);
  });
  test('unknown helper', () => {
    assert.throws(() => r('{{#wat a}}x{{/wat}}', {}), /unknown block helper/);
  });
  test('stray else', () => {
    assert.throws(() => r('{{else}}', {}), /outside of a block/);
  });
  test('two elses in one block', () => {
    assert.throws(() => r('{{#if a}}1{{else}}2{{else}}3{{/if}}', {}), /more than one/);
  });
});

describe('comments', () => {
  test('are stripped', () => {
    assert.equal(r('a{{! ignore me }}b', {}), 'ab');
  });
});
