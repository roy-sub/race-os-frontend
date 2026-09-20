/**
 * Load `.env.local` / `.env` for the scripts that run outside Next.
 *
 * **Why this exists.** `next build` reads those files itself, so a developer
 * who followed the README (`cp .env.example .env.local`) has a working
 * environment as far as the app is concerned. But `prebuild` runs plain node
 * scripts, and a plain node script sees only the real process environment —
 * so `security-headers.mjs` failed the build asking for a variable that was
 * sitting in `.env.local` the whole time. The instructions and the build
 * disagreed, and the build won.
 *
 * Precedence matches Next's, which is the point: a real environment variable
 * always wins, then `.env.local`, then `.env`. So `FOO=bar npm run build`
 * still overrides the file, and CI — which sets real variables and ships no
 * `.env` — behaves exactly as before.
 *
 * Deliberately not a dependency. This is thirty lines of parsing that runs
 * before anything else in the build, and `dotenv` would be a package in the
 * supply chain of every deploy for the sake of them.
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** `KEY=value`, `export KEY=value`, `KEY="value"`, `# comment`, blank lines. */
function parse(text) {
  const out = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).replace(/^export\s+/, "").trim();
    if (!key) continue;
    let value = line.slice(eq + 1).trim();
    /* Strip one matching pair of quotes, and nothing else — a value like
       `pk_live_"weird"` is not ours to reinterpret. */
    if (value.length > 1 && ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Fill in anything the real environment has not already set.
 *
 * Returns the files it actually read, so a script can say where a value came
 * from when it has to explain itself.
 */
export function loadEnv() {
  const seen = [];
  for (const name of [".env.local", ".env.production", ".env"]) {
    let text;
    try {
      text = readFileSync(join(ROOT, name), "utf8");
    } catch {
      continue;                      // absent is the normal case in CI
    }
    seen.push(name);
    for (const [key, value] of Object.entries(parse(text))) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
  return seen;
}
