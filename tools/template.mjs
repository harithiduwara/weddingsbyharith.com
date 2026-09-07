/**
 * A very small Mustache-flavoured template engine (ADR-0005).
 *
 * Supported syntax
 *   {{ path }}              interpolate, HTML-escaped
 *   {{{ path }}}            interpolate raw (opt-in, explicit)
 *   {{#if path}}…{{else}}…{{/if}}
 *   {{#unless path}}…{{/unless}}
 *   {{#each path}}…{{/each}}   with {{this}}, {{@index}}, {{@first}}, {{@last}}
 *   {{> partialName }}      include a registered partial
 *   {{! comment }}
 *
 * Paths are dot-separated. `this` is the current scope, `@root` the top-level
 * data, and `../` walks up one scope inside an {{#each}}.
 *
 * Escaping is ON by default. That is the whole security argument for writing
 * this rather than string-concatenating HTML: a testimonial containing a `<`
 * cannot become markup unless an author explicitly opts in with triple braces.
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (v) =>
  v === null || v === undefined ? '' : String(v).replace(/[&<>"']/g, (c) => ESCAPES[c]);

/* ── Tokeniser ─────────────────────────────────────────────────────────── */

const TAG = /\{\{(\{)?\s*([#/>!&]?)\s*([^}]*?)\s*(\})?\}\}/g;

function tokenize(src) {
  const tokens = [];
  let last = 0;
  for (const m of src.matchAll(TAG)) {
    if (m.index > last) tokens.push({ t: 'text', v: src.slice(last, m.index) });
    const raw = Boolean(m[1] && m[4]);
    const sigil = m[2];
    const body = m[3].trim();
    last = m.index + m[0].length;

    if (sigil === '!') continue; // comment
    if (sigil === '>') {
      tokens.push({ t: 'partial', v: body });
    } else if (sigil === '#') {
      const [kw, ...rest] = body.split(/\s+/);
      tokens.push({ t: 'open', kw, v: rest.join(' ') });
    } else if (sigil === '/') {
      tokens.push({ t: 'close', kw: body });
    } else if (body === 'else') {
      tokens.push({ t: 'else' });
    } else {
      tokens.push({ t: 'var', v: body, raw: raw || sigil === '&' });
    }
  }
  if (last < src.length) tokens.push({ t: 'text', v: src.slice(last) });
  return tokens;
}

/* ── Parser ────────────────────────────────────────────────────────────── */

function parse(tokens) {
  let i = 0;

  /**
   * Parse until the block closer for `stopKw`, or until an {{else}} at this
   * level. Returns the terminator so the caller can tell the two apart — an
   * {{else}} that follows a *nested* {{/if}} belongs to the outer block, and
   * conflating the two silently mis-nests the template.
   */
  function block(stopKw) {
    const nodes = [];
    while (i < tokens.length) {
      const tk = tokens[i];

      if (tk.t === 'close') {
        if (tk.kw !== stopKw) {
          throw new Error(`Template: {{/${tk.kw}}} does not match {{#${stopKw ?? '(none)'}}}`);
        }
        i += 1;
        return { nodes, terminator: 'close' };
      }

      if (tk.t === 'else') {
        if (!stopKw) throw new Error('Template: {{else}} outside of a block');
        i += 1;
        return { nodes, terminator: 'else' };
      }

      i += 1;

      if (tk.t === 'open') {
        if (!['if', 'unless', 'each'].includes(tk.kw)) {
          throw new Error(`Template: unknown block helper {{#${tk.kw}}}`);
        }
        const first = block(tk.kw);
        let alt = null;
        if (first.terminator === 'else') {
          const second = block(tk.kw);
          if (second.terminator !== 'close') {
            throw new Error(`Template: {{#${tk.kw}}} has more than one {{else}}`);
          }
          alt = second.nodes;
        }
        nodes.push({ t: tk.kw, path: tk.v, body: first.nodes, alt });
      } else {
        nodes.push(tk);
      }
    }

    if (stopKw) throw new Error(`Template: unclosed {{#${stopKw}}}`);
    return { nodes, terminator: 'eof' };
  }

  return block(null).nodes;
}

/* ── Scope resolution ──────────────────────────────────────────────────── */

function resolve(path, scope) {
  if (path === 'this' || path === '.') return scope.data;

  let cur = scope;
  let p = path;

  // `this.foo` and `./foo` address the current scope explicitly, which matters
  // inside {{#each}} when an item property shadows nothing and the outward
  // walk below would otherwise miss it.
  if (p.startsWith('this.')) return dig(cur.data, p.slice(5));
  if (p.startsWith('./')) return dig(cur.data, p.slice(2));
  while (p.startsWith('../')) {
    cur = cur.parent ?? cur;
    p = p.slice(3);
  }
  if (p.startsWith('@root')) {
    let root = cur;
    while (root.parent) root = root.parent;
    return dig(root.data, p.slice(5).replace(/^\./, ''));
  }
  if (p.startsWith('@')) return cur.locals?.[p];

  // Walk outward until a scope actually defines the head of the path.
  const head = p.split('.')[0];
  let s = cur;
  while (s) {
    if (s.data != null && typeof s.data === 'object' && head in s.data) {
      return dig(s.data, p);
    }
    s = s.parent;
  }
  return undefined;
}

function dig(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

const truthy = (v) => (Array.isArray(v) ? v.length > 0 : Boolean(v));

/* ── Renderer ──────────────────────────────────────────────────────────── */

function render(nodes, scope, partials) {
  let out = '';
  for (const n of nodes) {
    switch (n.t) {
      case 'text':
        out += n.v;
        break;
      case 'var': {
        const v = resolve(n.v, scope);
        out += n.raw ? (v ?? '') : escapeHtml(v);
        break;
      }
      case 'if': {
        const v = resolve(n.path, scope);
        out += truthy(v)
          ? render(n.body, scope, partials)
          : n.alt
            ? render(n.alt, scope, partials)
            : '';
        break;
      }
      case 'unless': {
        const v = resolve(n.path, scope);
        out += !truthy(v)
          ? render(n.body, scope, partials)
          : n.alt
            ? render(n.alt, scope, partials)
            : '';
        break;
      }
      case 'each': {
        const list = resolve(n.path, scope);
        if (!Array.isArray(list) || list.length === 0) {
          out += n.alt ? render(n.alt, scope, partials) : '';
          break;
        }
        list.forEach((item, idx) => {
          out += render(
            n.body,
            {
              data: item,
              parent: scope,
              locals: {
                '@index': idx,
                '@number': idx + 1,
                '@first': idx === 0,
                '@last': idx === list.length - 1,
              },
            },
            partials,
          );
        });
        break;
      }
      case 'partial': {
        const src = partials[n.v];
        if (src === undefined) throw new Error(`Template: unknown partial {{> ${n.v} }}`);
        out += render(compile(src), scope, partials);
        break;
      }
      default:
        throw new Error(`Template: unexpected node ${n.t}`);
    }
  }
  return out;
}

/* ── Public API ────────────────────────────────────────────────────────── */

const cache = new Map();

export function compile(src) {
  if (cache.has(src)) return cache.get(src);
  const ast = parse(tokenize(src));
  cache.set(src, ast);
  return ast;
}

export function renderTemplate(src, data, partials = {}) {
  return render(compile(src), { data, parent: null, locals: {} }, partials);
}

export default renderTemplate;
