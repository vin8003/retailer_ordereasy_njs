#!/usr/bin/env node
/**
 * Next 16 `output: 'export'` writes both `path.html` and a `path/` RSC
 * directory (no index.html). `npx serve -s` then treats the directory as
 * the route, misses an index, and falls back to root index.html (Overview).
 *
 * Copy each colliding `foo.html` to `foo/index.html` so a directory GET
 * can serve that page. RSC .txt files are left untouched.
 *
 * Then emit out/serve.json so `npx serve out` (no -s) returns that
 * index.html for both slashed and unslashed directory URLs.
 *
 * Do NOT set serve trailingSlash:
 *   - true  → 301 /details?id=2650 → /details/ and drops search (serve-handler
 *             shouldRedirect uses pathname only; Location has no query. PR
 *             vercel/serve-handler#232 is still unmerged.)
 *   - false → 301 /dashboard/profile/ → /dashboard/profile and breaks the
 *             slashed Profile hard-refresh PASS.
 * Omit the key so there is no slash 301. Rewrites + cleanUrls serve
 * index.html in place; the browser keeps search and hash.
 * directoryListing:false so a slashed dir is the page, not a listing.
 * Do NOT use `serve -s`.
 */
import { copyFileSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

/** Next 16 prepends async chunk <script> tags in <head>. The KAN-55 IIFE
 *  must be the first <script> so it captures location.search onto
 *  window.__OE_SEARCH before any Next JS can run or wipe the query. */
const OE_IIFE_RE = /<script>\(function\(\)\{\s*var p=location\.pathname[\s\S]*?\}\)\(\);<\/script>/;

function hoistOeIife(html) {
  const m = html.match(OE_IIFE_RE);
  if (!m) return html;
  const iife = m[0];
  const without = html.replace(OE_IIFE_RE, "");
  if (without.includes("<head>" + iife) || without.startsWith(iife)) return without;
  if (without.includes("<head>")) return without.replace("<head>", "<head>" + iife);
  return iife + without;
}

const out = join(process.cwd(), "out");

function walkFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "_next" || name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkFiles(p, acc);
    else acc.push(p);
  }
  return acc;
}

function collectIndexDirs(dir, acc = []) {
  if (existsSync(join(dir, "index.html"))) acc.push(dir);
  for (const name of readdirSync(dir)) {
    if (name === "_next" || name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) collectIndexDirs(p, acc);
  }
  return acc;
}

if (!existsSync(out)) {
  console.error("copy-export-indexes: no out/ directory");
  process.exit(1);
}

let copied = 0;
for (const file of walkFiles(out)) {
  if (!file.endsWith(".html")) continue;
  const base = file.slice(0, -".html".length);
  if (base.endsWith("/index") || file.endsWith("/404.html")) continue;
  const siblingDir = base;
  if (!existsSync(siblingDir) || !statSync(siblingDir).isDirectory()) continue;
  const dest = join(siblingDir, "index.html");
  copyFileSync(file, dest);
  copied += 1;
}

// One rewrite per exported folder. Unslashed source matches both
// /details and /details/ because serve-handler resolves the request
// pathname before matching. Destination is the real index.html so the
// response is in-place (no 301) and the browser keeps ?search and #hash.
const rewrites = [];
for (const dir of collectIndexDirs(out)) {
  const rel = relative(out, dir).replaceAll("\\", "/");
  if (rel === "" || rel === ".") continue;
  const url = `/${rel}`;
  rewrites.push({ source: url, destination: `${url}/index.html` });
}
rewrites.sort((a, b) => b.source.length - a.source.length || a.source.localeCompare(b.source));

const serveConfig = {
  cleanUrls: true,
  directoryListing: false,
  rewrites,
};
writeFileSync(join(out, "serve.json"), JSON.stringify(serveConfig, null, 2) + "\n");

let hoisted = 0;
for (const file of walkFiles(out)) {
  if (!file.endsWith(".html")) continue;
  const html = readFileSync(file, "utf8");
  const next = hoistOeIife(html);
  if (next !== html) {
    writeFileSync(file, next);
    hoisted += 1;
  }
}

console.log(`copy-export-indexes: wrote ${copied} directory indexes and ${rewrites.length} serve rewrites; hoisted IIFE in ${hoisted} html`);
