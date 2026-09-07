/**
 * Investment tiers (FR-06). Prices are placeholders — see docs/06-maintenance.md.
 */
export default {
  currency: 'GBP',
  symbol: '£',
  placeholder: true,
  note:
    'Every wedding is quoted individually. These are the shapes most couples ' +
    'start from, not a menu you have to choose off.',
  tiers: [
    {
      slug: 'elopement',
      name: 'The Elopement',
      price: 1450,
      priceNote: 'from',
      summary:
        'For the two of you, a witness or two, and a very good reason to be somewhere beautiful.',
      hours: 'Up to 4 hours',
      includes: [
        'Up to four hours of coverage',
        'Pre-wedding planning call and location scouting notes',
        'Around 250 edited photographs',
        'Private online gallery, downloadable at full resolution',
        'Personal print licence',
      ],
      excludes: ['Second photographer', 'Album'],
      popular: false,
    },
    {
      slug: 'signature',
      name: 'The Signature',
      price: 2950,
      priceNote: 'from',
      summary: 'Full-day documentary coverage. What most couples book, and what I would book.',
      hours: '10 hours',
      includes: [
        'Ten hours, from getting ready to the dance floor',
        'Two planning calls and a venue walkthrough',
        'Around 700 edited photographs',
        'Private online gallery, downloadable at full resolution',
        'Personal print licence',
        'Sneak-peek gallery within 72 hours',
      ],
      excludes: ['Album'],
      popular: true,
    },
    {
      slug: 'weekend',
      name: 'The Whole Weekend',
      price: 4800,
      priceNote: 'from',
      summary: 'Multi-day weddings, welcome dinners, and the morning after — covered end to end.',
      hours: 'Two to three days',
      includes: [
        'Coverage across two or three days',
        'Second photographer throughout the wedding day',
        'Unlimited planning calls',
        'Around 1,400 edited photographs',
        'Private online gallery, downloadable at full resolution',
        'Personal print licence',
        'Sneak-peek gallery within 72 hours',
        'A 40-page fine-art album, designed with you',
      ],
      excludes: [],
      popular: false,
    },
  ],
  addons: [
    { name: 'Second photographer', price: 550, unit: 'per day' },
    { name: 'Fine-art album, 40 pages', price: 690, unit: '' },
    { name: 'Parent album duplicates', price: 240, unit: 'each' },
    { name: 'Rehearsal dinner coverage', price: 480, unit: 'up to 3 hours' },
    { name: 'Travel beyond 60 miles', price: null, unit: 'at cost, agreed upfront' },
  ],
};
