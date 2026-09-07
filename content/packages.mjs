/**
 * Packages (FR-06).
 *
 * These are Harith's real prices, transcribed from the Weddings by Harith
 * Price Guide 2024/25. They are NOT placeholders, which is why this file no
 * longer sets `placeholder: true`.
 *
 * ⚠️  They are, however, 2024/25 prices. Confirm them before the site goes
 * live — published prices are a contractual signal and a stale one is worse
 * than none. See docs/06-maintenance.md.
 */
export default {
  currency: 'LKR',
  symbol: 'LKR ',
  guideYear: '2024/25',
  note: 'Every package here is customisable. If none of them is quite your wedding, say so and I will quote it properly.',

  groups: [
    {
      slug: 'weddings',
      name: 'Weddings',
      intro:
        'Full-day coverage. The difference between these is how many of us are there, how long for, and what you end up holding at the end.',
      tiers: [
        {
          slug: 'gold',
          name: 'Gold',
          price: 230000,
          hours: '10 hours',
          team: '3 photographers',
          summary: 'Everything, including the albums you will still have in thirty years.',
          includes: [
            '10 hours of coverage',
            '3 photographers',
            '12"×24" premium fine art story album, 60 pages',
            '10"×20" premium fine art replica album, 60 pages',
            'Two 20"×30" premium framed portraits',
            'One stop-motion video',
            'USB with 500 professionally edited images',
            'All high-resolution files on the USB',
            '100 4"×6" thank-you cards',
          ],
        },
        {
          slug: 'silver',
          name: 'Silver',
          price: 180000,
          hours: '8 hours',
          team: '3 photographers',
          summary: 'The full team and the main album, without the extras around it.',
          includes: [
            '8 hours of coverage',
            '3 photographers',
            '12"×24" premium fine art story album, 60 pages',
            'Two 16"×24" premium framed portraits',
            'USB with 300 professionally edited images',
            'All high-resolution files on the USB',
          ],
        },
        {
          slug: 'delight',
          name: 'Delight',
          price: 140000,
          hours: '7 hours',
          team: '2 photographers',
          summary: 'A full day of coverage and an album, at the size most couples actually need.',
          includes: [
            '7 hours of coverage',
            '2 photographers',
            '10"×20" premium fine art story album, 40 pages',
            'USB with 200 professionally edited images',
            'All high-resolution files on the USB',
          ],
        },
        {
          slug: 'lite',
          name: 'Lite',
          price: 120000,
          hours: '7 hours',
          team: '2 photographers',
          summary: 'The photographs and nothing else. Add an album later if you want one.',
          includes: [
            '7 hours of coverage',
            '2 photographers',
            'USB with 150 professionally edited images',
            'All high-resolution files on the USB',
          ],
        },
      ],
    },
    {
      slug: 'engagements',
      name: 'Engagements',
      intro:
        'For most couples this is the first time you have been photographed together on purpose. It is also the best rehearsal you will get.',
      tiers: [
        {
          slug: 'engagement-i',
          name: 'Package I',
          price: 125000,
          hours: '6 hours',
          team: '2 photographers',
          summary: 'Full coverage with an album at the end of it.',
          includes: [
            '6 hours of coverage',
            '2 photographers',
            '10"×20" premium fine art story album, 40 pages',
            'USB with 250 professionally edited images',
            'All high-resolution files on the USB',
          ],
        },
        {
          slug: 'engagement-ii',
          name: 'Package II',
          price: 100000,
          hours: '5 hours',
          team: '2 photographers',
          summary: 'Framed portraits instead of an album.',
          includes: [
            '5 hours of coverage',
            '2 photographers',
            'Two 12"×18" premium framed portraits',
            'USB with 200 professionally edited images',
            'All high-resolution files on the USB',
          ],
        },
        {
          slug: 'engagement-iii',
          name: 'Package III',
          price: 60000,
          hours: '5 hours',
          team: '1 photographer',
          summary: 'Just the photographs.',
          includes: [
            '5 hours of coverage',
            '1 photographer',
            'USB with 150 professionally edited images',
            'All high-resolution files on the USB',
          ],
        },
      ],
    },
    {
      slug: 'homecoming',
      name: 'Homecoming',
      intro:
        'The day after, at his family home. Shorter, louder, and usually where everybody finally relaxes.',
      tiers: [
        {
          slug: 'homecoming-i',
          name: 'Package I',
          price: 85000,
          hours: '4 hours',
          team: '1 photographer',
          summary: 'Coverage and a story album of the day.',
          includes: [
            '4 hours of coverage',
            '1 photographer',
            '10"×20" premium fine art story album, 30 pages',
            'USB with 200 professionally edited images',
            'All high-resolution files on the USB',
          ],
        },
        {
          slug: 'homecoming-ii',
          name: 'Package II',
          price: 50000,
          hours: '4 hours',
          team: '1 photographer',
          summary: 'Coverage only.',
          includes: [
            '4 hours of coverage',
            '1 photographer',
            'USB with 150 professionally edited images',
            'All high-resolution files on the USB',
          ],
        },
      ],
    },
    {
      slug: 'casual',
      name: 'Casual shoots',
      intro:
        'Birthdays, anniversaries, a family that is finally in the same country at the same time.',
      tiers: [
        {
          slug: 'casual-i',
          name: 'Package I',
          price: 55000,
          hours: '3 hours',
          team: '1 photographer',
          summary: 'A short session with an album.',
          includes: [
            '3 hours of coverage',
            '1 photographer',
            '10"×20" premium fine art story album, 30 pages',
            'USB with 100 professionally edited images',
            'All high-resolution files on the USB',
          ],
        },
        {
          slug: 'casual-ii',
          name: 'Package II',
          price: 35000,
          hours: '3 hours',
          team: '1 photographer',
          summary: 'A short session, photographs only.',
          includes: [
            '3 hours of coverage',
            '1 photographer',
            'USB with 100 professionally edited images',
            'All high-resolution files on the USB',
          ],
        },
      ],
    },
  ],

  extras: [
    { name: 'Extra copy of the 12"×24" album', price: 60000 },
    { name: 'Extra copy of the 10"×20" album', price: 50000 },
    { name: '20"×30" framed enlargement', price: 15000 },
    { name: '16"×24" framed enlargement', price: 12000 },
    { name: '12"×18" framed enlargement', price: 10000 },
    { name: 'Additional hour of coverage', price: 10000 },
  ],
};
