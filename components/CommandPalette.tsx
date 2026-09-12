"use client";

/**
 * ⌘K.
 *
 * The header has had a search box since the first prototype and it was wired
 * to nothing — an input inviting a query the product could not answer. This is
 * what it opens.
 *
 * Mounted only while it is open, so every opening starts empty and focus
 * bookkeeping is one effect with one cleanup rather than four that have to
 * agree with each other.
 *
 * Two sources, mixed into one list. Navigation matches are computed in the
 * client against the same `routes` table every link is built from, so typing
 * "billing" answers instantly with no network. Everything else — courses, your
 * own races and plans, help articles — comes from `GET /search`, scoped by the
 * server to whoever is asking.
 *
 * **Keyboard first, and keyboard complete.** ⌘K or Ctrl-K opens it from
 * anywhere, `/` opens it when focus is not already in a field, arrows and
 * Home/End move, Enter opens, Escape closes. Focus is trapped while it is open
 * and returned to whatever had it when it closes, and the listbox is wired to
 * the input with `aria-activedescendant` so a screen reader hears the
 * highlighted row change without focus ever leaving the text field.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KIND_LABEL,
  matchDestinations,
  toPaletteItems,
  useSearch,
  type PaletteItem,
} from "@/lib/api/search";

/** Colour per kind, so the eye can skip to the right group. */
const KIND_COLOR: Record<string, string> = {
  plan: "#E4622F",
  race: "#4F7C93",
  course: "#5C574B",
  help: "#3E7B55",
  action: "#8C8578",
};

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [rawCursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const listId = useId();

  const { data, isFetching } = useSearch(query);

  const items: PaletteItem[] = useMemo(() => {
    // Navigation first: it is the answer that needed no network, and putting
    // it under a list that is still loading would make the palette feel slower
    // than it is.
    const destinations = matchDestinations(query);
    const remote = toPaletteItems(data);
    return [...destinations, ...remote];
  }, [query, data]);

  // Clamped where it is read rather than corrected in an effect. The list
  // shrinks between keystrokes, and an effect would render one frame with the
  // cursor past the end — during which Enter would open nothing.
  const cursor = items.length === 0 ? 0 : Math.min(rawCursor, items.length - 1);

  // Mounted only while open, so this runs exactly once per opening: take the
  // focus, hold the page still behind, and give both back on the way out.
  useEffect(() => {
    const returnFocusTo = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      // Closing a dialog must not dump focus at the top of the document.
      returnFocusTo?.focus?.();
    };
  }, []);

  const go = useCallback(
    (item: PaletteItem | undefined) => {
      if (!item) return;
      onClose();
      router.push(item.href);
    },
    [onClose, router],
  );

  // Keep the highlighted row in view when the arrows walk past the fold.
  useEffect(() => {
    const node = listRef.current?.children[cursor] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setCursor((c) => (items.length ? (c + 1) % items.length : 0));
        break;
      case "ArrowUp":
        event.preventDefault();
        setCursor((c) => (items.length ? (c - 1 + items.length) % items.length : 0));
        break;
      case "Home":
        event.preventDefault();
        setCursor(0);
        break;
      case "End":
        event.preventDefault();
        setCursor(Math.max(0, items.length - 1));
        break;
      case "Enter":
        event.preventDefault();
        go(items[cursor]);
        break;
      case "Escape":
        event.preventDefault();
        onClose();
        break;
      case "Tab":
        // The only focusable thing in here is the input, so a trap is one
        // line: Tab keeps it. Escape is the way out, and it is announced.
        event.preventDefault();
        break;
      default:
        break;
    }
  };

  const showEmpty = query.trim().length >= 2 && items.length === 0 && !isFetching;

  return (
    <div
      // Clicking the backdrop closes it. The dialog itself stops the event, so
      // a click inside never does.
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(21,20,15,.34)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "12vh 16px 16px",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search RaceOS"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        style={{
          width: "min(640px, 100%)",
          background: "#FBF8F2",
          borderRadius: 12,
          boxShadow: "0 40px 90px -40px rgba(12,9,6,.6), 0 1px 2px rgba(21,20,15,.1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "min(560px, 76vh)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 18px", height: 56, borderBottom: "1px solid rgba(21,20,15,.1)" }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flex: "none" }}>
            <circle cx="7" cy="7" r="4.6" stroke="#8C8578" strokeWidth="1.5" />
            <path d="M10.6 10.6 14 14" stroke="#8C8578" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            placeholder="Search races, plans, courses and help"
            aria-label="Search races, plans, courses and help"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={items.length ? `${listId}-${cursor}` : undefined}
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "Switzer,Helvetica,Arial,sans-serif",
              fontSize: 16,
              color: "#15140F",
              padding: 0,
            }}
          />
          <kbd className="mono" style={{ fontSize: 9.5, letterSpacing: ".08em", color: "#A8A192", flex: "none" }}>ESC</kbd>
        </div>

        {/* One live region for the whole result set. Announcing each row as the
            arrows pass it would read the list aloud twice. */}
        <p aria-live="polite" className="sr-only">
          {query.trim().length < 2
            ? "Type at least two characters to search."
            : isFetching
              ? "Searching."
              : `${items.length} result${items.length === 1 ? "" : "s"}.`}
        </p>

        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Search results"
          style={{ listStyle: "none", margin: 0, padding: items.length ? "8px 0" : 0, overflowY: "auto", flex: 1 }}
        >
          {items.map((item, index) => (
            <li
              key={item.key}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === cursor}
              onMouseEnter={() => setCursor(index)}
              onClick={() => go(item)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "11px 18px",
                cursor: "pointer",
                background: index === cursor ? "rgba(21,20,15,.055)" : "transparent",
              }}
            >
              <span
                className="mono"
                style={{ flex: "none", width: 72, fontSize: 8, letterSpacing: ".13em", color: KIND_COLOR[item.kind] ?? "#8C8578" }}
              >
                {KIND_LABEL[item.kind] ?? item.kind.toUpperCase()}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontSize: 15, letterSpacing: "-.016em", color: "#15140F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.title}
                </span>
                <span style={{ display: "block", fontSize: 12.5, color: "#8C8578", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                  {item.subtitle}
                </span>
              </span>
              {index === cursor && (
                <span className="mono" aria-hidden="true" style={{ flex: "none", fontSize: 9, letterSpacing: ".1em", color: "#A8A192" }}>↵</span>
              )}
            </li>
          ))}
        </ul>

        {query.trim().length < 2 && (
          <div style={{ padding: "26px 18px 28px", fontSize: 14, lineHeight: 1.6, color: "#8C8578" }}>
            Type a course, one of your races, or what you are trying to do — “billing”, “add a
            race”, “cut-off”.
          </div>
        )}

        {showEmpty && (
          <div style={{ padding: "26px 18px 28px", fontSize: 14, lineHeight: 1.6, color: "#8C8578" }}>
            Nothing matches “{query.trim()}”. Courses you have not entered and other athletes’
            plans are not searchable from here.
          </div>
        )}

        <div className="mono" style={{ display: "flex", gap: 16, padding: "9px 18px", borderTop: "1px solid rgba(21,20,15,.08)", fontSize: 8.5, letterSpacing: ".12em", color: "#A8A192" }}>
          <span>↑↓ MOVE</span>
          <span>↵ OPEN</span>
          <span>ESC CLOSE</span>
        </div>
      </div>
    </div>
  );
}

/**
 * ⌘K / Ctrl-K from anywhere, and `/` when focus is not in a field.
 *
 * A hook rather than a listener inside the palette, because the palette is not
 * mounted until it opens — something has to be listening while it is closed,
 * and that something is the header.
 */
export function usePaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
        return;
      }
      // `/` is the convention, but only when it is not being typed into
      // something — otherwise it would be impossible to type a slash.
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !isTypingTarget(event.target)) {
        event.preventDefault();
        onOpen();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);
}
