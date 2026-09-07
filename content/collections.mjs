/**
 * Portfolio collections (FR-02, FR-03).
 *
 * `cover` and `images` reference filenames in photos/raw/ without extension.
 * To publish a new wedding: drop photos into photos/raw/, add an entry here,
 * run `npm run build`. No markup changes required (US-5).
 *
 * NOTE: all imagery here is Unsplash-licensed placeholder work — see
 * photos/CREDITS.md. Couple names are placeholders.
 */
export default [
  {
    slug: 'cliffside-vows',
    title: 'The Cliffside Vows',
    couple: 'Amara & Rohan',
    placeholder: true,
    venue: 'A headland chapel above the Atlantic',
    location: 'Cornwall, England',
    season: 'Late September',
    guests: 68,
    cover: 'coastal-03',
    featured: true,
    excerpt:
      'Wind off the water, a borrowed veil, and eighty seconds of complete ' +
      'silence before anyone remembered to clap.',
    story: [
      'They had planned for a garden. The forecast had other ideas, and by ten ' +
        'that morning the whole thing had moved to a chapel on the headland with ' +
        'a door that would not stay shut.',
      'Nobody minded. The wind took the ceremony readings and gave them back ' +
        'louder. Amara walked in on her grandmother’s arm, both of them ' +
        'laughing at the state of their hair, and the room turned like a tide.',
      'I photographed most of the day from the edges. The frames I keep coming ' +
        'back to are not the vows — they are the ninety minutes afterwards, ' +
        'when everyone stood outside in the cold because nobody wanted it to end.',
    ],
    images: [
      'coastal-03',
      'coastal-01',
      'coastal-07',
      'coastal-02',
      'coastal-09',
      'coastal-04',
      'detail-01',
      'coastal-05',
      'portrait-02',
      'coastal-08',
      'coastal-06',
      'detail-05',
      'coastal-10',
      'coastal-11',
      'coastal-12',
      'portrait-06',
    ],
  },
  {
    slug: 'long-table-low-light',
    title: 'Long Table, Low Light',
    couple: 'Priya & Tom',
    placeholder: true,
    venue: 'A working barn with the doors open',
    location: 'Somerset, England',
    season: 'Midsummer',
    guests: 120,
    cover: 'barn-02',
    featured: true,
    excerpt:
      'One table, a hundred and twenty people, and a speech that ran forty ' +
      'minutes over because nobody would sit down.',
    story: [
      'Priya wanted one table. Not a top table — one table, everyone on it, ' +
        'end to end down the middle of a barn that still smelled faintly of hay.',
      'It worked because it forced people together. By nine the light had gone ' +
        'amber and low, the kind that makes a photographer stop talking, and the ' +
        'speeches had stopped being speeches and started being a conversation.',
      'This is the gallery I send to couples who tell me they hate being ' +
        'photographed. Almost nobody in it is looking at me.',
    ],
    images: [
      'barn-02',
      'barn-01',
      'detail-02',
      'barn-04',
      'barn-03',
      'barn-05',
      'detail-06',
      'barn-06',
      'portrait-03',
      'barn-07',
      'barn-08',
      'detail-03',
      'barn-09',
      'barn-10',
      'detail-08',
      'portrait-05',
    ],
  },
  {
    slug: 'two-witnesses',
    title: 'Two Witnesses and a Mountain',
    couple: 'Elena & Jonah',
    placeholder: true,
    venue: 'A ridge, four hours’ walk from the road',
    location: 'The Dolomites, Italy',
    season: 'Early October',
    guests: 4,
    cover: 'elope-02',
    featured: true,
    excerpt:
      'Four people, one registrar who was a better hiker than any of us, and ' +
      'a ceremony that lasted eleven minutes.',
    story: [
      'They emailed in March asking whether I would be willing to carry my own ' +
        'kit up a mountain. I said yes before I had properly looked at the route.',
      'We left the refuge at four in the morning. The ceremony was at sunrise, ' +
        'eleven minutes long, witnessed by Elena’s brother and a registrar ' +
        'who out-walked all of us on the way back down.',
      'An elopement is not a smaller wedding. It is a different thing entirely, ' +
        'and it asks a different thing of the photographer — mostly, to stop ' +
        'directing and start keeping up.',
    ],
    images: [
      'elope-02',
      'elope-01',
      'elope-03',
      'elope-05',
      'portrait-01',
      'elope-04',
      'elope-06',
      'detail-07',
      'elope-07',
      'elope-08',
      'portrait-04',
      'detail-04',
    ],
  },
];
