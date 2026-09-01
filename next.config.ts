import type { NextConfig } from "next";

/**
 * A fully static export.
 *
 * Every screen reads from the FastAPI backend at runtime, in the browser, with
 * the athlete's own token — there is nothing for a Node server here to render
 * that the client cannot. Exporting to plain files is therefore both the honest
 * description of the app and the shortest path onto Cloudflare Pages: no
 * adapter, no worker, no server runtime to keep in sync with the backend.
 *
 * The one constraint it imposes is that a dynamic route segment must be
 * enumerable at build time. Courses are (there are three), so they get real
 * paths; anything keyed by an id the build cannot know — a plan, a race — is
 * addressed by query string instead.
 */
const nextConfig: NextConfig = {
  output: "export",
  // `next/image`'s optimiser needs a server. Course media is placeholders for
  // now, so there is nothing to optimise and nothing lost.
  images: { unoptimized: true },
  // Cloudflare Pages serves /path/ from /path/index.html, so emit that shape.
  trailingSlash: true,
};

export default nextConfig;
