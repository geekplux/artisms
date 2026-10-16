#!/usr/bin/env node
// Downloads every Commons image (works with a `c` path), resizes it and saves it as WebP:
//   public/images/<movement-id>/<n>.webp       long edge ≤ 1200px
//   public/images/<movement-id>/<n>-480.webp   long edge ≤ 480px
// Reads licence, author and file page from the Commons API (extmetadata) into each work's
// `image` field, then regenerates CREDITS.md. Works marked `restricted` are never downloaded.
//
// Usage: node scripts/fetch-images.mjs [--force] [--only movement-id]
// Needs network access, Node 22+ and `cwebp` (brew install webp / apt install webp).
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { loadData, saveData, SITE, ROOT, imagePath, commonsPage, contentHash } from "./lib/data.mjs";
import { creditsMarkdown } from "./lib/credits.mjs";

const LARGE = 1200, SMALL = 480, QUALITY = "80";
const UA = "art-isms-images/1.0 (https://github.com/geekplux/art-isms)";
const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;

try { execFileSync("cwebp", ["-version"], { stdio: "ignore" }); } catch { console.error("cwebp not found: install the webp package"); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, as = "json") {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return as === "json" ? res.json() : Buffer.from(await res.arrayBuffer());
    if (attempt < 4 && (res.status === 429 || res.status >= 500)) { await sleep(2000 * (attempt + 1)); continue; }
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
}

/* "Unknown authorUnknown author" → "Unknown author"; drop wiki prefixes and stray dashes. */
function cleanText(html) {
  if (!html) return "";
  let s = html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim().replace(/\s*[–-]\s*$/, "").replace(/^(w:)?User:/i, "").replace(/^w:/, "");
  s = s.replace(/\s+([,;:)])/g, "$1").replace(/\(\s+/g, "(").replace(/"\s*([^"]*?)\s*"/g, '"$1"')
    .replace(/^(.+?)\s*\1$/, "$1")      // "Unknown author Unknown author"
    .split(" – ")[0];                     // "Unknown – production", Google Art Project boilerplate
  return s.length > 60 ? s.split(/\s*[(,]/)[0] : s;
}

/* Where Commons has no Artist field and the uploader is not the photographer (from the file page). */
const AUTHOR_OVERRIDES = {
  "Hector_Guimard_Entrance_Pasteur_Paris_Metro.jpg": "Eugenia & Julian (Flickr)",
  "Autun_St_Lazare_Tympanon.jpg": "Lamettrie"
};

async function commonsInfo(c, longEdge, workArtist) {
  const title = "File:" + decodeURIComponent(c.split("/").pop()).replace(/_/g, " ");
  const base = "https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=imageinfo" +
    "&iiprop=url|size|user|extmetadata&iiextmetadatafilter=LicenseShortName|LicenseUrl|Artist|Attribution|UsageTerms";
  const first = await get(`${base}&titles=${encodeURIComponent(title)}`);
  const page = first.query.pages[0];
  if (page.missing) throw new Error(`Commons file missing: ${title}`);
  const ii = page.imageinfo[0];
  // Ask for a thumbnail whose long edge is at least `longEdge`; Commons rounds up to a standard width.
  let download = ii.url;
  if (Math.max(ii.width, ii.height) > longEdge) {
    const width = Math.ceil(longEdge * ii.width / Math.max(ii.width, ii.height));
    const t = await get(`${base}&iiurlwidth=${width}&titles=${encodeURIComponent(page.title)}`);
    download = t.query.pages[0].imageinfo[0].thumburl || ii.url;
  }
  const m = ii.extmetadata || {};
  const v = (k) => m[k]?.value;
  return {
    download,
    width: ii.width, height: ii.height,
    page: ii.descriptionurl || commonsPage(c),
    license: cleanText(v("LicenseShortName")) || cleanText(v("UsageTerms")) || "See file page",
    licenseUrl: v("LicenseUrl") || null,
    // No Artist on file: a public-domain file is credited to the work's artist, anything else to its uploader.
    author: AUTHOR_OVERRIDES[decodeURIComponent(c.split("/").pop())] || cleanText(v("Attribution")) || cleanText(v("Artist")) ||
      (/^(public domain|cc0|no restrictions)/i.test(cleanText(v("LicenseShortName"))) ? workArtist : `Uploaded by ${ii.user}`)
  };
}

const webp = (input, output, edge, landscape) =>
  execFileSync("cwebp", ["-quiet", "-q", QUALITY, "-m", "6", "-metadata", "none",
    "-resize", String(landscape ? edge : 0), String(landscape ? 0 : edge), input, "-o", output]);

const dims = (file) => {
  const out = execFileSync("webpinfo", [file], { encoding: "utf8" });
  const w = +out.match(/Width:\s*(\d+)/)[1], h = +out.match(/Height:\s*(\d+)/)[1];
  return [w, h];
};

const D = loadData();
const tmp = mkdtempSync(join(tmpdir(), "art-isms-"));
let fetched = 0, skipped = 0;
try {
  for (const m of D.movements) {
    if (only && m.id !== only) continue;
    for (const [i, w] of m.works.entries()) {
      const n = i + 1;
      if (!w.c) { delete w.image; continue; }
      const large = join(SITE, imagePath(m.id, n)), small = join(SITE, imagePath(m.id, n, true));
      const info = await commonsInfo(w.c, LARGE, w.a.en);
      const landscape = info.width >= info.height;
      // Re-download when files are missing or the work now points at a different Commons file.
      if (force || !existsSync(large) || !existsSync(small) || w.image?.page !== info.page) {
        mkdirSync(dirname(large), { recursive: true });
        const ext = (info.download.split("?")[0].match(/\.(\w+)$/) || [, "jpg"])[1];
        const src = join(tmp, `${m.id}-${n}.${ext}`);
        writeFileSync(src, await get(info.download, "buffer"));
        // Never upscale: a file smaller than the target keeps its own size.
        const longEdge = Math.max(info.width, info.height);
        webp(src, large, Math.min(LARGE, longEdge), landscape);
        webp(src, small, Math.min(SMALL, longEdge), landscape);
        fetched++;
        process.stdout.write(`  ✓ ${m.id}#${n}  ${info.license}\n`);
      } else skipped++;
      const [iw, ih] = dims(large);
      w.image = { w: iw, h: ih, v: contentHash(readFileSync(large), readFileSync(small)), author: info.author, license: info.license, licenseUrl: info.licenseUrl, page: info.page };
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
saveData(D);
writeFileSync(join(ROOT, "CREDITS.md"), creditsMarkdown(D));
console.log(`${fetched} downloaded, ${skipped} already present. Updated public/data/movements.js and CREDITS.md.`);
