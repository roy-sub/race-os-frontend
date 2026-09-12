/**
 * The help library, from `GET /help`.
 *
 * It used to be a single hardcoded article in `lib/guide.ts` with a byline
 * attributing it to one of the seed personas, an invented athlete count and an
 * invented date, and four "related" links that all pointed back at the page
 * you were already on. What is served now is real content about behaviour this
 * system actually has, and every article it lists can be opened.
 */

import { useQuery } from "@tanstack/react-query";
import { client, unwrap } from "./client";
import { queryKeys } from "./queryKeys";
import type { components } from "./schema";

export type HelpArticleSummary = components["schemas"]["HelpArticleSummary"];
export type HelpArticle = components["schemas"]["HelpArticleOut"];

export function useHelpArticles() {
  return useQuery({
    queryKey: queryKeys.help.list(),
    // Editorial copy. It changes on a deploy, not between page views.
    staleTime: Infinity,
    queryFn: () => unwrap(client.GET("/api/v1/help")),
  });
}

export function useHelpArticle(slug: string | null) {
  return useQuery({
    queryKey: queryKeys.help.article(slug ?? ""),
    enabled: Boolean(slug),
    staleTime: Infinity,
    queryFn: () =>
      unwrap(client.GET("/api/v1/help/{slug}", { params: { path: { slug: slug! } } })),
  });
}

/** Articles grouped by category, keeping the server's reading order. */
export function byCategory(rows: HelpArticleSummary[] | undefined): [string, HelpArticleSummary[]][] {
  const groups = new Map<string, HelpArticleSummary[]>();
  for (const row of rows ?? []) {
    const bucket = groups.get(row.category);
    if (bucket) bucket.push(row);
    else groups.set(row.category, [row]);
  }
  return [...groups.entries()];
}

/**
 * The whole markdown grammar these bodies use: blank-line-separated
 * paragraphs, `**strong**` and `*emphasis*`. Nothing else — no headings, no
 * lists, no links, no images.
 *
 * Parsed into React nodes rather than turned into HTML and injected, so there
 * is no `dangerouslySetInnerHTML` anywhere near content that is served rather
 * than compiled in — and no markdown library for a grammar this small.
 *
 * The grammar being written down here matters: an article using a construct
 * this does not know renders its own asterisks on the page, so the two have to
 * be kept honest with each other.
 */
export function paragraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

export type Run = { text: string; strong: boolean; emphasis: boolean };

/** A paragraph split into runs. `**strong**` is matched before `*emphasis*`. */
export function runs(paragraph: string): Run[] {
  return paragraph
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((piece) => {
      if (piece.startsWith("**") && piece.endsWith("**") && piece.length > 4) {
        return { text: piece.slice(2, -2), strong: true, emphasis: false };
      }
      if (piece.startsWith("*") && piece.endsWith("*") && piece.length > 2) {
        return { text: piece.slice(1, -1), strong: false, emphasis: true };
      }
      return { text: piece, strong: false, emphasis: false };
    });
}
