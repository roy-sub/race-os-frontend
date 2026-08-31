import { Suspense } from "react";
import AuthScreen from "@/components/AuthScreen";

/**
 * Built, and deliberately unreachable.
 *
 * V1 sends no outbound email, so nothing ever hands an athlete the `?token=`
 * this page needs — there is no link to it anywhere in the UI. It stays
 * implemented against the real endpoint so that turning email on is a backend
 * change plus one link, not a rebuild.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#F1EEE8" }} />}>
      <AuthScreen initialMode="reset" />
    </Suspense>
  );
}
