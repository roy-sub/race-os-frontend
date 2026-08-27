"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mark } from "./Mark";
import { MediaPlaceholder } from "./MediaPlaceholder";
import { CountUp } from "./CountUp";
import { routes } from "@/lib/routes";

type Mode = "signup" | "login" | "forgot" | "sent" | "reset" | "expired" | "verify";

const OAUTH = [
  { name: "Continue with Apple", tone: "#15140F" },
  { name: "Continue with Google", tone: "#C4BCAC" },
];

const JUMPS: { name: string; k: Mode }[] = [
  { name: "SIGNUP", k: "signup" },
  { name: "LOGIN", k: "login" },
  { name: "FORGOT", k: "forgot" },
  { name: "SENT", k: "sent" },
  { name: "RESET", k: "reset" },
  { name: "EXPIRED", k: "expired" },
  { name: "VERIFIED", k: "verify" },
];

const fieldLabel = { fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: ".15em", color: "#8C8578" } as const;

export default function AuthScreen({ initialMode = "signup" }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("elena.marsh@gmail.com");
  const [pw, setPw] = useState("tramuntana26");
  const [pw2, setPw2] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const emailOk = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email);
  const emailBad = email.length > 3 && !emailOk;
  const n = pw.length;
  const strength = n === 0 ? 0 : n < 8 ? 1 : n < 12 ? 2 : /[^a-z]/i.test(pw) ? 4 : 3;
  const sCol = ["rgba(21,20,15,.1)", "#C0392B", "#E0A33C", "#5C9E72", "#3E7B55"][strength];
  const sLab = ["", "TOO SHORT", "FAIR", "STRONG", "VERY STRONG"][strength];

  const go = (m: Mode) => { setMode(m); setBusy(false); setLoginError(false); };

  const submit = () => {
    if (busy) return;
    if (mode === "signup" && !emailOk) return;
    if (mode === "reset" && (pw2 !== pw || n < 10)) return;
    setBusy(true);
    timer.current = setTimeout(() => {
      if (mode === "signup") { setBusy(false); setMode("verify"); }
      else if (mode === "forgot") { setBusy(false); setMode("sent"); }
      else if (mode === "reset") { setBusy(false); setMode("verify"); }
      else { setBusy(false); setLoginError((e) => !e); }
    }, 1200);
  };

  const canSubmit = mode !== "signup" || (emailOk && n >= 10);
  const subLabel = busy
    ? mode === "login" ? "Checking…" : mode === "forgot" ? "Sending…" : "Creating account…"
    : mode === "login" ? "Log in" : mode === "forgot" ? "Send reset link" : "Create free account";
  const resetOk = pw2 === pw && n >= 10;

  const OAuthButtons = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: mode === "signup" ? 30 : 28 }}>
      {OAUTH.map((o) => (
        <div key={o.name} className="row-hover-border" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, height: 48, border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 500, letterSpacing: "-.015em" }}>
          <span style={{ width: 17, height: 17, borderRadius: 4, background: o.tone, flex: "none" }} />{o.name}
        </div>
      ))}
    </div>
  );

  const OrDivider = (
    <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "26px 0" }}>
      <span style={{ flex: 1, height: 1, background: "rgba(21,20,15,.12)" }} />
      <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#A8A192" }}>OR WITH EMAIL</span>
      <span style={{ flex: 1, height: 1, background: "rgba(21,20,15,.12)" }} />
    </div>
  );

  const Spinner = <span style={{ display: "block", width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "spin .8s linear infinite", flex: "none" }} />;

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.06fr)" }}>
      <div style={{ position: "relative", background: "#1C1916", overflow: "hidden" }}>
        <MediaPlaceholder path="assets/auth/dawn-transition.jpg" background="linear-gradient(158deg,#3E352B 0%,#231E19 48%,#12100E 100%)" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(12,11,10,.9) 0%,rgba(12,11,10,.28) 52%,rgba(12,11,10,.5) 100%)" }} />
        <div style={{ position: "absolute", left: 52, top: 44, display: "flex", alignItems: "center", gap: 11 }}>
          <Mark width={26} height={17} />
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.035em", color: "#FBF8F2" }}>RaceOS</span>
        </div>
        <div style={{ position: "absolute", left: 52, bottom: 52, right: 52 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "rgba(255,255,255,.35)", marginBottom: 22 }}>ASSETS/AUTH/DAWN-TRANSITION.JPG · 4:5 PORTRAIT</div>
          <div style={{ fontSize: 44, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em", color: "#FBF8F2", maxWidth: 400 }}>Nobody fails at this on fitness.</div>
          <div style={{ fontSize: 16, lineHeight: 1.5, color: "rgba(255,255,255,.6)", maxWidth: 360, marginTop: 16 }}>They fail on logistics, a fuelling number nobody checked, and a cut-off they never modelled.</div>
          <div style={{ display: "flex", gap: 40, marginTop: 38, paddingTop: 26, borderTop: "1px solid rgba(255,255,255,.14)" }}>
            {[
              { v: 412, dec: 0, suffix: "", label: "COURSES" },
              { v: 3.1, dec: 1, suffix: "s", label: "MEDIAN SOLVE" },
              { v: 5, dec: 0, suffix: "", label: "BAGS PACKED" },
            ].map((s) => (
              <div key={s.label}>
                <div className="mono" style={{ fontSize: 24, letterSpacing: "-.03em", color: "#FBF8F2" }}><CountUp value={s.v} decimals={s.dec} suffix={s.suffix} /></div>
                <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "rgba(255,255,255,.4)", marginTop: 7 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "56px 88px" }}>
        <div style={{ maxWidth: 430, width: "100%" }}>
          <div style={{ display: "flex", gap: 3, padding: 3, background: "rgba(21,20,15,.06)", borderRadius: 7, marginBottom: 36 }}>
            {[{ name: "Create account", k: "signup" as Mode }, { name: "Log in", k: "login" as Mode }].map((m) => {
              const on = (mode === "signup" && m.k === "signup") || (["login", "forgot", "sent", "reset", "expired"].includes(mode) && m.k === "login");
              return (
                <div key={m.k} onClick={() => go(m.k)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 38, borderRadius: 5, cursor: "pointer", background: on ? "#FBF8F2" : "transparent", fontSize: 14, fontWeight: on ? 600 : 500, letterSpacing: "-.015em", color: on ? "#15140F" : "#8C8578" }}>
                  {m.name}
                </div>
              );
            })}
          </div>

          {mode === "signup" && (
            <div style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>Start with your own course.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>Course recon is free and needs no card. You pay only when you want a solved plan.</p>
              {OAuthButtons}
              {OrDivider}
              <div style={fieldLabel}>EMAIL</div>
              <div style={{ display: "flex", alignItems: "center", height: 48, marginTop: 10, padding: "0 15px", border: `1px solid ${emailBad ? "rgba(192,57,43,.45)" : "rgba(21,20,15,.16)"}`, borderRadius: 8, background: "#fff" }}>
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, outline: "none" }} />
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
                <input type="text" value={reveal ? pw : "•".repeat(n)} onChange={(e) => setPw(e.target.value.replace(/•/g, "") || pw)} placeholder="At least 10 characters" style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, letterSpacing: ".06em", outline: "none" }} />
                <span onClick={() => setReveal((r) => !r)} className="mono link-accent" style={{ fontSize: 9, letterSpacing: ".12em", color: "#8C8578", cursor: "pointer", whiteSpace: "nowrap" }}>{reveal ? "HIDE" : "SHOW"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <div style={{ flex: 1, display: "flex", gap: 4 }}>
                  {[0, 1, 2, 3].map((i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < strength ? sCol : "rgba(21,20,15,.1)" }} />)}
                </div>
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: sCol === "rgba(21,20,15,.1)" ? "#A8A192" : sCol, whiteSpace: "nowrap" }}>{sLab}</span>
              </div>
              <div onClick={submit} className="pay-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, height: 52, marginTop: 26, borderRadius: 8, cursor: canSubmit ? "pointer" : "not-allowed", background: canSubmit ? "#E4622F" : "rgba(21,20,15,.1)", color: canSubmit ? "#fff" : "#A8A192", fontSize: 15.5, fontWeight: 600, letterSpacing: "-.015em" }}>
                {busy && Spinner}{subLabel}
              </div>
              <p style={{ margin: "18px 0 0", fontSize: 12.5, lineHeight: 1.55, color: "#8C8578" }}>
                By creating an account you agree to the <a href="#" style={{ color: "#5C574B", textDecoration: "underline" }}>terms</a> and <a href="#" style={{ color: "#5C574B", textDecoration: "underline" }}>privacy policy</a>. We never sell your training data.
              </p>
            </div>
          )}

          {mode === "login" && (
            <div style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>Welcome back.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>Six days to Tramuntana Full. Your plan is where you left it.</p>
              {loginError && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginTop: 24, padding: "15px 17px", borderRadius: 9, background: "rgba(192,57,43,.08)", border: "1px solid rgba(192,57,43,.3)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C0392B", flex: "none", marginTop: 6 }} />
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: "#3D3A31" }}>That email and password do not match. Two attempts left before a temporary lock.</span>
                </div>
              )}
              {OAuthButtons}
              {OrDivider}
              <div style={fieldLabel}>EMAIL</div>
              <div style={{ display: "flex", alignItems: "center", height: 48, marginTop: 10, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, outline: "none" }} />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 22 }}>
                <span style={fieldLabel}>PASSWORD</span>
                <span onClick={() => go("forgot")} className="mono link-accent" style={{ fontSize: 9, letterSpacing: ".12em", color: "#C6461B", cursor: "pointer" }}>FORGOT IT?</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, height: 48, marginTop: 10, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                <input type="text" value={reveal ? pw : "•".repeat(n)} onChange={(e) => setPw(e.target.value.replace(/•/g, "") || pw)} style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, letterSpacing: ".06em", outline: "none" }} />
                <span onClick={() => setReveal((r) => !r)} className="mono link-accent" style={{ fontSize: 9, letterSpacing: ".12em", color: "#8C8578", cursor: "pointer", whiteSpace: "nowrap" }}>{reveal ? "HIDE" : "SHOW"}</span>
              </div>
              <div onClick={submit} className="btn-dark-to-accent" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, height: 52, marginTop: 26, borderRadius: 8, cursor: "pointer", background: "#E4622F", color: "#fff", fontSize: 15.5, fontWeight: 600, letterSpacing: "-.015em" }}>
                {busy && Spinner}{subLabel}
              </div>
            </div>
          )}

          {mode === "forgot" && (
            <div style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>Reset your password.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>Enter the email on your account and we will send a link valid for one hour.</p>
              <div style={{ ...fieldLabel, marginTop: 30 }}>EMAIL</div>
              <div style={{ display: "flex", alignItems: "center", height: 48, marginTop: 10, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, outline: "none" }} />
              </div>
              <div onClick={submit} className="btn-dark-to-accent" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, height: 52, marginTop: 24, borderRadius: 8, cursor: "pointer", background: "#E4622F", color: "#fff", fontSize: 15.5, fontWeight: 600, letterSpacing: "-.015em" }}>
                {busy && Spinner}{subLabel}
              </div>
              <div onClick={() => go("login")} className="link-accent" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 44, marginTop: 10, fontSize: 14.5, fontWeight: 500, color: "#5C574B", cursor: "pointer" }}>Back to log in</div>
            </div>
          )}

          {mode === "sent" && (
            <div style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: "50%", background: "rgba(92,158,114,.14)" }}>
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="#3E7B55" strokeWidth={1.6} /><path d="M3.2 5.5 10 11l6.8-5.5" stroke="#3E7B55" strokeWidth={1.6} strokeLinecap="round" /></svg>
              </span>
              <h1 style={{ margin: "22px 0 0", fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>Check your inbox.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>We sent a reset link to <span style={{ color: "#15140F", fontWeight: 500 }}>{email}</span>. It expires in one hour and can only be used once.</p>
              <div style={{ marginTop: 26, padding: "18px 20px", borderRadius: 10, background: "rgba(21,20,15,.045)", fontSize: 14, lineHeight: 1.55, color: "#5C574B" }}>
                Nothing arrived? Check spam, then <span onClick={() => setBusy(false)} style={{ color: "#C6461B", fontWeight: 500, cursor: "pointer" }}>send it again</span>. If the address has no account we still show this screen — we will not confirm who is registered.
              </div>
              <div onClick={() => go("login")} className="btn-outline-dark2" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 50, marginTop: 22, border: "1px solid rgba(21,20,15,.18)", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Back to log in</div>
            </div>
          )}

          {mode === "reset" && (
            <div style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>Choose a new password.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>
                Resetting for <span style={{ color: "#15140F", fontWeight: 500 }}>{email}</span>. This link works once and expires in <span className="mono">42 min</span>.
              </p>
              <div style={{ ...fieldLabel, marginTop: 30 }}>NEW PASSWORD</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, height: 48, marginTop: 10, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                <input type="text" value={reveal ? pw : "•".repeat(n)} onChange={(e) => setPw(e.target.value.replace(/•/g, "") || pw)} placeholder="At least 10 characters" style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, letterSpacing: ".06em", outline: "none" }} />
                <span onClick={() => setReveal((r) => !r)} className="mono link-accent" style={{ fontSize: 9, letterSpacing: ".12em", color: "#8C8578", cursor: "pointer", whiteSpace: "nowrap" }}>{reveal ? "HIDE" : "SHOW"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <div style={{ flex: 1, display: "flex", gap: 4 }}>
                  {[0, 1, 2, 3].map((i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < strength ? sCol : "rgba(21,20,15,.1)" }} />)}
                </div>
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: sCol === "rgba(21,20,15,.1)" ? "#A8A192" : sCol, whiteSpace: "nowrap" }}>{sLab}</span>
              </div>
              <div style={{ ...fieldLabel, marginTop: 22 }}>CONFIRM PASSWORD</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, height: 48, marginTop: 10, padding: "0 15px", border: `1px solid ${pw2.length > 0 && pw2 !== pw ? "rgba(192,57,43,.45)" : "rgba(21,20,15,.16)"}`, borderRadius: 8, background: "#fff" }}>
                <input type="text" value={reveal ? pw2 : "•".repeat(pw2.length)} onChange={(e) => setPw2(e.target.value.replace(/•/g, ""))} placeholder="Type it again" style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, letterSpacing: ".06em", outline: "none" }} />
                {pw2.length > 0 && pw2 === pw && <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 7.2 5.6 9.8 11 4.4" stroke="#5C9E72" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              {pw2.length > 0 && pw2 !== pw && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#C0392B", flex: "none" }} />
                  <span style={{ fontSize: 13, color: "#A03227" }}>These do not match yet.</span>
                </div>
              )}
              <div onClick={submit} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, height: 52, marginTop: 26, borderRadius: 8, cursor: resetOk ? "pointer" : "not-allowed", background: resetOk ? "#E4622F" : "rgba(21,20,15,.1)", color: resetOk ? "#fff" : "#A8A192", fontSize: 15.5, fontWeight: 600, letterSpacing: "-.015em" }}>
                {busy && Spinner}{busy ? "Saving…" : "Set password and sign in"}
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#8C8578", marginTop: 16 }}>Every other session will be signed out. Your plans and constraints are untouched.</div>
            </div>
          )}

          {mode === "expired" && (
            <div style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E0A33C" }} />
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A0701A" }}>LINK EXPIRED</span>
              </div>
              <h1 style={{ margin: "20px 0 0", fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>That reset link is no longer valid.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>Reset links last one hour and work once. This one was either used already or has timed out — neither is a problem, just request another.</p>
              <div onClick={() => go("forgot")} className="btn-dark-to-accent" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 52, marginTop: 28, background: "#E4622F", color: "#fff", borderRadius: 8, fontSize: 15.5, fontWeight: 600, cursor: "pointer" }}>Send a new link</div>
              <div onClick={() => go("login")} className="btn-outline-dark2" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 50, marginTop: 10, border: "1px solid rgba(21,20,15,.18)", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Back to log in</div>
            </div>
          )}

          {mode === "verify" && (
            <div style={{ animation: "rise .55s cubic-bezier(.16,1,.3,1) both" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: "50%", background: "#5C9E72" }}>
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none"><path d="M4.5 10.5 8 14l7.5-7.5" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={64} style={{ animation: "draw .6s .2s cubic-bezier(.16,1,.3,1) both" }} /></svg>
              </span>
              <h1 style={{ margin: "22px 0 0", fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>Email verified.</h1>
              <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.5, color: "#5C574B" }}>Your account is live. Three short questions and the solver knows enough to be useful.</p>
              <Link href={routes.onboarding} className="btn-dark-to-accent" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 52, marginTop: 28, background: "#E4622F", color: "#fff", borderRadius: 8, fontSize: 15.5, fontWeight: 600, letterSpacing: "-.015em" }}>Continue to setup</Link>
              <Link href={routes.courseRecon} className="btn-outline-dark2" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 50, marginTop: 10, border: "1px solid rgba(21,20,15,.18)", borderRadius: 8, fontSize: 15, fontWeight: 600 }}>Skip — just browse courses</Link>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 44, paddingTop: 22, borderTop: "1px solid rgba(21,20,15,.1)" }}>
            <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>STATES</span>
            <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
              {JUMPS.map((j) => (
                <span key={j.k} onClick={() => go(j.k)} className="mono" style={{ fontSize: 8.5, letterSpacing: ".1em", padding: "5px 9px", borderRadius: 4, cursor: "pointer", background: mode === j.k ? "#15140F" : "rgba(21,20,15,.06)", color: mode === j.k ? "#FBF8F2" : "#8C8578" }}>{j.name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
