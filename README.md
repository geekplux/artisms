# Art-isms · 艺术流派志

A bilingual (English / 中文) visual atlas of art styles: a 45,000-year timeline, how each style grew out of the last, and three real works for every style.

**Live site: [artisms.geekplux.org](https://artisms.geekplux.org/)** · 中文版：[artisms.geekplux.org/?lang=zh](https://artisms.geekplux.org/?lang=zh)

A sibling of [Worldlines](https://worldlines.geekplux.org/), a Mondrian-style atlas of world history.

- **40 styles, 120 works**, from the Chauvet cave paintings to contemporary installation, including Chinese landscape painting, ukiyo-e, Islamic art, Indian miniatures, African sculpture, Indigenous arts and Latin American modernisms.
- **One timeline** for 45,000 years. The scale is compressed for older periods, and thick rules mark where it changes. Hover over a style to light up what it grew from and what it led to.
- **Filters** by era and region in a bar that stays on screen while you browse the styles. They also dim the timeline, and a filtered view can be shared as a link, e.g. `?era=avant,post&region=west`.
- **Real images**: 92 freely licensed files from Wikimedia Commons, hosted with the site and credited with author and licence ([CREDITS.md](CREDITS.md)). Works still in copyright are linked, not reproduced.
- **English and Chinese** throughout, switchable on the page. The English view shows no Chinese, and the Chinese view keeps each style's English name beside it. The choice is remembered, Chinese is the default for Chinese-language browsers, and `?lang=en` or `?lang=zh` in a link opens that language.
- **No build step.** Plain HTML, CSS and JavaScript. All content lives in one data file.

## Run it locally

Serve the `public/` folder:

```sh
python3 -m http.server 8000 --directory public
# then visit http://localhost:8000
```

`npx wrangler dev` also works and applies the same cache headers as production.

Everything, images included, is served from this repository, so it works offline.

## Project structure

```
public/                     everything that is deployed, and nothing else
  index.html                page skeleton and static copy
  assets/styles.css         all styles (paper, ink and a little De Stijl)
  assets/app.js             rendering, language switch, timeline, image loading
  data/movements.js         all content: 40 styles × 3 works, English + Chinese
  images/<style>/           hosted images: <n>.webp (long edge ≤ 1200px) and <n>-480.webp
  _headers                  cache headers (Cloudflare reads it; it is not served)
wrangler.jsonc              Cloudflare Workers Static Assets config
CREDITS.md                  image credits, generated from the data
docs/                       fact-check records
scripts/check-data.mjs      validates data, image files, CREDITS.md and cache stamps (no network)
scripts/fetch-images.mjs    downloads, resizes and credits Commons images (network, cwebp)
scripts/stamp-assets.mjs    writes ?v=<hash> into index.html for files under assets/
scripts/seo.mjs             writes static, crawlable HTML (JSON-LD, contents, styles) into index.html
scripts/verify-images.mjs   checks hosted files, Commons sources and links (network)
```

## Content model

`public/data/movements.js` sets `window.ARTISMS` to an object containing `eras`, `groups`, `movements`, `engines`, `nicknames` and `howto`. Every piece of text is a `{ "en": "…", "zh": "…" }` pair.

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

Each work is either **hosted** or a **placeholder**:

| Field | Meaning |
| --- | --- |
| `c` | Wikimedia Commons path of a freely licensed file, e.g. `"e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg"` (the part after `/wikipedia/commons/`). `scripts/fetch-images.mjs` downloads it to `public/images/<style>/<n>.webp` and fills in `image`. |
| `image` | Written by the script, never by hand: `w`, `h` of the hosted file, `v` (content hash, used for caching), and `author`, `license`, `licenseUrl`, `page` read from the Commons API. |
| `restricted: true` | A work still in copyright. The card shows a placeholder linking to `src` or the `wiki` article. With `img` (an image URL elsewhere), the image is shown only if `SHOW_RESTRICTED_IMAGES` is turned on. |
| `wiki` | Required. English Wikipedia article the work's title links to: the work's own article, or the closest one (building, series, artist). |
| `zhwiki` | Chinese Wikipedia article, from the English article's language links. Without it, the Chinese view links to the English article, marked EN. |

Other work fields: `t` title, `a` artist, `y` year, `loc` where it is (optional), `look` what to look for, and `n` a one-sentence note (optional).

## Adding or correcting a style

1. Edit `public/data/movements.js`. Keep movements sorted by `start`.
2. If you added or changed a `c` path, run `node scripts/fetch-images.mjs` (needs network and `cwebp`: `brew install webp`). It downloads only missing files (`--force` to redo all, `--only <style-id>` for one style), refreshes licences and authors, and rewrites `CREDITS.md`. Look at the new image before committing.
3. Run `node scripts/check-data.mjs`. It checks ids, cross-links, the three works per style, both languages, the image files and that `CREDITS.md` is current.
4. Run `node scripts/verify-images.mjs` (needs network). It checks the hosted files, that each Commons source still exists with the same licence, every link, and flags file names that may not show the work.
5. If you changed `public/assets/app.js` or `styles.css`, run `node scripts/stamp-assets.mjs`; if you changed the data, run `node scripts/seo.mjs` (check-data fails until you do).
6. Open the page and check that both languages render, on a desktop and at phone width.

CI runs the same check on every push and pull request.

## Deployment

The site is served at **https://artisms.geekplux.org/** (a custom domain on the `artisms` Worker) by **Cloudflare Workers Static Assets** with Workers Builds (Git integration). Every push to `main` runs `npx wrangler deploy`, which uploads `public/` as configured in `wrangler.jsonc`. There is no build command. Pull requests get preview builds if they are enabled in the dashboard. Nothing outside `public/` (README, scripts, `.git`) is ever uploaded.

`public/_headers` caches `assets/` and `images/` for a year. That is safe because every reference to them carries a content hash (`?v=…`): `image.v` in the data for images, and `scripts/stamp-assets.mjs` for `index.html`. `index.html` and `data/` are revalidated on every visit.

## SEO

`public/index.html` carries the canonical URL, hreflang links for English and Chinese (`?lang=zh`), Open Graph and Twitter cards (`public/og.jpg`, 1200×630) and JSON-LD. `scripts/seo.mjs` writes a static copy of the contents and every style's text into the page, so crawlers and link previews that don't run JavaScript still see the content; `app.js` replaces it on load. `public/robots.txt` and `public/sitemap.xml` point search engines at both language versions.

## Analytics

Google Analytics 4 (`G-V8MD23KS3G`) runs on **artisms.geekplux.org only**, never locally or on preview URLs. It uses Consent Mode v2: until a visitor accepts in the consent bar, `analytics_storage` is denied, so GA receives cookieless pings and sets no cookies. Accepting allows analytics cookies; "Cookie settings" in the footer reopens the choice, and declining deletes any `_ga` cookies. Ads features stay denied. The setup is the inline script in `public/index.html`; the bar is in `public/assets/app.js`.

## Images and copyright

- Hosted images are public-domain or Creative Commons files from Wikimedia Commons, resized to WebP. Each card shows the author and licence and links to the Commons file page; [CREDITS.md](CREDITS.md) lists them all. Check the file page before reusing an image.
- **Never host a copyrighted work.** A CC licence on a *photo* does not cover the artwork in it: a photo of a living artist's installation stays a placeholder even if Commons hosts it. Host only when the work itself is public domain (or Commons records why it is free, e.g. `PD-ineligible`, freedom of panorama for buildings).
- Works still under copyright (many 20th-century pieces) are **not shown**. Their cards show a placeholder that links to the museum or article instead. `SHOW_RESTRICTED_IMAGES` in `assets/app.js` stays `false`.
- Dates are conventional ranges. Styles overlap, and historians draw the boundaries in different places.
- Facts were checked against the holding museums' records in October 2026. [docs/fact-check-2026-10.md](docs/fact-check-2026-10.md) lists what was corrected, with sources, and what could not be verified.

## Credits

The content merges two earlier prototypes: a Mondrian-style timeline atlas, and a visual field guide to art styles that supplied most of the image selections. Images belong to their creators and are used under the licences shown on their source pages.

## License

- Code (`public/index.html`, `public/assets/`, `scripts/`): [MIT](LICENSE)
- Written content in `public/data/movements.js` (summaries, notes, translations): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- Images in `public/images/`: each under its own licence, listed in [CREDITS.md](CREDITS.md). They are not covered by the MIT or CC BY-SA licences above.
