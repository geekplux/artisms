#!/usr/bin/env node
// Validates public/data/movements.js: ids, links, bilingual fields, image sources, hosted files,
// CREDITS.md and the ?v= cache stamps in public/index.html.
// Usage: node scripts/check-data.mjs   (no dependencies, no network)
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadData, SITE, ROOT, imagePath, contentHash } from "./lib/data.mjs";
import { creditsMarkdown } from "./lib/credits.mjs";
import { staleStamps } from "./stamp-assets.mjs";
import { staleSeo } from "./seo.mjs";

const D = loadData();

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const bi = (where, o, field) => {
  if (!o || typeof o.en !== "string" || typeof o.zh !== "string" || !o.en.trim() || !o.zh.trim()) fail(where, `${field} needs non-empty "en" and "zh"`);
};

if (!D) { console.error("window.ARTISMS is not defined"); process.exit(1); }
const eras = new Set(D.eras.map((e) => e.id));
const groups = new Set(D.groups.map((g) => g.id));
const ids = new Set();
for (const m of D.movements) {
  if (ids.has(m.id)) fail(m.id, "duplicate id");
  ids.add(m.id);
}

let prevStart = -Infinity;
for (const m of D.movements) {
  const at = `movement "${m.id}"`;
  if (!/^[a-z][a-z0-9-]*$/.test(m.id)) fail(at, "id must be lowercase letters, digits and dashes");
  if (!eras.has(m.era)) fail(at, `unknown era "${m.era}"`);
  if (!groups.has(m.group)) fail(at, `unknown group "${m.group}"`);
  if (!(m.start < m.end)) fail(at, "start must be before end");
  if (m.start < prevStart) fail(at, "movements must be sorted by start year");
  prevStart = m.start;
  for (const f of ["name", "years", "region", "idea", "summary"]) bi(at, m[f], f);
  if (!m.traits || !Array.isArray(m.traits.en) || !Array.isArray(m.traits.zh) || m.traits.en.length !== m.traits.zh.length || !m.traits.en.length) fail(at, "traits need matching en/zh lists");
  for (const r of [...m.from, ...m.to]) if (!ids.has(r)) fail(at, `links to unknown movement "${r}"`);
  for (const r of m.to) if (!ids.has(r) || !D.movements.find((x) => x.id === r).from.includes(m.id)) fail(at, `"to: ${r}" has no matching "from: ${m.id}"`);
  if (m.works.length !== 3) fail(at, `has ${m.works.length} works, expected 3`);
  m.works.forEach((w, i) => {
    const wat = `${at} work ${i + 1}`;
    for (const f of ["t", "a", "y", "look"]) bi(wat, w[f], f);
    if (w.loc) bi(wat, w.loc, "loc");
    if (w.n) bi(wat, w.n, "n");
    if (!w.c && !w.restricted) fail(wat, "needs a Commons source (c) or restricted: true with img, wiki or src");
    if (w.c && w.restricted) fail(wat, "Commons files are hosted; do not mark them restricted");
    if (w.restricted && !w.img && !w.wiki && !w.src) fail(wat, "restricted works need a link: img + src, wiki or src");
    if (w.img && !w.restricted) fail(wat, "non-Commons img URLs must be marked restricted: true");
    if (w.c && !/^[0-9a-f]\/[0-9a-f]{2}\/[^/]+$/.test(w.c)) fail(wat, `malformed Commons path "${w.c}"`);
    if (w.src && !/^https:\/\//.test(w.src)) fail(wat, "src must be an https URL");
    if (!w.wiki) fail(wat, "needs wiki: the English Wikipedia article its title links to");
    if (w.zhwiki !== undefined && (typeof w.zhwiki !== "string" || !w.zhwiki.trim())) fail(wat, "zhwiki must be a Chinese Wikipedia article title");
    if (w.c) {
      const im = w.image;
      if (!im) fail(wat, "Commons work has no image metadata: run node scripts/fetch-images.mjs");
      else {
        for (const k of ["author", "license", "page"]) if (!im[k]) fail(wat, `image.${k} is missing`);
        if (!(im.w > 0 && im.h > 0)) fail(wat, "image.w and image.h must be positive");
      }
      const files = [false, true].map((small) => join(SITE, imagePath(m.id, i + 1, small)));
      const missing = files.filter((f) => !existsSync(f));
      for (const f of missing) fail(wat, `missing ${f.slice(SITE.length)}: run node scripts/fetch-images.mjs`);
      if (im && !missing.length && im.v !== contentHash(...files.map((f) => readFileSync(f)))) fail(wat, "image.v does not match the files: run node scripts/fetch-images.mjs");
    } else if (w.image) fail(wat, "only Commons works may have image metadata");
  });
}
for (const e of D.engines) for (const r of e.ex) if (!ids.has(r)) fail("engines", `unknown movement "${r}"`);
for (const n of D.nicknames) if (!ids.has(n.id)) fail("nicknames", `unknown movement "${n.id}"`);

const creditsFile = join(ROOT, "CREDITS.md");
if (!existsSync(creditsFile) || readFileSync(creditsFile, "utf8") !== creditsMarkdown(D)) fail("CREDITS.md", "out of date: run node scripts/fetch-images.mjs");

for (const s of staleSeo(D)) fail("public/index.html", `generated ${s} block is out of date: run node scripts/seo.mjs`);
for (const s of staleStamps()) fail("public/index.html", `${s} has a stale ?v= stamp: run node scripts/stamp-assets.mjs`);

const works = D.movements.reduce((n, m) => n + m.works.length, 0);
const hosted = D.movements.reduce((n, m) => n + m.works.filter((w) => w.image).length, 0);
if (errors.length) {
  console.error(errors.map((e) => "✗ " + e).join("\n"));
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log(`✓ ${D.movements.length} movements, ${works} works (${hosted} images hosted), all checks passed.`);
