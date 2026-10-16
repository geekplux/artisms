// Shared helpers for the scripts: load and save data/movements.js without changing its formatting.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const SITE = ROOT + "public/"; // the folder that gets deployed; nothing outside it is uploaded
export const DATA_FILE = SITE + "data/movements.js";

const PREFIX = "window.ARTISMS = ";

export function loadData() {
  const src = readFileSync(DATA_FILE, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(src, sandbox, { filename: DATA_FILE });
  return sandbox.window.ARTISMS;
}

export function saveData(D) {
  const src = readFileSync(DATA_FILE, "utf8");
  const head = src.slice(0, src.indexOf(PREFIX));
  writeFileSync(DATA_FILE, head + PREFIX + JSON.stringify(D, null, 1) + ";\n");
}

/* Where a hosted work's files live, relative to the site root. n is 1-based. */
export const imagePath = (movementId, n, small = false) => `images/${movementId}/${n}${small ? "-480" : ""}.webp`;

/* Short content hash used as ?v= so files can be cached for a year and still update when they change. */
export const contentHash = (...buffers) => {
  const h = createHash("sha256");
  for (const b of buffers) h.update(b);
  return h.digest("hex").slice(0, 10);
};

/* Commons file page for a `c` path like "e/ea/Name.jpg". */
export const commonsPage = (c) => `https://commons.wikimedia.org/wiki/File:${c.split("/").pop()}`;
