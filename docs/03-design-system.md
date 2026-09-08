# Phase 3 — Design system

## 1. Design intent

A wedding photography site has one job: get out of the way of the photographs.
Every decision below follows from that.

- **The photographs supply all the colour.** The interface is warm neutrals only.
  A cool grey UI fights skin tones; a coloured UI competes with the work.
- **Typography carries the personality**, because nothing else is allowed to.
- **Motion is restrained.** Nothing bounces at a wedding.
- **Generous space.** Crowding photographs makes them look like stock.

## 2. Colour

Tokens live in [`src/styles/tokens.css`](../src/styles/tokens.css). No component
may hard-code a colour value.

| Token            | Light     | Dark      | Role                      |
| ---------------- | --------- | --------- | ------------------------- |
| `--paper`        | `#faf7f2` | `#141210` | Page ground               |
| `--paper-sunk`   | `#f2ece3` | `#0e0c0b` | Alternating section bands |
| `--paper-raised` | `#ffffff` | `#1d1a17` | Cards, form fields        |
| `--ink`          | `#1a1714` | `#f2ece4` | Headings, body            |
| `--ink-soft`     | `#4e4842` | `#b3aaa0` | Secondary prose           |
| `--ink-faint`    | `#6f675e` | `#8f877e` | Metadata, eyebrows        |
| `--clay`         | `#8f5b39` | `#d09a72` | The single accent         |
| `--clay-deep`    | `#74482c` | `#e0b493` | Accent hover              |

### Contrast is a constraint, not an aspiration

Three of these values were **changed during development because the automated
audit failed them**, and they are worth recording so nobody "tidies" them back:

- `--ink-faint` was `#8b8279`. That is **3.21:1** on `--paper-sunk` — a real
  WCAG AA failure for 13.6 px metadata, not a rounding issue. It is now
  `#6f675e` (4.73:1 on the sunk panel, 5.20:1 on paper). `--ink-soft` was
  darkened alongside it to keep three visibly distinct steps.
- `--clay` was `#96603d`, which measured **4.42:1** on `--paper-sunk` — under
  the 4.5:1 threshold by a hair, which is still under it.
- `.tier__flag` reversed white out of `--clay`. That works in light mode and
  fails at **2.45:1** in dark mode, where `--clay` is a light tone. It now uses
  `var(--paper)`, which inverts with the theme.

**The binding constraint is always `--paper-sunk`**, not `--paper`: it is the
darker of the two light grounds, so it produces the lower ratio. Check new
colours against it.

## 3. Typography

Two families, self-hosted (NFR-07), subset to latin + latin-ext, `font-display: swap`.

- **Cormorant Garamond** (300/400/500/600 + italics) — display. A high-contrast
  old-style serif: editorial and quiet rather than decorative-wedding-script.
- **Jost** (300/400/500) — interface and body. A geometric sans whose even
  colour sits underneath the serif without arguing with it.

The scale is fluid, `clamp()`-based, from `--step--1` to `--step-6`, tuned
between a 320 px and 1440 px viewport so there are no breakpoint jumps.

Two conventions do the heavy lifting:

- **`.eyebrow`** — uppercase, letter-spaced, `--ink-faint`. Labels a section
  without needing a second heading level.
- **`.lede`** — one size up, `--ink-soft`, capped at `--measure` (62ch).

### A correction worth keeping

An earlier version of this document claimed Jost's latin subset had no U+00B7
and that literal middots rendered as blank gaps. **That was wrong.** Measured by
rasterising each glyph and counting inked pixels, `·` renders in both Jost and
Cormorant Garamond; a genuinely missing glyph inks the tofu box at roughly
twenty times the coverage. What actually happened was a small, light-grey dot at
13.6px being misread as absent in a downscaled screenshot.

Literal `·` is therefore fine, and is used in the hero eyebrow and the footer.
`.meta-list` separators come from a CSS `::before` carrying a real `·`
character, so the separator stays part of the accessible text.

The wider lesson: verify a rendering claim by measurement, not by looking at a
scaled-down screenshot.

## 4. Space and layout

A 1.5-ratio space scale (`--sp-3xs` … `--sp-3xl`), with the largest step fluid.
Layout primitives are composable rather than page-specific: `.shell`, `.section`,
`.stack`, `.cluster`, `.split`, `.grid-3`.

Line length is capped at `--measure` (62ch) everywhere prose appears.

## 5. The gallery

CSS multi-column (`columns: 1 / 2 / 3`) rather than grid.

Chosen because it preserves every photograph's aspect ratio with no cropping and
no JavaScript, and because column fill order matches DOM order — so the lightbox
index and the visual sequence agree. A CSS grid with orientation-based spans was
tried first and produced ragged whitespace, since grid rows align to the tallest
item.

## 6. Components

Documented in [`src/styles/components.css`](../src/styles/components.css).
Notable behaviours:

- **Header** is transparent over a hero and turns solid once it scrolls past;
  on any page without a hero it is solid from the start, including with
  JavaScript disabled. The CTA button inverts with it — white-on-image over the
  hero, dark-on-paper otherwise.
- **Gallery item** is an `<a>` pointing at the full-size JPEG. The lightbox
  enhances it; without JavaScript the link still shows the photograph.
- **FAQ** is native `<details>`/`<summary>` — keyboard accessible and functional
  with no script.
- **Preview ribbon** is pinned to the _bottom_ of the viewport. It was at the
  top and collided with the fixed header.

## 7. Motion

One easing curve (`--ease`) and three durations. Everything is a fade or a small
translate; nothing scales dramatically or bounces.

`prefers-reduced-motion: reduce` collapses every animation and transition to
0.01 ms. This is safe precisely because **motion is never used to convey
information** — removing all of it loses nothing.

The scroll-reveal effect has two safety properties worth preserving:

1. Content already in the viewport at first paint is shown **immediately and
   never animated** — fading in what the visitor is already looking at delays LCP
   for no benefit.
2. It **fails open**: a 2.5 s timer reveals everything regardless of whether the
   IntersectionObserver ever fired. A reveal effect must never be the reason
   someone cannot read the page.

## 8. Rules for extending this

1. Never hard-code a colour, size, or duration — add a token.
2. Check any new colour pairing against `--paper-sunk` in **both** themes.
3. Any new interactive element must be reachable and operable by keyboard, and
   must show the standard focus ring.
4. If a feature needs JavaScript to be readable, it is the wrong feature.
