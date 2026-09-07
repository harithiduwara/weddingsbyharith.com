/**
 * Package tiers (FR-06).
 *
 * Prices are indicative and flagged as placeholder until Harith confirms them.
 * They are plain numbers so they stay sortable; the build formats them.
 */
export default {
  currency: 'LKR',
  symbol: 'Rs ',
  placeholder: true,
  note:
    'Sri Lankan weddings come in a lot of shapes, so I quote every one separately. ' +
    'These three are just the shapes I get asked for most.',
  tiers: [
    {
      slug: 'small',
      name: 'The Small One',
      price: 150000,
      priceNote: 'from',
      summary:
        'Registrations, a poruwa in your parents’ garden, a church service with forty people in it. Small is not less.',
      hours: 'Up to 4 hours',
      includes: [
        'Up to four hours, whenever in the day you need them',
        'A call beforehand to work out the running order',
        'Around 250 edited photographs',
        'Private online gallery, full resolution, downloadable',
        'Print however many you like, forever',
      ],
      excludes: ['Second photographer', 'Album'],
      popular: false,
    },
    {
      slug: 'wedding-day',
      name: 'The Wedding Day',
      price: 350000,
      priceNote: 'from',
      summary:
        'The whole day. Getting ready, the ceremony, the hotel, the dancing, the bit at midnight when everyone has stopped performing.',
      hours: '10 hours',
      includes: [
        'Ten hours from the first hairpin to the last song',
        'Two planning calls and a visit to your venue before the day',
        'Around 700 edited photographs',
        'Private online gallery, full resolution, downloadable',
        'Print however many you like, forever',
        'Thirty or so photographs back within three days',
      ],
      excludes: ['Album'],
      popular: true,
    },
    {
      slug: 'wedding-and-homecoming',
      name: 'Wedding and Homecoming',
      price: 650000,
      priceNote: 'from',
      summary:
        'Both days, properly. Most couples who book one day end up wishing they had booked the homecoming too.',
      hours: 'Two days',
      includes: [
        'Full coverage of the wedding day and the homecoming',
        'A second photographer with me on the wedding day',
        'As many planning calls as you want',
        'Around 1,400 edited photographs',
        'Private online gallery, full resolution, downloadable',
        'Print however many you like, forever',
        'Thirty or so photographs back within three days',
        'A 40-page album, laid out with you rather than at you',
      ],
      excludes: [],
      popular: false,
    },
  ],
  addons: [
    { name: 'Second photographer', price: 45000, unit: 'per day' },
    { name: 'Homecoming, added to a single-day booking', price: 180000, unit: '' },
    { name: 'Album, 40 pages', price: 65000, unit: '' },
    { name: 'Extra album for the parents', price: 22000, unit: 'each' },
    {
      name: 'Travel outside the Western Province',
      price: null,
      unit: 'at cost, agreed before you book',
    },
    { name: 'Overseas weddings', price: null, unit: 'flights and accommodation only' },
  ],
};
