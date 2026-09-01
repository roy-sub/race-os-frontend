import { Suspense } from "react";
import AuthScreen from "@/components/AuthScreen";

// `AuthScreen` reads `?next=` to send the user back where they were headed, and
// `useSearchParams` needs a Suspense boundary for the static export to prerender
// the shell. There is nothing meaningful to show while it resolves — the page is
// a client screen either way — so the fallback is the page background.
export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#F1EEE8" }} />}>
      <AuthScreen initialMode="signup" />
    </Suspense>
  );
}
