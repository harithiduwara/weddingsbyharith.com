/**
 * SINGLE SOURCE OF TRUTH for everything business-variable (FR-11).
 *
 * Values wrapped in TODO() are placeholders. The build refuses to produce a
 * production bundle while any remain, and non-production builds render a
 * visible preview ribbon. Replace them, then run `npm run build -- --production`.
 */
export const TODO = (hint) => `‹TODO: ${hint}›`;
export const isTodo = (v) => typeof v === 'string' && v.startsWith('‹TODO:');

export default {
  // ── Identity ───────────────────────────────────────────────────────────
  name: 'Weddings by Harith',
  shortName: 'WBH',
  legalName: TODO('registered business name'),
  domain: 'weddingsbyharith.com',
  url: 'https://weddingsbyharith.com',
  locale: 'en_GB',
  lang: 'en',

  tagline: 'Wedding photography, quietly observed.',
  description:
    'Documentary wedding photography for couples who would rather be in their ' +
    'wedding than posed through it. Full-day coverage, unhurried and honest.',

  // ── Contact ────────────────────────────────────────────────────────────
  contact: {
    email: TODO('enquiries@weddingsbyharith.com'),
    phone: TODO('+44 20 0000 0000'),
    phoneHref: TODO('+442000000000'),
    baseCity: TODO('London'),
    baseRegion: TODO('England'),
    baseCountry: TODO('GB'),
    serviceArea: TODO('the UK, Sri Lanka and anywhere a plane goes'),
    responseTime: 'within two working days',
  },

  social: {
    instagram: TODO('https://instagram.com/your-handle'),
    pinterest: null,
    vimeo: null,
  },

  // ── Enquiry form (ADR-0003) ────────────────────────────────────────────
  // Leave as TODO and the build renders a mailto: block instead of a form,
  // so the enquiry path is never silently broken.
  forms: {
    endpoint: TODO('https://formspree.io/f/xxxxxxxx'),
    provider: 'Formspree',
    privacyUrl: 'https://formspree.io/legal/privacy-policy',
  },

  // ── SEO ────────────────────────────────────────────────────────────────
  seo: {
    titleTemplate: '%s · Weddings by Harith',
    defaultImage: 'barn-04',
    twitterCard: 'summary_large_image',
  },

  // ── Navigation ─────────────────────────────────────────────────────────
  nav: [
    { label: 'Portfolio', href: '/portfolio/' },
    { label: 'About', href: '/about/' },
    { label: 'Investment', href: '/investment/' },
    { label: 'Journal', href: '/journal/' },
    { label: 'FAQ', href: '/faq/' },
  ],

  cta: { label: 'Check your date', href: '/contact/' },

  founded: '2016',
};
