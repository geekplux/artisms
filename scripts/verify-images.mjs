#!/usr/bin/env node
// Checks every work's image against the live Wikimedia servers, building URLs the way
// assets/app.js does. Needs network access. Node 22+, no dependencies.
//
// Usage: node scripts/verify-images.mjs [--json report.json] [--only movement-id]
//
// Reports:
//   broken      URLs that do not return an image (Commons thumb and original both fail)
//   wiki        `wiki` titles that are missing, disambiguation pages, or have no lead image
//   non-free    `wiki` lead images hosted on en.wikipedia (fair use): shown as a placeholder
//               (mark such works `restricted: true` so the page stops looking them up)
//   suspicious  file names that share no words with the work's title (e.g. a photo of the artist)
// Exit code 1 if anything is broken or missing.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const THUMB_WIDTH = 960; // keep in sync with assets/app.js
const UA = "art-isms-verify/1.0 (https://github.com/geekplux/art-isms)";
const CONCURRENCY = 4;

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const jsonOut = opt("--json");
const only = opt("--only");

const file = fileURLToPath(new URL("../data/movements.js", import.meta.url));
const sandbox = { window: {} };
vm.runInNewContext(readFileSync(file, "utf8"), sandbox, { filename: file });
const D = sandbox.window.ARTISMS;

/* ── URL builders (mirror assets/app.js) ─────── */
function commons(path) {
  const name = path.split("/").pop();
  const ext = name.split(".").pop().toLowerCase();
  const thumbName = `${THUMB_WIDTH}px-${name}${ext === "svg" ? ".png" : ext === "tif" || ext === "tiff" ? ".jpg" : ""}`;
  return {
    thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${thumbName}`,
    orig: `https://upload.wikimedia.org/wikipedia/commons/${path}`,
    name: decodeURIComponent(name)
  };
}
const summaryUrl = (title) => `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
function leadImage(j) {
  const o = j.originalimage, th = j.thumbnail;
  if (o && o.width <= 1400) return o.source;
  if (th) return th.source.replace(/\/\d+px-/, `/${THUMB_WIDTH}px-`);
  return null;
}
const fileNameOf = (url) => decodeURIComponent((url.match(/\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/) || [])[1] || url.split("/").pop());

/* ── HTTP ────────────────────────────────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function request(url, { method = "GET", json = false } = {}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    let res;
    try {
      res = await fetch(url, { method, headers: { "User-Agent": UA, "Api-User-Agent": UA }, redirect: "follow" });
    } catch (e) {
      if (attempt === 4) return { ok: false, status: 0, error: e.cause?.code || e.message };
      await sleep(1000 * (attempt + 1));
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get("retry-after")) * 1000 || 2000 * (attempt + 1);
      await res.body?.cancel();
      await sleep(wait);
      continue;
    }
    const type = res.headers.get("content-type") || "";
    const body = json && res.ok ? await res.json() : (await res.body?.cancel(), null);
    return { ok: res.ok, status: res.status, type, body, url: res.url };
  }
  return { ok: false, status: 429, error: "rate limited" };
}
async function imageOk(url) {
  let r = await request(url, { method: "HEAD" });
  if (r.status === 405) r = await request(url);
  return { ...r, ok: r.ok && r.type.startsWith("image/") };
}
async function pool(items, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

/* ── Commons file info (size, existence), 50 titles per request ── */
async function commonsInfo(names) {
  const info = new Map();
  for (let i = 0; i < names.length; i += 50) {
    const titles = names.slice(i, i + 50).map((n) => "File:" + n).join("|");
    const r = await request(`https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=imageinfo&iiprop=size|mime&titles=${encodeURIComponent(titles)}`, { json: true });
    if (!r.ok) continue;
    const q = r.body.query || {};
    const alias = new Map();
    for (const n of q.normalized || []) alias.set(n.to, n.from);
    for (const rd of q.redirects || []) alias.set(rd.to, alias.get(rd.from) || rd.from);
    for (const p of q.pages || []) {
      const asked = (alias.get(p.title) || p.title).replace(/^File:/, "");
      info.set(asked, p.missing ? { missing: true } : { ...(p.imageinfo?.[0] || {}), canonical: p.title.replace(/^File:/, "") });
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
  "Klinom_Krasnym_Bej_Belych.JPG", "Triadisches_Ballett_by_Oskar_Schlemmer_-_Staatsgalerie_-_Stuttgart_-_Germany_2017_(cropped).jpg"
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
const works = D.movements.flatMap((m) => m.works.map((w, i) => ({ id: `${m.id}#${i + 1}`, m, w })))
  .filter((x) => !only || x.m.id === only);

const commonsNames = works.filter((x) => x.w.c).map((x) => commons(x.w.c).name);
const info = await commonsInfo(commonsNames);

let done = 0;
const results = await pool(works, async ({ id, w }) => {
  const r = { id, title: w.t.en, artist: w.a.en, kind: w.c ? "c" : w.img ? "img" : "wiki", issues: [], notes: [] };
  if (w.c) {
    const u = commons(w.c);
    const fi = info.get(u.name);
    r.file = u.name;
    if (fi?.missing) r.issues.push("Commons file does not exist");
    if (fi?.width) r.size = `${fi.width}×${fi.height}`;
    if (fi?.canonical && fi.canonical !== u.name.replace(/_/g, " ")) r.notes.push(`Commons redirects to File:${fi.canonical}`);
    const th = await imageOk(u.thumb);
    if (th.ok) r.loads = "thumb";
    else {
      const or = await imageOk(u.orig);
      if (or.ok) { r.loads = "original"; r.notes.push(`thumb ${th.status}${fi?.width && fi.width < THUMB_WIDTH ? ` (file is only ${fi.width}px wide)` : ""}, original OK`); }
      else r.issues.push(`broken: thumb ${th.status || th.error}, original ${or.status || or.error}`);
    }
    const n = nameCheck(u.name, w);
    if (n) r.suspicious = n;
  } else if (w.img) {
    r.file = w.img;
    const im = await imageOk(w.img);
    r.loads = im.ok ? "restricted-img" : null;
    if (!im.ok) r.notes.push(`restricted img URL returns ${im.status || im.error} (not shown anyway: SHOW_RESTRICTED_IMAGES=false)`);
  } else if (w.restricted) {
    // Placeholder only: the link it points to must exist.
    r.kind = "placeholder";
    const link = w.src || `https://en.wikipedia.org/wiki/${encodeURIComponent(w.wiki.replace(/ /g, "_"))}`;
    const s = w.wiki ? await request(summaryUrl(w.wiki), { json: true }) : await request(link);
    r.file = link;
    r.loads = s.ok || [401, 403, 429].includes(s.status) ? "placeholder" : null;
    if (!s.ok && [401, 403, 429].includes(s.status) && !w.wiki) r.notes.push(`could not check ${link}: host refuses scripts (HTTP ${s.status}); open it in a browser`);
    else if (!s.ok) r.issues.push(`placeholder link broken (HTTP ${s.status || s.error}): ${link}`);
    else if (w.wiki && s.body?.type === "disambiguation") r.issues.push(`wiki "${w.wiki}" is a disambiguation page`);
  } else {
    const s = await request(summaryUrl(w.wiki), { json: true });
    if (!s.ok) { r.issues.push(`wiki "${w.wiki}": no article (HTTP ${s.status || s.error})`); }
    else {
      const j = s.body;
      if (j.type === "disambiguation") r.issues.push(`wiki "${w.wiki}" is a disambiguation page`);
      if (j.titles?.canonical && j.titles.canonical.replace(/_/g, " ") !== w.wiki) r.notes.push(`wiki redirects to "${j.titles.canonical.replace(/_/g, " ")}"`);
      const src = leadImage(j);
      if (!src) r.issues.push(`wiki "${w.wiki}" has no lead image`);
      else {
        r.file = fileNameOf(src);
        if (j.originalimage) r.size = `${j.originalimage.width}×${j.originalimage.height}`;
        const free = /\/wikipedia\/commons\//.test(src);
        if (!free) { r.nonFree = true; r.notes.push("lead image is a non-free en.wikipedia file: page shows a placeholder"); }
        const im = await imageOk(src);
        if (im.ok) r.loads = free ? "wiki-commons" : "wiki-nonfree";
        else if (j.originalimage && (await imageOk(j.originalimage.source)).ok) { r.loads = "wiki-original"; r.notes.push(`lead thumb ${im.status}, original OK`); }
        else r.issues.push(`lead image broken (${im.status || im.error}): ${src}`);
        const n = nameCheck(r.file, w);
        if (n) r.suspicious = n;
      }
    }
  }
  if (process.stderr.isTTY) process.stderr.write(`\r${++done}/${works.length}`);
  return r;
});
if (process.stderr.isTTY) process.stderr.write("\n");

/* ── Report ──────────────────────────────────── */
const line = (r, extra) => `  ${r.id.padEnd(20)} ${r.title}${extra ? `\n  ${"".padEnd(20)} ${extra}` : ""}`;
const broken = results.filter((r) => r.issues.length);
const nonFree = results.filter((r) => r.nonFree);
const suspicious = results.filter((r) => r.suspicious);
const notes = results.filter((r) => r.notes.length && !r.nonFree);

const section = (title, list, fmt) => {
  console.log(`\n${title} (${list.length})`);
  if (!list.length) console.log("  none");
  list.forEach((r) => console.log(fmt(r)));
};
section("✗ Broken or missing", broken, (r) => line(r, r.issues.join("; ")));
section("◐ wiki lead image is non-free (placeholder shown)", nonFree, (r) => line(r, r.file));
section("? File name may not show the work (check by eye)", suspicious, (r) => line(r, `${r.suspicious}: ${r.file}`));
section("· Notes", notes, (r) => line(r, r.notes.join("; ")));

const count = (k) => results.filter((r) => r.loads === k).length;
console.log(`\n${results.length} works: ${count("thumb")} Commons thumb, ${count("original")} Commons original only, ` +
  `${count("wiki-commons") + count("wiki-original")} via Wikipedia (free), ${nonFree.length} via Wikipedia (non-free), ` +
  `${results.filter((r) => r.kind === "img").length} restricted img, ${count("placeholder")} placeholder link, ${broken.length} broken.`);

if (jsonOut) writeFileSync(jsonOut, JSON.stringify(results, null, 1));
process.exit(broken.length ? 1 : 0);
