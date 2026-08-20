#!/usr/bin/env node
/**
 * Next 16 `output: 'export'` writes both `path.html` and a `path/` RSC
 * directory (no index.html). Static hosts and `serve -s` then treat the
 * directory as the route, miss an index, and fall back to `/` (Overview).
 *
 * Copy each colliding `foo.html` to `foo/index.html` so a direct GET of
 * /dashboard/orders/details (and the same for other app routes) serves
 * that page. Do not use `serve -s` for this export — it always returns
 * the root index and paints Overview on every deep link.
 */
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";

const out = join(process.cwd(), "out");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
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

let copied = 0;
for (const file of walk(out)) {
  if (!file.endsWith(".html")) continue;
  const siblingDir = file.slice(0, -".html".length);
  if (!existsSync(siblingDir) || !statSync(siblingDir).isDirectory()) continue;
  const dest = join(siblingDir, "index.html");
  copyFileSync(file, dest);
  copied += 1;
}
console.log(`copy-export-indexes: wrote ${copied} directory indexes under out/`);
