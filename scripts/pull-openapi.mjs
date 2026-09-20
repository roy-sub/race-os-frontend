#!/usr/bin/env node
/**
 * Refresh the checked-in copy of the backend's OpenAPI contract.
 *
 * The schema is committed rather than fetched at build time so that a build is
 * reproducible and does not depend on the backend being up. This script is how
 * it gets updated: run it, commit the diff, and `npm run api:types` regenerates
 * the client from it.
 *
 * Source order: an explicit argument, then $API_SCHEMA_URL, then
 * $NEXT_PUBLIC_API_BASE_URL. Note the path — the schema is served under the
 * /api/v1 prefix, not at the root.
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { loadEnv } from "./load-env.mjs";

loadEnv();
import { dirname, join } from "node:path";

const base =
  process.argv[2] ??
  process.env.API_SCHEMA_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://race-os-backend.onrender.com";

const url = base.endsWith(".json") ? base : `${base.replace(/\/+$/, "")}/api/v1/openapi.json`;
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "openapi", "openapi.json");

const response = await fetch(url);
if (!response.ok) {
  console.error(`Could not read the schema from ${url} — HTTP ${response.status}.`);
  console.error("Interactive docs are disabled in production; this URL is the contract.");
  process.exit(1);
}

const schema = await response.json();
const paths = Object.keys(schema.paths ?? {}).length;
await writeFile(out, `${JSON.stringify(schema, null, 2)}\n`);
console.log(`Wrote ${paths} paths from ${url} to openapi/openapi.json`);
