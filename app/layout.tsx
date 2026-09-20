import type { Metadata } from "next";
import { ServiceWorker } from "@/components/ServiceWorker";
import { BootLoader } from "@/components/BootLoader";
import { ScrollFx } from "@/components/ScrollFx";
import { Providers } from "./providers";
import { JsonLd } from "@/lib/seo/JsonLd";
import { OG_IMAGE_PATH, SITE_DESCRIPTION, SITE_NAME, SITE_URL, TITLE_TEMPLATE, absolute, canonical } from "@/lib/seo/site";
import "./globals.css";

/**
 * The defaults every page inherits.
 *
 * `title.template` is what stops all 22 pages sharing one title: a page sets
 * its own short title and the site name is appended here, so the tab and the
 * search result read "IRONMAN 70.3 Málaga — RaceOS" without every layout
 * repeating the suffix. `title.default` covers any page that sets none.
 *
 * `metadataBase` is what lets every other file use a relative path: without
 * it, a relative `openGraph.images` is a build error, and an absolute one
 * would hardcode the host into a dozen files.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Race week, solved.`,
    template: TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Race week, solved.`,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_GB",
    images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Race week, solved.`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
  /* No `noimageindex`: the course photography is part of what someone
     searching for a race is looking for. */
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/**
 * Who the site belongs to, in the one form a search engine reads as fact.
 *
 * `WebSite` and `Organization` are what let a result show the site's name and
 * logo rather than guessing them from the domain. They go on every page
 * because they describe the site, not the page — the per-race `SportsEvent`
 * blocks are separate and live on the race pages themselves.
 */
const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: canonical("/"),
      description: SITE_DESCRIPTION,
      logo: absolute(OG_IMAGE_PATH),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: canonical("/"),
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-GB",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <JsonLd data={SITE_JSON_LD} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        {/* First in the tab order, invisible until focused. Every screen opens
            with a header and a nav; without this a keyboard or screen-reader
            user walks through both again on every navigation. */}
        <a href="#content" className="skip-link">Skip to content</a>
        <ServiceWorker />
        <BootLoader />
        <ScrollFx />
        <Providers>
          <div id="content">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
