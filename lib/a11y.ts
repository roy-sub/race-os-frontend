/**
 * Making a clickable element actually operable.
 *
 * A `<div onClick>` is invisible to a keyboard and silent to a screen reader:
 * it is not in the tab order, Enter and Space do nothing, and nothing
 * announces that it can be activated. Thirteen of them carried real actions in
 * this app — picking a bag, choosing a risk band, switching a settings tab.
 *
 * The honest fix for most is a `<button>`, and where the markup allowed it
 * that is what was done. Where an element is a layout box that happens to be
 * clickable, retagging it means unpicking its styles for no gain; this gives
 * it the same contract instead — in the tab order, activated by Enter and
 * Space, announced as a button.
 *
 * Space is `preventDefault`ed because its default is to scroll the page, which
 * would fire the action and jump the reader somewhere else at the same time.
 */
import type { KeyboardEvent } from "react";

export function clickable(onActivate: () => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onActivate();
      }
    },
  };
}

/**
 * The same, for a thing that is really a choice among several.
 *
 * `aria-pressed` is what tells a screen reader which risk band or which bag is
 * currently selected — information that is otherwise carried only by a
 * background colour, which is both inaudible and invisible to a colour-blind
 * reader.
 */
export function selectable(onActivate: () => void, selected: boolean) {
  return { ...clickable(onActivate), "aria-pressed": selected };
}
