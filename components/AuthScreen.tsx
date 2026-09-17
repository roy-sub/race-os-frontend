"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { clickable } from "@/lib/a11y";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mark } from "./Mark";
import { MediaPlaceholder } from "./MediaPlaceholder";
import { CountUp } from "./CountUp";
import { routes } from "@/lib/routes";
import { client, unwrap } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { useCourses } from "@/lib/api/courses";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAuthProviders } from "@/lib/auth/useProviders";
import { safeNextPath } from "@/lib/auth/RequireAuth";

/**
 * `forgot`, `sent` and `reset` stay implemented and are deliberately
 * unreachable from the UI: V1 sends no outbound email, so a "check your inbox"
 * screen would be a lie. The entry point comes back the day the backend can
 * actually send the link.
 *
 * `verify-pending` is the same idea in reverse — signup auto-verifies today, so
 * the holding page is skipped by checking the user the API returns rather than
 * by a flag the frontend has to know about. Turn verification on backend-side
 * and `email_verified_at` arrives null, and the page appears on its own.
 */
type Mode = "signup" | "login" | "forgot" | "sent" | "reset" | "expired" | "verify" | "verify-pending";

/** The API's own minimum. The prototype said 8 in one place and 12 in another. */
const MIN_PASSWORD = 10;

const fieldLabel = { fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: ".15em", color: "#8C8578" } as const;

export default function AuthScreen({ initialMode = "signup" }: { initialMode?: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, status } = useAuth();
  const providers = useAuthProviders();
  const courses = useCourses();
  const raceCount = courses.data?.meta.total ?? null;

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const intended = safeNextPath(searchParams.get("next"));

  /**
   * True once this screen has started a sign-in or sign-up of its own.
   *
   * `signIn`/`signUp` flip `status` to `"authenticated"` the moment the token
   * lands, which would otherwise trip the redirect below and race the
   * navigation `submit` is about to make — sending a new account to the
   * dashboard instead of onboarding, and dragging anyone who still needs to
   * confirm their email off the holding page. So the effect handles only the
   * other case: arriving here already signed in.
   */
  const selfInitiated = useRef(false);

  useEffect(() => {
    if (status === "authenticated" && !selfInitiated.current) {
      router.replace(intended ?? routes.dashboard);
    }
  }, [status, router, intended]);

  const emailOk = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email);
  const emailBad = email.length > 3 && !emailOk;
  const n = pw.length;
  const strength = n === 0 ? 0 : n < MIN_PASSWORD ? 1 : n < 14 ? 2 : /[^a-z]/i.test(pw) ? 4 : 3;
  const sCol = ["rgba(21,20,15,.1)", "#C0392B", "#E0A33C", "#5C9E72", "#3E7B55"][strength];
  const sLab = ["", "TOO SHORT", "FAIR", "STRONG", "VERY STRONG"][strength];

  const go = (m: Mode) => { setMode(m); setBusy(false); setError(null); };

  /**
   * Submit, from a real form.
   *
   * This used to be wired to `<div onClick={submit}>` with no `<form>` around
   * the fields, which meant the single most common way anyone signs in — type
   * the password, press Enter — did nothing at all, and the button could not be
   * reached by keyboard or announced by a screen reader. It is a `<form>` and a
   * `<button type="submit">` now, so Enter works because the platform makes it
   * work rather than because we remembered to handle a key.
   */
  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (busy) return;
    setError(null);
    selfInitiated.current = true;

    try {
      if (mode === "signup") {
        if (!emailOk || n < MIN_PASSWORD) return;
        setBusy(true);
        const user = await signUp({ email, password: pw });
        // Auto-verified today, so this lands straight on onboarding. The
        // holding page is one flipped backend flag away, not a rebuild.
        if (user.email_verified_at) router.replace(intended ?? routes.onboarding);
        else setMode("verify-pending");
        return;
      }

      if (mode === "login") {
        setBusy(true);
        await signIn({ email, password: pw });
        router.replace(intended ?? routes.dashboard);
        return;
      }

      if (mode === "forgot") {
        setBusy(true);
        // Always 202, whether or not the address exists — anything else turns
        // this into an account enumerator.
        await client.POST("/api/v1/auth/forgot-password", { body: { email } });
        setMode("sent");
        return;
      }

      if (mode === "reset") {
        const token = searchParams.get("token");
        if (!token || pw2 !== pw || n < MIN_PASSWORD) return;
        setBusy(true);
        await unwrap(
          client.POST("/api/v1/auth/reset-password", { body: { token, new_password: pw } }),
        );
        await signIn({ email, password: pw });
        router.replace(routes.dashboard);
        return;
      }
    } catch (caught) {
      // Every typed value survives: nothing above clears `email` or `pw`, so a
      // failed attempt costs one click, not a retyped form.
      if (caught instanceof ApiError) {
        setError(caught);
        if (caught.code === "NOT_FOUND" || caught.code === "INVALID_INPUT") {
          if (mode === "reset") setMode("expired");
        }
      } else {
        selfInitiated.current = false;
        throw caught;
      }
      selfInitiated.current = false;
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = mode !== "signup" || (emailOk && n >= MIN_PASSWORD);
  const subLabel = busy
    ? mode === "login" ? "Checking…" : mode === "forgot" ? "Sending…" : "Creating account…"
    : mode === "login" ? "Log in" : mode === "forgot" ? "Send reset link" : "Create free account";
  const resetOk = pw2 === pw && n >= MIN_PASSWORD;

  /**
   * Rendered from the API's array, so V1 shows nothing at all. The divider goes
   * with them — "OR WITH EMAIL" with no alternative above it is nonsense.
   */
  const providerRows = providers.data ?? [];
  const OAuthButtons = providerRows.length > 0 ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: mode === "signup" ? 30 : 28 }}>
      {providerRows.map((o) => (
        <div key={o.id} className="row-hover-border" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, height: 48, border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 500, letterSpacing: "-.015em" }}>
          <span style={{ width: 17, height: 17, borderRadius: 4, background: o.tone ?? "#C4BCAC", flex: "none" }} />{o.name}
        </div>
      ))}
    </div>
  ) : null;

  const OrDivider = providerRows.length > 0 ? (
    <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "26px 0" }}>
      <span style={{ flex: 1, height: 1, background: "rgba(21,20,15,.12)" }} />
      <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#A8A192" }}>OR WITH EMAIL</span>
      <span style={{ flex: 1, height: 1, background: "rgba(21,20,15,.12)" }} />
    </div>
  ) : <div style={{ height: mode === "signup" ? 30 : 28 }} />;

  const Spinner = <span style={{ display: "block", width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "spin .8s linear infinite", flex: "none" }} />;

  /** The server's sentence, verbatim. It knows how many attempts are left; we do not. */
  const ErrorNote = error ? (
    <div role="alert" style={{ display: "flex", alignItems: "flex-start", gap: 11, marginTop: 24, padding: "15px 17px", borderRadius: 9, background: "rgba(192,57,43,.08)", border: "1px solid rgba(192,57,43,.3)" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C0392B", flex: "none", marginTop: 6 }} />
      <div>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: "#3D3A31" }}>{error.message}</div>
        {error.requestId && (
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#A8A192", marginTop: 7 }}>REQUEST ID · {error.requestId}</div>
        )}
      </div>
    </div>
  ) : null;


  return (
    <div className="auth-shell" style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.06fr)" }}>
      <div className="auth-art" style={{ position: "relative", background: "#1C1916", overflow: "hidden" }}>
        <MediaPlaceholder path="assets/auth/dawn-transition.webp" background="linear-gradient(158deg,#3E352B 0%,#231E19 48%,#12100E 100%)" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(12,11,10,.9) 0%,rgba(12,11,10,.28) 52%,rgba(12,11,10,.5) 100%)" }} />
        <div style={{ position: "absolute", left: 52, top: 44, display: "flex", alignItems: "center", gap: 11 }}>
          <Mark width={26} height={17} />
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.035em", color: "#FBF8F2" }}>RaceOS</span>
        </div>
        <div style={{ position: "absolute", left: 52, bottom: 52, right: 52 }}>
          <div style={{ fontSize: 44, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em", color: "#FBF8F2", maxWidth: 400 }}>Nobody fails at this on fitness.</div>
          <div style={{ fontSize: 16, lineHeight: 1.5, color: "rgba(255,255,255,.6)", maxWidth: 360, marginTop: 16 }}>They fail on logistics, a fuelling number nobody checked, and a cut-off they never modelled.</div>
          <div style={{ display: "flex", gap: 40, marginTop: 38, paddingTop: 26, borderTop: "1px solid rgba(255,255,255,.14)" }}>
            {/* The real number of listed races, from the same endpoint the
                directory reads. A banner and a directory quoting different
                figures to the same visitor is worse than no banner. */}
            <div>
              <div className="mono" style={{ fontSize: 24, letterSpacing: "-.03em", color: "#FBF8F2", minWidth: "2ch" }}>
                {raceCount == null ? "—" : <CountUp value={raceCount} decimals={0} suffix="" />}
              </div>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "rgba(255,255,255,.4)", marginTop: 7 }}>RACES LISTED</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 24, letterSpacing: "-.03em", color: "#FBF8F2" }}><CountUp value={5} decimals={0} suffix="" /></div>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "rgba(255,255,255,.4)", marginTop: 7 }}>BAGS PACKED</div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form" style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "56px 88px" }}>
        <div style={{ maxWidth: 430, width: "100%" }}>
          <div style={{ display: "flex", gap: 3, padding: 3, background: "rgba(21,20,15,.06)", borderRadius: 7, marginBottom: 36 }}>
            {[{ name: "Create account", k: "signup" as Mode }, { name: "Log in", k: "login" as Mode }].map((m) => {
              const on = (mode === "signup" && m.k === "signup") || (["login", "forgot", "sent", "reset", "expired"].includes(mode) && m.k === "login");
              return (
                <button key={m.k} type="button" onClick={() => go(m.k)} aria-pressed={on} style={{ appearance: "none", border: 0, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 38, borderRadius: 5, cursor: "pointer", background: on ? "#FBF8F2" : "transparent", fontSize: 14, fontWeight: on ? 600 : 500, letterSpacing: "-.015em", color: on ? "#15140F" : "#8C8578", fontFamily: "inherit" }}>
                  {m.name}
                </button>
              );
            })}
          </div>

          {mode === "signup" && (
            <form onSubmit={submit} noValidate style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>Start with your own course.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>Course recon is free and needs no card. You pay only when you want a solved plan.</p>
              {ErrorNote}
              {OAuthButtons}
              {OrDivider}
              <div style={fieldLabel}>EMAIL</div>
              <div style={{ display: "flex", alignItems: "center", height: 48, marginTop: 10, padding: "0 15px", border: `1px solid ${emailBad ? "rgba(192,57,43,.45)" : "rgba(21,20,15,.16)"}`, borderRadius: 8, background: "#fff" }}>
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, outline: "none" }} />
                {emailOk && <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 7.2 5.6 9.8 11 4.4" stroke="#5C9E72" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              {emailBad && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#C0392B", flex: "none" }} />
                  <span style={{ fontSize: 13, color: "#A03227" }}>That does not look like an email address.</span>
                </div>
              )}
              <div style={{ ...fieldLabel, marginTop: 22 }}>PASSWORD</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, height: 48, marginTop: 10, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                <input type={reveal ? "text" : "password"} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={`At least ${MIN_PASSWORD} characters`} style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, letterSpacing: ".06em", outline: "none" }} />
                <button type="button" onClick={() => setReveal((r) => !r)} aria-label={reveal ? "Hide password" : "Show password"} className="mono link-accent" style={{ appearance: "none", border: 0, background: "transparent", padding: 0, fontSize: 9, letterSpacing: ".12em", color: "#8C8578", cursor: "pointer", whiteSpace: "nowrap" }}>{reveal ? "HIDE" : "SHOW"}</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <div style={{ flex: 1, display: "flex", gap: 4 }}>
                  {[0, 1, 2, 3].map((i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < strength ? sCol : "rgba(21,20,15,.1)" }} />)}
                </div>
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: sCol === "rgba(21,20,15,.1)" ? "#A8A192" : sCol, whiteSpace: "nowrap" }}>{sLab}</span>
              </div>
              <button type="submit" disabled={!canSubmit || busy} className="pay-btn" style={{ appearance: "none", border: 0, width: "100%",  display: "flex", alignItems: "center", justifyContent: "center", gap: 11, height: 52, marginTop: 26, borderRadius: 8, cursor: canSubmit ? "pointer" : "not-allowed", background: canSubmit ? "#E4622F" : "rgba(21,20,15,.1)", color: canSubmit ? "#fff" : "#A8A192", fontSize: 15.5, fontWeight: 600, letterSpacing: "-.015em" }}>
                {busy && Spinner}{subLabel}
              </button>
              <p style={{ margin: "18px 0 0", fontSize: 12.5, lineHeight: 1.55, color: "#8C8578" }}>
                By creating an account you agree to the <a href="#" style={{ color: "#5C574B", textDecoration: "underline" }}>terms</a> and <a href="#" style={{ color: "#5C574B", textDecoration: "underline" }}>privacy policy</a>. We never sell your training data.
              </p>
            </form>
          )}

          {mode === "login" && (
            <form onSubmit={submit} noValidate style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>Welcome back.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>Your plans are where you left them.</p>
              {ErrorNote}
              {OAuthButtons}
              {OrDivider}
              <div style={fieldLabel}>EMAIL</div>
              <div style={{ display: "flex", alignItems: "center", height: 48, marginTop: 10, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, outline: "none" }} />
              </div>
              <div style={{ ...fieldLabel, marginTop: 22 }}>PASSWORD</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, height: 48, marginTop: 10, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                <input type={reveal ? "text" : "password"} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, letterSpacing: ".06em", outline: "none" }} />
                <button type="button" onClick={() => setReveal((r) => !r)} aria-label={reveal ? "Hide password" : "Show password"} className="mono link-accent" style={{ appearance: "none", border: 0, background: "transparent", padding: 0, fontSize: 9, letterSpacing: ".12em", color: "#8C8578", cursor: "pointer", whiteSpace: "nowrap" }}>{reveal ? "HIDE" : "SHOW"}</button>
              </div>
              <button type="submit" disabled={busy} className="btn-dark-to-accent" style={{ appearance: "none", border: 0, width: "100%",  display: "flex", alignItems: "center", justifyContent: "center", gap: 11, height: 52, marginTop: 26, borderRadius: 8, cursor: "pointer", background: "#E4622F", color: "#fff", fontSize: 15.5, fontWeight: 600, letterSpacing: "-.015em" }}>
                {busy && Spinner}{subLabel}
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={submit} noValidate style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>Reset your password.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>Enter the email on your account and we will send a link valid for one hour.</p>
              {ErrorNote}
              <div style={{ ...fieldLabel, marginTop: 30 }}>EMAIL</div>
              <div style={{ display: "flex", alignItems: "center", height: 48, marginTop: 10, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, outline: "none" }} />
              </div>
              <button type="submit" disabled={busy} className="btn-dark-to-accent" style={{ appearance: "none", border: 0, width: "100%",  display: "flex", alignItems: "center", justifyContent: "center", gap: 11, height: 52, marginTop: 24, borderRadius: 8, cursor: "pointer", background: "#E4622F", color: "#fff", fontSize: 15.5, fontWeight: 600, letterSpacing: "-.015em" }}>
                {busy && Spinner}{subLabel}
              </button>
              <button type="button" onClick={() => go("login")} className="link-accent" style={{ appearance: "none", border: 0, background: "transparent", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", height: 44, marginTop: 10, fontSize: 14.5, fontWeight: 500, color: "#5C574B", cursor: "pointer", fontFamily: "inherit" }}>Back to log in</button>
            </form>
          )}

          {mode === "sent" && (
            <form onSubmit={submit} noValidate style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: "50%", background: "rgba(92,158,114,.14)" }}>
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="#3E7B55" strokeWidth={1.6} /><path d="M3.2 5.5 10 11l6.8-5.5" stroke="#3E7B55" strokeWidth={1.6} strokeLinecap="round" /></svg>
              </span>
              <h1 style={{ margin: "22px 0 0", fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>Check your inbox.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>We sent a reset link to <span style={{ color: "#15140F", fontWeight: 500 }}>{email}</span>. It expires in one hour and can only be used once.</p>
              <div style={{ marginTop: 26, padding: "18px 20px", borderRadius: 10, background: "rgba(21,20,15,.045)", fontSize: 14, lineHeight: 1.55, color: "#5C574B" }}>
                Nothing arrived? Check spam, then <span {...clickable(() => go("forgot"))} style={{ color: "#C6461B", fontWeight: 500, cursor: "pointer" }}>send it again</span>. If the address has no account we still show this screen — we will not confirm who is registered.
              </div>
              <button type="button" onClick={() => go("login")} className="btn-outline-dark2" style={{ appearance: "none", width: "100%", fontFamily: "inherit", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", height: 50, marginTop: 22, border: "1px solid rgba(21,20,15,.18)", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Back to log in</button>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={submit} noValidate style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>Choose a new password.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>This link works once and expires one hour after it was sent.</p>
              {ErrorNote}
              <div style={{ ...fieldLabel, marginTop: 30 }}>NEW PASSWORD</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, height: 48, marginTop: 10, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                <input type={reveal ? "text" : "password"} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={`At least ${MIN_PASSWORD} characters`} style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, letterSpacing: ".06em", outline: "none" }} />
                <button type="button" onClick={() => setReveal((r) => !r)} aria-label={reveal ? "Hide password" : "Show password"} className="mono link-accent" style={{ appearance: "none", border: 0, background: "transparent", padding: 0, fontSize: 9, letterSpacing: ".12em", color: "#8C8578", cursor: "pointer", whiteSpace: "nowrap" }}>{reveal ? "HIDE" : "SHOW"}</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <div style={{ flex: 1, display: "flex", gap: 4 }}>
                  {[0, 1, 2, 3].map((i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < strength ? sCol : "rgba(21,20,15,.1)" }} />)}
                </div>
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: sCol === "rgba(21,20,15,.1)" ? "#A8A192" : sCol, whiteSpace: "nowrap" }}>{sLab}</span>
              </div>
              <div style={{ ...fieldLabel, marginTop: 22 }}>CONFIRM PASSWORD</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, height: 48, marginTop: 10, padding: "0 15px", border: `1px solid ${pw2.length > 0 && pw2 !== pw ? "rgba(192,57,43,.45)" : "rgba(21,20,15,.16)"}`, borderRadius: 8, background: "#fff" }}>
                <input type={reveal ? "text" : "password"} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Type it again" style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, letterSpacing: ".06em", outline: "none" }} />
                {pw2.length > 0 && pw2 === pw && <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 7.2 5.6 9.8 11 4.4" stroke="#5C9E72" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              {pw2.length > 0 && pw2 !== pw && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#C0392B", flex: "none" }} />
                  <span style={{ fontSize: 13, color: "#A03227" }}>These do not match yet.</span>
                </div>
              )}
              <button type="submit" disabled={!resetOk || busy} style={{ appearance: "none", border: 0, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 11, height: 52, marginTop: 26, borderRadius: 8, cursor: resetOk ? "pointer" : "not-allowed", background: resetOk ? "#E4622F" : "rgba(21,20,15,.1)", color: resetOk ? "#fff" : "#A8A192", fontSize: 15.5, fontWeight: 600, letterSpacing: "-.015em" }}>
                {busy && Spinner}{busy ? "Saving…" : "Set password and sign in"}
              </button>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#8C8578", marginTop: 16 }}>Every other session will be signed out. Your plans and constraints are untouched.</div>
            </form>
          )}

          {mode === "expired" && (
            <form onSubmit={submit} noValidate style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E0A33C" }} />
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A0701A" }}>LINK EXPIRED</span>
              </div>
              <h1 style={{ margin: "20px 0 0", fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>That reset link is no longer valid.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>Reset links last one hour and work once. This one was either used already or has timed out — neither is a problem, just request another.</p>
              <button type="button" onClick={() => go("forgot")} className="btn-dark-to-accent" style={{ appearance: "none", border: 0, width: "100%", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", height: 52, marginTop: 28, background: "#E4622F", color: "#fff", borderRadius: 8, fontSize: 15.5, fontWeight: 600, cursor: "pointer" }}>Send a new link</button>
              <button type="button" onClick={() => go("login")} className="btn-outline-dark2" style={{ appearance: "none", width: "100%", fontFamily: "inherit", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", height: 50, marginTop: 10, border: "1px solid rgba(21,20,15,.18)", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Back to log in</button>
            </form>
          )}

          {mode === "verify-pending" && (
            <form onSubmit={submit} noValidate style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: "50%", background: "rgba(92,158,114,.14)" }}>
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="#3E7B55" strokeWidth={1.6} /><path d="M3.2 5.5 10 11l6.8-5.5" stroke="#3E7B55" strokeWidth={1.6} strokeLinecap="round" /></svg>
              </span>
              <h1 style={{ margin: "22px 0 0", fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>Confirm your email.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>We sent a link to <span style={{ color: "#15140F", fontWeight: 500 }}>{email}</span>. Open it and your account is live.</p>
              <div
                onClick={() => void client.POST("/api/v1/auth/resend-verification")}
                className="btn-outline-dark2"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 50, marginTop: 22, border: "1px solid rgba(21,20,15,.18)", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
              >
                Send it again
              </div>
            </form>
          )}

          {mode === "verify" && (
            <form onSubmit={submit} noValidate style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: "50%", background: "#5C9E72" }}>
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none"><path d="M4.5 10.5 8 14l7.5-7.5" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={64} style={{ animation: "draw .6s .2s cubic-bezier(.16,1,.3,1) both" }} /></svg>
              </span>
              <h1 style={{ margin: "22px 0 0", fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>Email verified.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>Your account is live. Three short questions and the solver knows enough to be useful.</p>
              <Link href={routes.onboarding} className="btn-dark-to-accent" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 52, marginTop: 28, background: "#E4622F", color: "#fff", borderRadius: 8, fontSize: 15.5, fontWeight: 600, letterSpacing: "-.015em" }}>Continue to setup</Link>
              <Link href={routes.races} className="btn-outline-dark2" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 50, marginTop: 10, border: "1px solid rgba(21,20,15,.18)", borderRadius: 8, fontSize: 15, fontWeight: 600 }}>Skip — just browse courses</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
