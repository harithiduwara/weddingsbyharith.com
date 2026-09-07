# Photography credits

> **Every photograph in this repository is a placeholder.** None of it was taken
> by Harith. It exists so the site could be designed, measured and tested against
> real photographic content rather than grey boxes.

## Source and licence

All 50 images in `photos/raw/` are from [Unsplash](https://unsplash.com) and are
covered by the [Unsplash License](https://unsplash.com/license): free to use,
including commercially, with no permission or attribution required. Attribution
is given here anyway, because not crediting photographers is a poor look for a
photographer's website.

The mapping from local filename to Unsplash photo ID is in
[`tools/photos.manifest.mjs`](../tools/photos.manifest.mjs). Any individual
photograph can be traced with:

```
https://unsplash.com/photos/<id>
```

## Replacing them with real work

1. Put your own JPEGs in `photos/raw/`, roughly 1800–2400 px on the long edge.
2. Keep the existing filenames to swap images in place, or use new names and
   update `content/collections.mjs` to reference them.
3. Run `npm run build`. The pipeline regenerates every derivative automatically.
4. Delete this file's warning once no placeholder images remain.

`npm run photos:fetch` never overwrites an existing file, so it cannot clobber
your photographs if it is run again by accident.
