#!/usr/bin/env node
// Writes crawlable, static HTML generated from the data into public/index.html, between markers:
//   <!-- seo:jsonld -->     JSON-LD: the WebSite and an ItemList of every style
//   <!-- seo:toc -->        the table of contents (links to every style)
//   <!-- seo:movements -->  every style's name, dates, idea, summary and works (English)
// assets/app.js replaces the TOC and sections when it runs; crawlers and link previews that don't run
// JavaScript still see the content. check-data fails while these blocks are out of date.
// Usage: node scripts/seo.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadData, SITE } from "./lib/data.mjs";

export const ORIGIN = "https://artisms.geekplux.com/";
const INDEX = join(SITE, "index.html");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (i) => String(i + 1).padStart(2, "0");

function blocks(D) {
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite", "@id": ORIGIN + "#website", url: ORIGIN, name: "Art-isms", alternateName: "艺术流派志",
        description: "A visual atlas of 40 art styles: a 45,000-year timeline, how each style grew from the last, and three real works for every style. In English and Chinese.",
        inLanguage: ["en", "zh-Hans"], isAccessibleForFree: true,
        about: [{ "@type": "Thing", name: "Art history" }, { "@type": "Thing", name: "Art movements" }, { "@type": "Thing", name: "Timeline" }],
        license: "https://creativecommons.org/licenses/by-sa/4.0/",
        creator: { "@type": "Person", name: "GeekPlux", url: "https://geekplux.com/", sameAs: ["https://github.com/geekplux"] },
        codeRepository: "https://github.com/geekplux/artisms"
      },
      {
        "@type": "ItemList", "@id": ORIGIN + "#styles", name: "Art styles", numberOfItems: D.movements.length,
        itemListElement: D.movements.map((m, i) => ({ "@type": "ListItem", position: i + 1, name: m.name.en, url: ORIGIN + "#" + m.id }))
      }
    ]
  };
  // "</" is escaped so the JSON can never close the script element early.
  const jsonld = `<script type="application/ld+json">${JSON.stringify(ld).replace(/<\//g, "<\\/")}</script>`;
  const toc = D.movements.map((m, i) =>
    `<li><a href="#${m.id}"><span class="idx">${num(i)}</span><span><b>${esc(m.name.en)}</b><small>${esc(m.years.en)}</small></span></a></li>`).join("\n");
  const movements = D.movements.map((m, i) => `<section class="mv" id="${m.id}">
  <div class="mv-head"><p class="idx">${num(i)}</p><div><h2>${esc(m.name.en)}</h2><p class="meta-row"><span class="yrs">${esc(m.years.en)}</span> <span>${esc(m.region.en)}</span></p><p class="idea">${esc(m.idea.en)}</p></div></div>
  <div class="mv-body"><p class="summary">${esc(m.summary.en)}</p></div>
  <ul class="seo-works">${m.works.map((w) => `<li><b>${esc(w.t.en)}</b>, ${esc(w.a.en)}, ${esc(w.y.en)}${w.loc ? `. ${esc(w.loc.en)}` : ""}</li>`).join("")}</ul>
</section>`).join("\n");
  return { jsonld, toc, movements };
}

const marker = (name) => new RegExp(`(<!-- seo:${name} -->)[\\s\\S]*?(<!-- /seo:${name} -->)`);

/* Names of generated blocks in index.html that don't match the data (or are missing). */
export function staleSeo(D = loadData()) {
  const html = readFileSync(INDEX, "utf8"), b = blocks(D);
  return Object.keys(b).filter((name) => {
    const m = html.match(marker(name));
    return !m || m[0] !== `<!-- seo:${name} -->\n${b[name]}\n<!-- /seo:${name} -->`;
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const b = blocks(loadData());
  let html = readFileSync(INDEX, "utf8");
  for (const [name, content] of Object.entries(b)) {
    if (!marker(name).test(html)) { console.error(`index.html has no <!-- seo:${name} --> … <!-- /seo:${name} --> markers`); process.exit(1); }
    html = html.replace(marker(name), () => `<!-- seo:${name} -->\n${content}\n<!-- /seo:${name} -->`);
  }
  writeFileSync(INDEX, html);
  console.log("Wrote", Object.keys(b).join(", "), "into public/index.html");
}
