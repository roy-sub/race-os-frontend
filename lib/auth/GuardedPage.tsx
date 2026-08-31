"use client";

/**
 * The signed-in page wrapper.
 *
 * Every app-side route wraps its screen in this, so the "am I signed in?"
 * question is answered in one place and answered the same way. While the boot
 * refresh is still in flight it shows a quiet page rather than either the screen
 * or the login redirect — both would be wrong, and a flash of the wrong one is
 * how a reload ends up looking broken.
 */

import { RequireAuth } from "./RequireAuth";

function CheckingSession() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F1EEE8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        role="status"
        aria-label="Checking your session"
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "2px solid rgba(21,20,15,.14)",
          borderTopColor: "#E4622F",
          animation: "spin .8s linear infinite",
        }}
      />
    </div>
  );
}

export function GuardedPage({ children }: { children: React.ReactNode }) {
  return <RequireAuth fallback={<CheckingSession />}>{children}</RequireAuth>;
}
