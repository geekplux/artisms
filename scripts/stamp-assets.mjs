#!/usr/bin/env node
// Writes a content hash into every assets/ reference in public/index.html, e.g. assets/app.js?v=1a2b3c4d5e,
// so public/_headers can cache assets/ for a year: a changed file gets a new URL.
// Usage: node scripts/stamp-assets.mjs   (check-data fails while a stamp is stale)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, contentHash } from "./lib/data.mjs";

const INDEX = join(SITE, "index.html");
const REF = /((?:src|href)=")(assets\/[^"?]+)(?:\?v=[0-9a-f]*)?(")/g;
const stamp = (path) => contentHash(readFileSync(join(SITE, path)));

/* assets/ files referenced from index.html whose ?v= is missing or out of date. */
export function staleStamps() {
  const html = readFileSync(INDEX, "utf8");
  return [...html.matchAll(/(?:src|href)="(assets\/[^"?]+)(?:\?v=([0-9a-f]*))?"/g)]
    .filter(([, path, v]) => v !== stamp(path)).map(([, path]) => path);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const html = readFileSync(INDEX, "utf8");
  writeFileSync(INDEX, html.replace(REF, (_, pre, path, post) => `${pre}${path}?v=${stamp(path)}${post}`));
  console.log("Stamped:", [...html.matchAll(REF)].map((m) => m[2]).join(", "));
}
