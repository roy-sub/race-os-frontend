/**
 * A structured-data block.
 *
 * Structured data is how a search engine learns that a page is *an event* —
 * with a date, a place and a country — rather than prose that happens to
 * mention one. That is what produces the date and location shown beside a
 * result, and it is the only part of a page a crawler reads as facts rather
 * than as text.
 *
 * `<` is escaped rather than trusted. `JSON.stringify` will happily emit
 * `</script>` inside a string and end the block early, which turns any text
 * that reaches this component into markup. Everything passed in today is
 * committed data, but the escape costs nothing and the rule should hold when
 * that stops being true.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
