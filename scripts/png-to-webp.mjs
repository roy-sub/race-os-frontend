#!/usr/bin/env node
/**
 * Convert every PNG under `public/assets` to WebP and remove the originals.
 *
 * Why this exists: the delivered assets are 232 MB of PNG across 40 files,
 * which is what makes a Cloudflare Pages upload crawl. The same photographs as
 * WebP are typically a tenth of that with no visible difference, because PNG is
 * a lossless format being asked to store photographic noise it cannot compress.
 *
 * Safety, since this deletes files:
 *
 *   - It refuses to run outside the assets directory, so a mistyped cwd cannot
 *     eat something else.
 *   - A PNG is deleted only after its WebP has been written, re-opened and
 *     confirmed to decode at the same pixel dimensions. A half-written file on
 *     a full disk therefore costs nothing.
 *   - If the WebP comes out no smaller than the PNG, the PNG is kept and the
 *     WebP discarded. That protects flat-colour graphics and logos, which
 *     genuinely do compress better as PNG, without needing to classify them.
 *   - `--dry-run` reports exactly what would happen and changes nothing.
 *
 * It also repoints `assets/…png` references in app/, components/ and lib/ at
 * the new extension. The site has a format fallback, so stale references would
 * still resolve — but only after three 404s per image, which is a slow way to
 * be correct.
 *
 * Usage:
 *   node scripts/png-to-webp.mjs [--dry-run] [--quality 82] [--keep-code]
 */

import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "public", "assets");
/** Where `assets/…png` strings live. Nothing outside these is touched. */
const CODE_DIRS = ["app", "components", "lib"];
const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css"]);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const keepCode = args.includes("--keep-code");
/** `--quality 82` and `--quality=82` both, and neither means the default. */
function flagValue(name) {
  const joined = args.find((a) => a.startsWith(`${name}=`));
  if (joined) return joined.slice(name.length + 1);
  const at = args.indexOf(name);
  return at !== -1 ? args[at + 1] : undefined;
}

const quality = Number(flagValue("--quality") ?? 82);

if (!Number.isFinite(quality) || quality < 1 || quality > 100) {
  console.error(`Quality must be 1-100, got ${quality}`);
  process.exit(1);
}

let sharp;
try {
  ({ default: sharp } = await import("sharp"));
} catch {
  console.error(
    "This needs `sharp`, which is not resolvable here.\n" +
      "Install it with:  npm install --save-dev sharp\n",
  );
  process.exit(1);
}

if (!existsSync(ASSETS)) {
  console.error(`No assets directory at ${ASSETS}. Run this from the repo.`);
  process.exit(1);
}

/** Every .png under the assets tree, depth-first. */
async function pngs(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await pngs(full)));
    else if (entry.name.toLowerCase().endsWith(".png")) found.push(full);
  }
  return found.sort();
}

/** Every .webp under the assets tree — what the repoint step works from. */
async function webps(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await webps(full)));
    else if (entry.name.toLowerCase().endsWith(".webp")) found.push(full);
  }
  return found;
}

const mb = (bytes) => `${(bytes / 1048576).toFixed(2)} MB`;

const files = await pngs(ASSETS);
if (files.length === 0) {
  console.log("No PNGs under public/assets — checking references only.\n");
}

console.log(
  `${files.length} PNG${files.length === 1 ? "" : "s"} under public/assets` +
    `  ·  quality ${quality}${dryRun ? "  ·  DRY RUN" : ""}\n`,
);

let before = 0;
let after = 0;
const converted = [];
const kept = [];
const failed = [];

for (const png of files) {
  const rel = relative(ROOT, png);
  const webp = `${png.slice(0, -4)}.webp`;
  const pngBytes = (await stat(png)).size;
  before += pngBytes;

  try {
    const source = sharp(png);
    const meta = await source.metadata();

    const buffer = await source
      // Honours any EXIF orientation. A no-op for almost every PNG, and
      // cheap insurance against one that carries it.
      .rotate()
      .webp({ quality, effort: 6, alphaQuality: 100 })
      .toBuffer();

    if (buffer.length >= pngBytes) {
      // Lossless PNG already beat us — almost always a flat-colour graphic.
      kept.push({ rel, pngBytes, webpBytes: buffer.length });
      after += pngBytes;
      continue;
    }

    if (dryRun) {
      converted.push({ rel, pngBytes, webpBytes: buffer.length });
      after += buffer.length;
      continue;
    }

    await writeFile(webp, buffer);

    // Prove the written file decodes to the same picture before the original
    // is destroyed. Anything unexpected here leaves the PNG alone.
    const check = await sharp(webp).metadata();
    if (check.width !== meta.width || check.height !== meta.height) {
      throw new Error(
        `written WebP is ${check.width}x${check.height}, expected ${meta.width}x${meta.height}`,
      );
    }

    await unlink(png);
    converted.push({ rel, pngBytes, webpBytes: buffer.length });
    after += buffer.length;
    console.log(
      `  ${mb(pngBytes).padStart(8)} -> ${mb(buffer.length).padStart(8)}` +
        `  (${Math.round((1 - buffer.length / pngBytes) * 100)}% smaller)  ${rel}`,
    );
  } catch (error) {
    // The PNG is never removed on this path.
    failed.push({ rel, message: error.message });
    after += pngBytes;
  }
}

// --- repoint the references ------------------------------------------------

async function sources(dir) {
  const found = [];
  if (!existsSync(dir)) return found;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await sources(full)));
    else if (CODE_EXTS.has(entry.name.slice(entry.name.lastIndexOf("."))))
      found.push(full);
  }
  return found;
}

let edited = 0;
if (!keepCode) {
  /* Driven by the WebPs that exist, not by what this run happened to convert.
     That makes the step idempotent: run the script twice, or convert first and
     repoint later, and references still end up correct. A PNG that was kept
     has no WebP beside it, so nothing rewrites its reference. */
  const swaps = [];
  for (const file of await webps(ASSETS)) {
    const web = relative(ROOT, file).replace(/^public\//, "").replace(/\\/g, "/");
    swaps.push([`${web.slice(0, -5)}.png`, web]);
  }

  for (const dir of CODE_DIRS) {
    for (const file of await sources(join(ROOT, dir))) {
      const text = await readFile(file, "utf8");
      let next = text;
      for (const [from, to] of swaps) next = next.split(from).join(to);
      if (next !== text && !dryRun) {
        await writeFile(file, next);
        edited += 1;
      } else if (next !== text) {
        edited += 1;
      }
    }
  }
}

// --- report ----------------------------------------------------------------

console.log("");
if (kept.length) {
  console.log(`Kept as PNG (WebP was no smaller): ${kept.length}`);
  for (const { rel } of kept) console.log(`  ${rel}`);
  console.log("");
}
if (failed.length) {
  console.log(`FAILED — original left in place: ${failed.length}`);
  for (const { rel, message } of failed) console.log(`  ${rel}: ${message}`);
  console.log("");
}

const saved = before > 0 ? `  ·  ${Math.round((1 - after / before) * 100)}% smaller` : "";
console.log(
  (converted.length
    ? `${converted.length} converted  ·  ${mb(before)} -> ${mb(after)}${saved}`
    : "Nothing to convert") +
    (edited ? `  ·  ${edited} source file${edited === 1 ? "" : "s"} repointed` : ""),
);
if (dryRun) console.log("\nDry run — nothing was written or deleted.");
else if (converted.length) console.log("\nReview with `git status`, then commit.");

process.exit(failed.length ? 1 : 0);
