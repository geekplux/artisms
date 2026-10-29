# Art-isms: working conventions

A static, bilingual (EN/中文) atlas of 40 art styles with 3 works each. Repository: github.com/geekplux/artisms.
Live: https://artisms.geekplux.com/ (primary; `artisms.geekplux.org` redirects to it, and canonical,
sitemap and links always use `.com`). Sister projects: Worldlines, Dialectica.
Read README.md for the data model and file layout. These are the rules that are easy to break.

## No build step

- The site is plain HTML, CSS and JavaScript in `public/`, deployed as-is. Do not add a bundler, framework,
  package.json or build command unless the owner agrees first.
- Everything deployable lives in `public/`; nothing else is uploaded. Scripts in `scripts/` are dev-time
  tools (Node 22, no dependencies).
- Serve locally with `python3 -m http.server 8000 --directory public` (or `npx wrangler dev`).

## Content

- All content is in `public/data/movements.js` (`window.ARTISMS`). Every piece of text is `{ "en": "…", "zh": "…" }`,
  both non-empty. Add new text in both languages in the same change.
- The English view shows no Chinese at all (the 中文 language button is the one exception). The Chinese view
  keeps each style's English name as the secondary title.
- Edit data through `loadData()`/`saveData()` in `scripts/lib/data.mjs` when scripting, so formatting is
  preserved. Never hand-edit a work's `image` field: `scripts/fetch-images.mjs` writes it.
- Facts (titles, dates, locations, numbers in notes) need a reliable source, ideally the holding museum.
  If a claim can't be verified, list it for the owner; don't silently "fix" it. Record fact-check passes in `docs/` (see
  `docs/fact-check-2026-10.md`): what changed, the source, and what remains unverified.
- The footer opens with the sister-atlas strip: Art-isms, Worldlines, Dialectica, in that order, with the site you are on in solid ink. The same markup, styles and words live in all three repos; change them together.
- Every style shows at least one image. When a work is in copyright, prefer swapping in a free work that fits
  the text over leaving all three cards as placeholders.

## Images: never host a copyrighted work

- Host only freely licensed files from Wikimedia Commons, and only when the artwork itself is free:
  public domain everywhere (in particular in its home country, not just the US), or Commons records why
  it is free (`PD-ineligible`, freedom of panorama for a building or permanent public artwork, etc.).
- A CC licence on a photo covers the photo, not the artwork in it. A photo of a living artist's installation
  stays a placeholder.
- "PD-US only" (`PD-USonly`, `PD-US-1923-abroad`) and fair-use files on English Wikipedia are not hostable.
- Copyrighted works are `restricted: true` placeholders linking to `src` or the `wiki` article.
  `SHOW_RESTRICTED_IMAGES` in `public/assets/app.js` stays `false`.
- Look at every new image before committing: right work, right version, not a replica or a stamp.

## Before every commit

1. `node scripts/fetch-images.mjs` if any `c` path changed (needs network and `cwebp`). It also regenerates
   CREDITS.md.
2. `node scripts/stamp-assets.mjs` if `public/assets/app.js` or `styles.css` changed, and `node scripts/seo.mjs` if the
   data changed (it regenerates the static, crawlable HTML in index.html), and set `<lastmod>` in
   `public/sitemap.xml` to the date of the content change.
3. `node scripts/check-data.mjs` (CI runs it too; it fails on stale CREDITS.md, image hashes or stamps).
4. `node scripts/verify-images.mjs` (network): hosted files, Commons sources and every link.
5. Open the page at desktop width and at 390px, in both languages: no horizontal scroll, no console errors.

## Analytics and privacy

- Google Analytics loads only on `artisms.geekplux.com` and `.org`, in Consent Mode v2 with everything denied until the
  visitor accepts. Don't add other trackers, third-party scripts or cookies without the owner's agreement,
  and never load GA before the consent defaults are set.
- GA cookies are host-only (`cookie_domain: "none"`; `location.hostname` would give a domain cookie) and the automatic page view is off: `app.js` sends
  `page_view` after rendering. Events go through `track()` in `app.js` (a no-op where `gtag` is undefined); never send
  free text or personal data in event parameters. The GA4 stream setting "Page changes based on browser history
  events" must stay off (see README): otherwise each ?lang/?era/?region change logs an extra page view.

## Caching and deployment

- Cloudflare Workers Static Assets, configured in `wrangler.jsonc`; Workers Builds deploys `main` on push.
  The Worker name `artisms` must match the Worker in the Cloudflare dashboard.
- `public/_headers` caches `assets/` and `images/` for a year. That is only safe because every reference has
  a `?v=<content hash>`: never reference those files without one, and never rename the hashing away.
- One commit per logical change, with a message that says why.
