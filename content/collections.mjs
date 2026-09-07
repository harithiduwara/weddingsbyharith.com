/**
 * Portfolio galleries (FR-02, FR-03).
 *
 * These are grouped by the kind of work rather than by individual wedding,
 * because the photographs currently on file come from Harith's 2024/25 price
 * guide rather than from complete single-wedding galleries.
 *
 * IMPORTANT: these are photographs of real, identifiable clients. Do not
 * attach invented couple names, venues or stories to them. When Harith
 * supplies a full gallery from one wedding, with that couple's permission,
 * add it here as its own entry with their real details.
 *
 * Each image carries its own alt text. `picture()` refuses to build without it.
 */
export default [
  {
    slug: 'weddings',
    title: 'Weddings',
    kind: 'Full-day coverage',
    cover: 'wedding-01',
    featured: true,
    excerpt:
      'Poruwa ceremonies, church services, hotel receptions and the long gap in the middle that nobody photographs.',
    facts: [
      { label: 'Coverage', value: '7 to 10 hours' },
      { label: 'Team', value: 'Two or three photographers' },
      { label: 'Delivered', value: '150 to 500 edited images' },
    ],
    story: [
      'A Sri Lankan wedding is not one event. It is three or four stacked on top of each other, and at least one of them starts before six in the morning because that is when the nekath falls.',
      'So the day is long and the light changes completely between the start of it and the end. Morning ceremonies are bright and hard. Hotel receptions are dark and warm and full of people who have stopped performing. Both need photographing properly, and they need different things from a photographer.',
      'That is most of why I bring two or three of us on a full day. Not to hover, but so that nobody has to choose between the bride getting ready and the groom arriving, and so the room still gets covered while I am outside doing portraits.',
    ],
    images: [
      {
        slug: 'wedding-01',
        alt: 'A groom kisses his bride on the forehead. She wears a white saree and a traditional headpiece.',
      },
      {
        slug: 'wedding-02',
        alt: 'A couple hold each other under a large tree, the bride’s train spread across the grass.',
      },
      {
        slug: 'wedding-03',
        alt: 'A bride and groom laughing together against a white wall, she is holding a bouquet of white roses.',
      },
      {
        slug: 'wedding-04',
        alt: 'A couple standing together on open grass with water and trees behind them.',
      },
      {
        slug: 'wedding-05',
        alt: 'A close portrait in low light. The bride in a red saree, the groom just behind her.',
      },
      {
        slug: 'wedding-06',
        alt: 'A woman in a red saree standing at a white doorway, framed by decorative elephants on the wall.',
      },
    ],
  },
  {
    slug: 'engagements',
    title: 'Engagements & couple shoots',
    kind: 'Half-day and casual sessions',
    cover: 'couples-01',
    featured: true,
    excerpt:
      'Usually the first time a couple has been photographed together properly, and usually the most nervous either of them will be.',
    facts: [
      { label: 'Coverage', value: '3 to 6 hours' },
      { label: 'Team', value: 'One or two photographers' },
      { label: 'Delivered', value: '100 to 250 edited images' },
    ],
    story: [
      'Almost every couple tells me on the phone that they are bad at this. They are not. They are just being photographed on purpose for the first time, which is a genuinely strange thing to do.',
      'The fix is not better posing instructions. It is giving people something to actually do, then waiting. Walk down there and come back. Tell him the thing you were telling me in the car. Most of the photographs I like from these sessions were taken between the moments anybody thought was the moment.',
      'They are also the best possible rehearsal. By the wedding you will have forgotten I am holding a camera, which is exactly where I want you.',
    ],
    images: [
      {
        slug: 'couples-01',
        alt: 'A couple embracing in shallow sea water, her orange saree floating around them.',
      },
      {
        slug: 'couples-02',
        alt: 'A couple walking hand in hand through the surf at sunset, holding each other at arm’s length.',
      },
      {
        slug: 'couples-03',
        alt: 'A couple walking along the shoreline in the late afternoon, a hat in his hand.',
      },
    ],
  },
];
