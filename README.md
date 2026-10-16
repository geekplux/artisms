# Art-isms · 艺术流派志

A bilingual (English / 中文) visual atlas of art styles: a 45,000-year timeline, how each style grew out of the last, and three real works for every style.

**Live site:** https://geekplux.github.io/art-isms/

- **40 styles, 120 works**, from the Chauvet cave paintings to contemporary installation, including Chinese landscape painting, ukiyo-e, Islamic art, Indian miniatures, African sculpture, Indigenous arts and Latin American modernisms.
- **One timeline** for 45,000 years. The scale is compressed for older periods, and thick rules mark where it changes. Hover over a style to light up what it grew from and what it led to.
- **Real images** from Wikimedia Commons and Wikipedia, each linked to its source page and licence.
- **English and Chinese** throughout, switchable on the page. The choice is remembered, and Chinese is the default for Chinese-language browsers.
- **No build step.** Plain HTML, CSS and JavaScript. All content lives in one data file.

## Run it locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

Images load from Wikimedia, so you need to be online to see them.

## Project structure

```
index.html           page skeleton and static copy
assets/styles.css    all styles (paper, ink and a little De Stijl)
assets/app.js        rendering, language switch, timeline, image loading
data/movements.js    all content: 40 styles × 3 works, English + Chinese
scripts/check-data.mjs      validates the data file (no dependencies)
scripts/verify-images.mjs   checks every image against Wikimedia (network)
```

## Content model

`data/movements.js` sets `window.ARTISMS` to an object containing `eras`, `groups`, `movements`, `engines`, `nicknames` and `howto`. Every piece of text is a `{ "en": "…", "zh": "…" }` pair.

A movement looks like this:

```js
{
  "id": "cubism",                 // used in URLs: /#cubism
  "era": "avant",                 // one of eras[].id
  "group": "west",                // region colour: west | asia | africa | deep
  "start": 1907, "end": 1925,     // timeline position; negative = BCE
  "living": true,                 // optional: draw as a hatched, still-living tradition
  "years":   { "en": "c. 1907–1925", "zh": "约1907–1925年" },
  "name":    { "en": "Cubism", "zh": "立体主义" },
  "region":  { … }, "idea": { … }, "summary": { … },
  "traits":  { "en": ["…"], "zh": ["…"] },
  "from": ["postimpressionism"],  // grew out of
  "to":   ["futurism"],           // led to (must be mirrored by the other style's "from")
  "works": [ /* exactly three */ ]
}
```

Each work names **one image source**:

| Field | Meaning |
| --- | --- |
| `c` | Wikimedia Commons path, e.g. `"e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg"` (the part after `/wikipedia/commons/`). Preferred. Add `lic` with the licence shown on the file page. |
| `wiki` | English Wikipedia article title. The page uses that article's lead image, fetched in the browser from the Wikipedia REST API. |
| `img` + `src` | Any other image URL plus its source page. Must be marked `"restricted": true`. |
| `restricted: true` + `wiki` or `src` | A work still in copyright with no image at all. The card shows a placeholder linking to the article or museum page. Nothing is fetched. |

Other work fields: `t` title, `a` artist, `y` year, `loc` where it is (optional), `look` what to look for, and `n` a one-sentence note (optional).

## Adding or correcting a style

1. Edit `data/movements.js`. Keep movements sorted by `start`.
2. Run `node scripts/check-data.mjs`. It checks ids, cross-links, the three works per style, both languages and the image fields.
3. Run `node scripts/verify-images.mjs` (needs network). It loads every image URL the page would use, checks `wiki` titles and lead images, and flags file names that may not show the work. Add `--only <movement-id>` to check one style.
4. Open the page and check that both languages render.

CI runs the same check on every push and pull request.

## Images and copyright

- Most images are public-domain or Creative Commons files on Wikimedia Commons, loaded directly from `upload.wikimedia.org`. Each card links to its file page, where the creator and licence are recorded. Check that page before reusing an image.
- Works still under copyright (many 20th-century pieces) are **not shown by default**. Their cards show a placeholder that links to the museum or article instead. This is controlled by `SHOW_RESTRICTED_IMAGES` at the top of `assets/app.js`. Only turn it on if you have the right to display those images.
- Dates are conventional ranges. Styles overlap, and historians draw the boundaries in different places.

## Credits

The content merges two earlier prototypes: a Mondrian-style timeline atlas, and a visual field guide to art styles that supplied most of the image selections. Images belong to their creators and are used under the licences shown on their source pages.

## License

- Code (`index.html`, `assets/`, `scripts/`): [MIT](LICENSE)
- Written content in `data/movements.js` (summaries, notes, translations): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- Images: not part of this repository. Each one is loaded from its source under its own licence.
