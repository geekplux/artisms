#!/usr/bin/env node
// Checks every work's image and links. Needs network access. Node 22+, no dependencies.
//
// Usage: node scripts/verify-images.mjs [--json report.json] [--only movement-id]
//
// Hosted works (`c` + `image`):
//   - both WebP files exist, are valid, and the large one matches image.w × image.h
//   - the Commons source file still exists and its licence still matches the data
//   - the file name plausibly shows the work (flags e.g. a photo of the artist; check by eye)
// Placeholders (`restricted`): the article or museum link they point to exists.
// `wiki` titles: the article exists and is not a disambiguation page.
// Exit code 1 if anything is broken or missing.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadData, SITE, imagePath } from "./lib/data.mjs";

const UA = "art-isms-verify/1.0 (https://github.com/geekplux/artisms)";
const CONCURRENCY = 4;

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const jsonOut = opt("--json");
const only = opt("--only");
const D = loadData();

/* ── HTTP ────────────────────────────────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function request(url, { json = false } = {}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA }, redirect: "follow" });
    } catch (e) {
      if (attempt === 4) return { ok: false, status: 0, error: e.cause?.code || e.message };
      await sleep(1000 * (attempt + 1));
      continue;
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      const wait = Number(res.headers.get("retry-after")) * 1000 || 2000 * (attempt + 1);
      await res.body?.cancel();
      await sleep(wait);
      continue;
    }
    const body = json && res.ok ? await res.json() : (await res.body?.cancel(), null);
    return { ok: res.ok, status: res.status, body };
  }
  return { ok: false, status: 429, error: "rate limited" };
}
async function pool(items, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}
const summaryUrl = (title, wiki = "en") => `https://${wiki}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;

/* ── WebP header: width × height (VP8, VP8L or VP8X) ── */
function webpSize(file) {
  const b = readFileSync(file);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (chunk === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (chunk === "VP8L") { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
  return null;
}

/* ── Commons file info, 50 titles per request ── */
async function commonsInfo(names) {
  const info = new Map();
  for (let i = 0; i < names.length; i += 50) {
    const titles = names.slice(i, i + 50).map((n) => "File:" + n).join("|");
    const r = await request(`https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=imageinfo&iiprop=size|extmetadata&iiextmetadatafilter=LicenseShortName&titles=${encodeURIComponent(titles)}`, { json: true });
    if (!r.ok) continue;
    const q = r.body.query || {};
    const alias = new Map();
    for (const n of q.normalized || []) alias.set(n.to, n.from);
    for (const rd of q.redirects || []) alias.set(rd.to, alias.get(rd.from) || rd.from);
    for (const p of q.pages || []) {
      const asked = (alias.get(p.title) || p.title).replace(/^File:/, "");
      const ii = p.imageinfo?.[0] || {};
      info.set(asked, p.missing ? { missing: true } : { license: ii.extmetadata?.LicenseShortName?.value, canonical: p.title.replace(/^File:/, "") });
    }
  }
  return info;
}

/* ── Name heuristic ──────────────────────────── */
const STOP = new Set("the a an of and in on at by with from to for de del della di du la le les el los das der die und et en von van da il lo y or no art museum gallery project google jpg jpeg png tif tiff svg file detail wga crop cropped version edit".split(" "));
const words = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/%[0-9a-f]{2}/gi, " ").split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w));
const stem = (w) => w.replace(/(ies|es|s)$/, "");
// File names already checked by eye against the work (non-English titles and the like).
const REVIEWED = new Set([
  "Nofretete_Neues_Museum.jpg", "Hopi_Pueblo_(Native_American)._Kachina_Doll_(Pahlikmana),_late_19th_century.jpg",
  "Tsunami_by_hokusai_19th_century.jpg", "Gustave_Courbet_-_The_Stonebreakers_-_WGA05457.jpg",
  "Edgar_Degas_-_La_Classe_de_danse.jpg", "Gustav_Klimt_-_Der_Kuss_(Liebespaar)_-_912_-_Österreichische_Galerie_Belvedere.jpg",
  "Klinom_Krasnym_Bej_Belych.JPG", "Triadisches_Ballett_by_Oskar_Schlemmer_-_Staatsgalerie_-_Stuttgart_-_Germany_2017_(cropped).jpg",
  "Arte_yoruba,_nigeria,_testa_da_ife,_12-15mo_secolo.JPG", "Paintings_from_the_Chauvet_cave_(museum_replica).jpg",
  "Bonheur_Matisse.jpg", "Detroit_Institute_of_Arts_2025b.jpg"
]);
function nameCheck(fileName, w) {
  if (REVIEWED.has(fileName.replace(/ /g, "_"))) return null;
  const f = new Set(words(fileName).map(stem));
  const title = new Set(words(w.t.en + " " + (w.wiki || "")).map(stem));
  const artist = new Set(words(w.a.en).map(stem));
  const hitsTitle = [...title].filter((x) => f.has(x));
  const hitsArtist = [...artist].filter((x) => f.has(x));
  const portraitish = /(portrait|photo|photograph|headshot|self|bust_of|in_his_studio|in_her_studio|signature|logo|poster_for|exhibition|\d{4}_\d{2}_\d{2})/i.test(fileName) &&
    !/(portrait|self|photo|bust|poster)/i.test(w.t.en);
  if (portraitish && !hitsTitle.length) return "file name looks like a person/photo, not the work";
  if (!hitsTitle.length && hitsArtist.length) return "file name names the artist but not the work";
  if (!hitsTitle.length) return "file name shares no words with the title";
  return null;
}

/* ── Run ─────────────────────────────────────── */
const works = D.movements.flatMap((m) => m.works.map((w, i) => ({ id: `${m.id}#${i + 1}`, m, w, n: i + 1 })))
  .filter((x) => !only || x.m.id === only);
const fileName = (c) => decodeURIComponent(c.split("/").pop());
const info = await commonsInfo(works.filter((x) => x.w.c).map((x) => fileName(x.w.c)));

let done = 0;
async function checkWiki(r, title, wiki) {
  const s = await request(summaryUrl(title, wiki), { json: true });
  if (!s.ok) r.issues.push(`${wiki}.wikipedia "${title}": no article (HTTP ${s.status || s.error})`);
  else if (s.body?.type === "disambiguation") r.issues.push(`${wiki}.wikipedia "${title}" is a disambiguation page`);
  else if (s.body?.titles?.canonical && s.body.titles.canonical.replace(/_/g, " ") !== title) r.notes.push(`${wiki}.wikipedia "${title}" redirects to "${s.body.titles.canonical.replace(/_/g, " ")}"`);
}
const results = await pool(works, async ({ id, m, w, n }) => {
  const r = { id, title: w.t.en, artist: w.a.en, kind: w.c ? "hosted" : "placeholder", issues: [], notes: [] };
  if (w.c) {
    const name = fileName(w.c);
    r.file = name;
    const fi = info.get(name);
    if (!fi) r.notes.push("could not reach the Commons API for this file");
    else if (fi.missing) r.issues.push(`Commons file no longer exists: ${name}`);
    else if (w.image && fi.license && fi.license !== w.image.license) r.issues.push(`licence on Commons is now "${fi.license}", data says "${w.image.license}": re-run fetch-images`);
    for (const small of [false, true]) {
      const path = imagePath(m.id, n, small), abs = join(SITE, path);
      if (!existsSync(abs)) { r.issues.push(`missing ${path}`); continue; }
      const size = webpSize(abs);
      if (!size) r.issues.push(`${path} is not a valid WebP`);
      else if (!small && w.image && (size[0] !== w.image.w || size[1] !== w.image.h)) r.issues.push(`${path} is ${size.join("×")}, data says ${w.image.w}×${w.image.h}`);
    }
    const nc = nameCheck(name, w);
    if (nc) r.suspicious = nc;
  } else if (w.src) {
    const s = await request(w.src);
    r.file = w.src;
    if (!s.ok && [401, 403, 429].includes(s.status)) r.notes.push(`could not check ${w.src}: host refuses scripts (HTTP ${s.status}); open it in a browser`);
    else if (!s.ok) r.issues.push(`placeholder link broken (HTTP ${s.status || s.error}): ${w.src}`);
  }
  if (w.wiki) await checkWiki(r, w.wiki, "en");
  if (w.zhwiki) await checkWiki(r, w.zhwiki, "zh");
  if (process.stderr.isTTY) process.stderr.write(`\r${++done}/${works.length}`);
  return r;
});
if (process.stderr.isTTY) process.stderr.write("\n");

/* ── Report ──────────────────────────────────── */
const line = (r, extra) => `  ${r.id.padEnd(20)} ${r.title}${extra ? `\n  ${"".padEnd(20)} ${extra}` : ""}`;
const broken = results.filter((r) => r.issues.length);
const suspicious = results.filter((r) => r.suspicious);
const notes = results.filter((r) => r.notes.length);
const section = (title, list, fmt) => {
  console.log(`\n${title} (${list.length})`);
  if (!list.length) console.log("  none");
  list.forEach((r) => console.log(fmt(r)));
};
section("✗ Broken or missing", broken, (r) => line(r, r.issues.join("; ")));
section("? File name may not show the work (check by eye)", suspicious, (r) => line(r, `${r.suspicious}: ${r.file}`));
section("· Notes", notes, (r) => line(r, r.notes.join("; ")));
console.log(`\n${results.length} works: ${results.filter((r) => r.kind === "hosted").length} hosted, ` +
  `${results.filter((r) => r.kind === "placeholder").length} placeholders, ${broken.length} with problems.`);

if (jsonOut) writeFileSync(jsonOut, JSON.stringify(results, null, 1));
process.exit(broken.length ? 1 : 0);
