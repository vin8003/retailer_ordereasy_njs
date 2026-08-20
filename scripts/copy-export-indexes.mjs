#!/usr/bin/env node
/**
 * Next 16 `output: 'export'` writes both `path.html` and a `path/` RSC
 * directory (no index.html). `npx serve -s` then treats the directory as
 * the route, misses an index, and falls back to root index.html (Overview).
 *
 * Copy each colliding `foo.html` to `foo/index.html` so a direct GET of
 * /dashboard/orders/details (and the same for other app routes) serves
 * that page. RSC .txt files are left untouched. After this copy, `serve -s`
 * is fine — it finds the directory index instead of falling back.
 *
 * KAN-55 also requires Profile in this fallback (hard-refresh of
 * /dashboard/profile must keep serving the Profile shell, not Overview).
 */
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const out = join(process.cwd(), "out");

/** Explicit KAN-55 indexes. Walk still copies every other html+dir pair. */
const ENSURE = [
  "dashboard/profile",
  "dashboard/orders",
  "dashboard/orders/details",
  "dashboard/customers/details",
];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "_next" || name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

if (!existsSync(out)) {
  console.error("copy-export-indexes: no out/ directory");
  process.exit(1);
}

function copyIndex(htmlFile, destDir) {
  if (!existsSync(htmlFile) || !existsSync(destDir) || !statSync(destDir).isDirectory()) {
    return false;
  }
  copyFileSync(htmlFile, join(destDir, "index.html"));
  return true;
}

let copied = 0;
for (const rel of ENSURE) {
  if (copyIndex(join(out, `${rel}.html`), join(out, rel))) copied += 1;
}

for (const file of walk(out)) {
  if (!file.endsWith(".html")) continue;
  const base = file.slice(0, -".html".length);
  if (base.endsWith("/index") || file.endsWith("/404.html")) continue;
  const siblingDir = base;
  if (!existsSync(siblingDir) || !statSync(siblingDir).isDirectory()) continue;
  const dest = join(siblingDir, "index.html");
  copyFileSync(file, dest);
  copied += 1;
}
console.log(`copy-export-indexes: wrote ${copied} directory indexes under out/`);
