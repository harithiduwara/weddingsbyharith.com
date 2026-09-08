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
  name: 'Harith Iduwara Weddings',
  altName: 'Weddings by Harith',
  shortName: 'HIW',
  legalName: TODO('registered business name, if different'),
  domain: 'weddingsbyharith.com',
  url: 'https://weddingsbyharith.com',
  locale: 'en_LK',
  lang: 'en',

  // Brand mark. Drop the file in src/assets/ and name it here.
  //
  // An SVG is strongly preferred: the build inlines it and the CSS paints it
  // with `currentColor`, so one file works on the ivory header, on a dark
  // photograph, and in dark mode. Harith's supplied mark is cream, which is
  // designed for dark grounds and would be invisible on --paper otherwise.
  //
  // A PNG is rendered as <img> instead and cannot adapt, so it needs to be
  // dark-on-transparent to be legible in the header.
  brand: { logo: null },

  tagline: 'Wedding photography in Sri Lanka.',
  description:
    'Documentary wedding photography across Sri Lanka and wherever else you are ' +
    'getting married. Over a thousand shoots, photographed as they happened.',

  // ── Contact ────────────────────────────────────────────────────────────
  contact: {
    email: 'weddingsbyharith@gmail.com',
    // Non-breaking spaces: a phone number must never wrap mid-digit.
    phone: '071\u00A0603\u00A03886',
    phoneIntl: '+94\u00A071\u00A0603\u00A03886',
    phoneHref: '+94716033886',
    whatsapp: '94716033886', // wa.me format, no plus
    baseCity: TODO('the city you are based in, e.g. Colombo'),
    baseRegion: 'Sri Lanka',
    baseCountry: 'LK',
    serviceArea: 'all of Sri Lanka, and abroad on request',
    responseTime: 'within a day or two',
  },

  social: {
    // Confirmed indirectly: weddingsbyharith.com currently redirects here.
    // Worth double-checking before launch.
    instagram: 'https://www.instagram.com/weddingsbyharith',
    pinterest: null,
    vimeo: null,
  },

  // ── Credentials ────────────────────────────────────────────────────────
  about: {
    degree: 'BSc in Computer Science, University of Colombo',
    startedAge: 5,
    firstWedding: 'December 2020',
    weddingsSince: 2020,
    shootsCovered: '1,000+',
    // Weddings are the brand and the domain, so they lead everywhere. The rest
    // is real work Harith takes on and had no mention on the site at all.
    otherServices: [
      { name: 'Studio shoots', note: 'Portraits and headshots, in a controlled space.' },
      { name: 'Product shoots', note: 'Catalogue and campaign work, on white or styled.' },
      { name: 'Food shoots', note: 'Menus, delivery apps and social. Where I started, in 2016.' },
      { name: 'Corporate shoots', note: 'Team portraits, offices, conferences and launches.' },
      { name: 'Event shoots', note: 'Birthdays, anniversaries, awards nights and parties.' },
    ],
    teamSize: '1–3 photographers',
    // Harith has assisted and second-shot for internationally recognised
    // wedding photographers. Names to be supplied; see docs/06-maintenance.md.
    mentors: TODO('names of the photographers you have worked with'),
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
    defaultImage: 'wedding-02',
    twitterCard: 'summary_large_image',
  },

  // ── Navigation ─────────────────────────────────────────────────────────
  nav: [
    { label: 'Portfolio', href: '/portfolio/' },
    { label: 'About', href: '/about/' },
    { label: 'Investment', href: '/packages/' },
    { label: 'Journal', href: '/journal/' },
    { label: 'FAQ', href: '/faq/' },
  ],

  cta: { label: 'Check your date', href: '/contact/' },

  founded: '2016',
};
