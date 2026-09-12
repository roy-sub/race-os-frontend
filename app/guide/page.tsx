"use client";

/**
 * The help library.
 *
 * What was here was a single hardcoded article about fuelling, bylined to one
 * of the seed personas with an invented athlete count and an invented "updated"
 * date, illustrated with a generated chart of invented data, and followed by
 * four "related guides" whose links all pointed back at the page you were
 * already reading. Every part of that was a drawing of a help library rather
 * than one.
 *
 * This reads `GET /help`. The index lists every article grouped by category in
 * the server's own reading order; `?article=<slug>` opens one. The slug travels
 * as a query parameter for the same reason a course's does — the site is a
 * static export, so a dynamic segment would have to be enumerable at build
 * time, and enumerating help articles would make every build depend on the
 * backend being up.
 */

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { Skeleton } from "@/components/Skeleton";
import { ApiErrorState } from "@/components/ApiErrorState";
import { routes } from "@/lib/routes";
import {
  byCategory,
  paragraphs,
  runs,
  useHelpArticle,
  useHelpArticles,
  type HelpArticleSummary,
} from "@/lib/api/help";

function articleHref(slug: string): string {
  return `${routes.guide}?article=${encodeURIComponent(slug)}`;
}

/** One article's prose. See `paragraphs`/`runs` for the grammar it supports. */
function Body({ body }: { body: string }) {
  return (
    <>
      {paragraphs(body).map((paragraph, index) => (
        <p
          key={index}
          style={{ margin: index === 0 ? 0 : "20px 0 0", fontSize: 17, lineHeight: 1.65, color: "#302C24" }}
        >
          {runs(paragraph).map((run, i) => {
            if (run.strong) return <strong key={i} style={{ fontWeight: 600 }}>{run.text}</strong>;
            if (run.emphasis) return <em key={i}>{run.text}</em>;
            return <span key={i}>{run.text}</span>;
          })}
        </p>
      ))}
    </>
  );
}

function ArticleCard({ article }: { article: HelpArticleSummary }) {
  return (
    <Link
      href={articleHref(article.slug)}
      className="row-hover-faint"
      style={{ display: "block", padding: "18px 20px", borderRadius: 10, background: "#FBF8F2", boxShadow: "0 1px 2px rgba(21,20,15,.04)" }}
    >
      <span style={{ display: "block", fontSize: 17, fontWeight: 500, letterSpacing: "-.022em", lineHeight: 1.35 }}>
        {article.title}
      </span>
      <span style={{ display: "block", fontSize: 14, lineHeight: 1.55, color: "#5C574B", marginTop: 8 }}>
        {article.summary}
      </span>
      <span className="mono" style={{ display: "block", fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192", marginTop: 12 }}>
        {article.read_minutes} MIN READ
      </span>
    </Link>
  );
}

/** The index: everything, grouped, in reading order. */
function Library() {
  const { data, isPending, error, refetch } = useHelpArticles();
  const groups = byCategory(data);

  return (
    <main style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 96px" }}>
      <Reveal as="h1" style={{ margin: 0, maxWidth: 760, fontSize: 64, lineHeight: 0.98, fontWeight: 600, letterSpacing: "-.048em" }}>
        Help.
      </Reveal>
      <p style={{ margin: "22px 0 0", maxWidth: 560, fontSize: 18, lineHeight: 1.5, color: "#5C574B" }}>
        How the solver decides, what happens in race week, and what you keep if you stop paying.
      </p>

      {error && (
        <div style={{ marginTop: 40 }}>
          <ApiErrorState error={error} onRetry={() => void refetch()} />
        </div>
      )}

      {isPending && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, marginTop: 44 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={140} style={{ borderRadius: 10 }} />
          ))}
        </div>
      )}

      {groups.map(([category, articles]) => (
        <section key={category} style={{ marginTop: 48 }}>
          <h2 className="mono" style={{ margin: 0, fontSize: 9.5, letterSpacing: ".16em", color: "#8C8578", fontWeight: 400 }}>
            {category.toUpperCase()}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14, marginTop: 18 }}>
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

/** One article, with the rest of its category beside it. */
function Article({ slug }: { slug: string }) {
  const { data, isPending, error, refetch } = useHelpArticle(slug);
  const library = useHelpArticles();

  const siblings = (library.data ?? []).filter(
    (row) => row.category === data?.category && row.slug !== slug,
  );

  if (error) {
    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "88px 56px 96px" }}>
        <ApiErrorState error={error} onRetry={() => void refetch()} />
        <Link href={routes.guide} className="link-accent mono" style={{ display: "inline-block", fontSize: 10, letterSpacing: ".13em", color: "#C6461B", marginTop: 28 }}>
          ← ALL HELP
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1360, margin: "0 auto", padding: "56px 56px 96px", display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", gap: 60, alignItems: "start" }}>
      <article style={{ maxWidth: 720 }}>
        <nav aria-label="Breadcrumb" className="mono" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 9.5, letterSpacing: ".15em", color: "#A8A192" }}>
          <Link href={routes.guide} style={{ color: "#8C8578" }}>HELP</Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: "#5C574B" }}>{isPending ? "…" : data?.category.toUpperCase()}</span>
          {!isPending && data && (
            <>
              <span aria-hidden="true">/</span>
              <span>{data.read_minutes} MIN READ</span>
            </>
          )}
        </nav>

        {isPending ? (
          <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 14 }}>
            <Skeleton height={54} width="80%" />
            <Skeleton height={18} />
            <Skeleton height={18} />
            <Skeleton height={18} width="60%" />
          </div>
        ) : (
          data && (
            <>
              <h1 style={{ margin: "26px 0 0", fontSize: 46, lineHeight: 1.04, fontWeight: 600, letterSpacing: "-.042em" }}>
                {data.title}
              </h1>
              {/* No byline. These are written by the people who build RaceOS,
                  and attributing them to a named coach — as this page used to —
                  would be inventing a person's endorsement. */}
              <div style={{ marginTop: 32 }}>
                <Body body={data.body} />
              </div>
            </>
          )
        )}
      </article>

      <aside style={{ position: "sticky", top: 100, display: "flex", flexDirection: "column", gap: 14 }}>
        {siblings.length > 0 && (
          <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "22px 24px", boxShadow: "0 1px 2px rgba(21,20,15,.04)" }}>
            <h2 className="mono" style={{ margin: 0, fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192", fontWeight: 400 }}>
              MORE ON {data?.category.toUpperCase()}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
              {siblings.map((row) => (
                <Link
                  key={row.slug}
                  href={articleHref(row.slug)}
                  className="link-accent"
                  style={{ display: "block", padding: "12px 0", borderBottom: "1px solid rgba(21,20,15,.07)", fontSize: 14.5, fontWeight: 500, letterSpacing: "-.018em", lineHeight: 1.35 }}
                >
                  {row.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "22px 24px", boxShadow: "0 1px 2px rgba(21,20,15,.04)" }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "#5C574B" }}>
            Still stuck? Every number on a plan carries the constraint that produced it — open the
            “Why this?” drawer beside it.
          </p>
          <Link href={routes.guide} className="link-accent mono" style={{ display: "inline-block", fontSize: 9.5, letterSpacing: ".13em", color: "#C6461B", marginTop: 14 }}>
            ALL HELP →
          </Link>
        </div>
      </aside>
    </main>
  );
}

function GuideScreen() {
  const slug = useSearchParams().get("article");
  return slug ? <Article slug={slug} /> : <Library />;
}

export default function GuidePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8" }}>
      <AppHeader ctaLabel="Start free" ctaHref={routes.planBuilder} />
      {/* `useSearchParams` suspends during prerender, and this is a static
          export — without a boundary the page stops being prerenderable. */}
      <Suspense fallback={<div style={{ minHeight: 400 }} />}>
        <GuideScreen />
      </Suspense>
      <Footer />
    </div>
  );
}
