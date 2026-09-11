"use client";

/**
 * Add a race the calendar does not carry.
 *
 * Three steps, in the order an athlete meets them: describe the event, upload a
 * route file per leg, build. The route through them is deliberately not a
 * wizard that hides what is behind it — the whole state is on one page, because
 * the thing an athlete most needs to see when a build fails is which file it
 * was about.
 *
 * The build is the same ingest the official calendar goes through: the route is
 * resampled to the same 10 m nodes, the elevation is sampled from terrain
 * rather than read out of the file, and the result is validated by the same
 * rules. A course added here is not a lesser course; it is simply private to
 * the athlete who added it.
 */

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { Skeleton } from "@/components/Skeleton";
import { routes, courseReconHref } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/api/account";
import {
  LEGS,
  statusCopy,
  useCreateSubmission,
  useDeleteSubmission,
  useSubmissions,
  useSubmitCourse,
  useUploadLeg,
  type Leg,
  type Submission,
} from "@/lib/api/submissions";

const CARD: React.CSSProperties = {
  background: "#FBF8F2",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)",
};

const DISTANCES = ["Full", "70.3", "Olympic", "Sprint"] as const;

const LEG_COPY: Record<Leg, { name: string; hint: string }> = {
  SWIM: { name: "Swim", hint: "The buoy course, as one line. Every lap." },
  BIKE: { name: "Bike", hint: "The whole bike leg, including every lap of a multi-lap course." },
  RUN: { name: "Run", hint: "The whole run leg, including every lap." },
};

// ---------------------------------------------------------------------------
// Step 1 — describe the event
// ---------------------------------------------------------------------------

function DetailsForm({ onCreated }: { onCreated: (submission: Submission) => void }) {
  const create = useCreateSubmission();
  const [problem, setProblem] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setProblem(null);
        const form = new FormData(event.currentTarget);
        const lat = Number(form.get("lat"));
        const lng = Number(form.get("lng"));
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setProblem("Enter the race village's coordinates as two decimal numbers.");
          return;
        }
        create.mutate(
          {
            name: String(form.get("name") ?? "").trim(),
            place: String(form.get("place") ?? "").trim(),
            country: String(form.get("country") ?? "").trim().toUpperCase() || null,
            timezone: String(form.get("timezone") ?? "").trim(),
            distance_type: form.get("distance_type") as (typeof DISTANCES)[number],
            lat,
            lng,
            event_date: (form.get("event_date") as string) || null,
            start_time_local: (form.get("start_time_local") as string) || null,
            notes: String(form.get("notes") ?? "").trim() || null,
          },
          {
            onSuccess: onCreated,
            onError: (error) =>
              setProblem(
                error instanceof ApiError ? error.message : "That could not be saved. Try again.",
              ),
          },
        );
      }}
      style={{ ...CARD, padding: "30px 34px" }}
    >
      <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>STEP 1 · THE EVENT</div>
      <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-.03em", marginTop: 12 }}>
        Which race, and where.
      </div>
      <p style={{ margin: "10px 0 0", maxWidth: 600, fontSize: 14.5, lineHeight: 1.55, color: "#6B6455" }}>
        The coordinates are the race village — the point the map is centred on and the terrain is
        cut around. You can read them off the pin on any map; they do not have to be exact to the
        metre.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "20px 24px", marginTop: 26 }}>
        <Field label="RACE NAME" name="name" placeholder="IRONMAN 70.3 …" required span={2} />
        <Field label="PLACE" name="place" placeholder="Cervia, Italy" required />
        <Field label="COUNTRY" name="country" placeholder="IT" maxLength={2} />
        <Field label="LATITUDE" name="lat" placeholder="44.2646" required />
        <Field label="LONGITUDE" name="lng" placeholder="12.3556" required />
        <div>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>DISTANCE</div>
          <select name="distance_type" defaultValue="70.3" style={inputStyle}>
            {DISTANCES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <Field label="TIME ZONE" name="timezone" placeholder="Europe/Rome" required />
        <Field label="RACE DATE" name="event_date" type="date" />
        <Field label="START TIME" name="start_time_local" type="time" />
        <Field label="ANYTHING ELSE" name="notes" placeholder="Two-lap run, rolling start…" span={2} />
      </div>

      {problem && (
        <div style={{ marginTop: 20, padding: "13px 15px", borderRadius: 8, background: "rgba(192,57,43,.06)", border: "1px solid rgba(192,57,43,.3)", fontSize: 14, lineHeight: 1.5, color: "#3D3A31" }}>
          {problem}
        </div>
      )}

      <button
        type="submit"
        disabled={create.isPending}
        className="btn-accent"
        style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 26px", marginTop: 24, background: "#E4622F", color: "#fff", border: 0, borderRadius: 7, fontSize: 15, fontWeight: 600, cursor: create.isPending ? "progress" : "pointer" }}
      >
        {create.isPending ? "Saving…" : "Next — the route files"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  marginTop: 10,
  padding: "0 14px",
  border: "1px solid rgba(21,20,15,.16)",
  borderRadius: 8,
  background: "#fff",
  fontSize: 15,
  color: "#15140F",
  outline: "none",
};

function Field({
  label,
  name,
  placeholder,
  required,
  type = "text",
  maxLength,
  span,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
  span?: number;
}) {
  return (
    <div style={span ? { gridColumn: `span ${span}` } : undefined}>
      <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>
        {label}
        {required ? "" : " · OPTIONAL"}
      </div>
      <input name={name} type={type} placeholder={placeholder} required={required} maxLength={maxLength} style={inputStyle} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 and 3 — files, then the build
// ---------------------------------------------------------------------------

function LegUpload({ submission, leg }: { submission: Submission; leg: Leg }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadLeg();
  const [problem, setProblem] = useState<string | null>(null);

  const filename = submission.file_names?.[leg];
  const done = Boolean(filename);

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 18, padding: "18px 20px", borderRadius: 10,
        background: done ? "rgba(124,192,143,.08)" : "rgba(255,255,255,.65)",
        border: `1px solid ${problem ? "rgba(192,57,43,.35)" : done ? "rgba(124,192,143,.4)" : "rgba(21,20,15,.1)"}`,
      }}
    >
      <span
        style={{
          width: 22, height: 22, borderRadius: "50%", flex: "none",
          background: done ? "#5C9E72" : "transparent",
          border: done ? "none" : "1.5px solid rgba(21,20,15,.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 12,
        }}
      >
        {done ? "✓" : ""}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: "-.018em" }}>{LEG_COPY[leg].name}</div>
        <div style={{ fontSize: 13, lineHeight: 1.45, color: problem ? "#A03227" : "#6B6455", marginTop: 5 }}>
          {problem ?? (filename ? filename : LEG_COPY[leg].hint)}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept=".gpx"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setProblem(null);
          upload.mutate(
            { id: submission.id, leg, file },
            {
              onError: (error) =>
                setProblem(
                  error instanceof ApiError
                    ? error.message
                    : "That file could not be read as GPX.",
                ),
            },
          );
        }}
      />
      <span
        onClick={() => !upload.isPending && input.current?.click()}
        className="row-hover-border"
        style={{ display: "inline-flex", alignItems: "center", height: 40, padding: "0 16px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: upload.isPending ? "progress" : "pointer", whiteSpace: "nowrap", flex: "none", background: "#fff" }}
      >
        {upload.isPending ? "Checking…" : done ? "Replace" : "Choose a .gpx"}
      </span>
    </div>
  );
}

function SubmissionPanel({ submission }: { submission: Submission }) {
  const submit = useSubmitCourse();
  const remove = useDeleteSubmission();
  const status = statusCopy(submission.status);
  const missing = submission.missing_legs ?? [];
  const problems = submission.problems ?? [];

  return (
    <div style={{ ...CARD, padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.tone, flex: "none" }} />
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: status.tone }}>{status.label}</span>
          </div>
          <div style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-.03em", marginTop: 10 }}>{submission.name}</div>
          <div style={{ fontSize: 13.5, color: "#8C8578", marginTop: 6 }}>
            {submission.place} · {submission.distance_type}
            {submission.event_date ? ` · ${formatDate(submission.event_date)}` : ""}
          </div>
          <div style={{ fontSize: 13.5, color: "#6B6455", marginTop: 10 }}>{status.note}</div>
        </div>
        <span
          onClick={() => remove.mutate(submission.id)}
          className="mono link-accent"
          style={{ fontSize: 9, letterSpacing: ".12em", color: "#A8A192", cursor: "pointer", flex: "none" }}
        >
          {remove.isPending ? "REMOVING…" : "REMOVE"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        {LEGS.map((leg) => <LegUpload key={leg} submission={submission} leg={leg} />)}
      </div>

      {problems.length > 0 && (
        <div style={{ marginTop: 20, padding: "18px 20px", borderRadius: 10, background: "rgba(192,57,43,.05)", border: "1px solid rgba(192,57,43,.3)" }}>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A03227" }}>
            NOTHING WAS BUILT
          </div>
          <ul style={{ margin: "12px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 9 }}>
            {problems.map((problem, index) => (
              <li key={index} style={{ fontSize: 14, lineHeight: 1.55, color: "#3D3A31" }}>{problem}</li>
            ))}
          </ul>
          <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.5, color: "#6B6455" }}>
            Your files are still here. Replace the one this is about and build again.
          </p>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        {submission.status === "ready" && submission.course_id ? (
          <>
            <Link
              href={routes.planBuilder}
              className="btn-accent"
              style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 24px", background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}
            >
              Plan this race
            </Link>
            <Link
              href={courseReconHref(submission.course_id)}
              className="btn-outline-dark2"
              style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 7, fontSize: 15, fontWeight: 600 }}
            >
              See the course
            </Link>
          </>
        ) : (
          <button
            type="button"
            disabled={missing.length > 0 || submit.isPending}
            onClick={() => submit.mutate(submission.id)}
            className="btn-accent"
            style={{
              display: "inline-flex", alignItems: "center", height: 46, padding: "0 24px", border: 0, borderRadius: 7,
              background: missing.length > 0 ? "rgba(21,20,15,.12)" : "#E4622F",
              color: missing.length > 0 ? "#8C8578" : "#fff",
              fontSize: 15, fontWeight: 600,
              cursor: missing.length > 0 ? "not-allowed" : submit.isPending ? "progress" : "pointer",
            }}
          >
            {submit.isPending ? "Building the course…" : "Build the course"}
          </button>
        )}
        {missing.length > 0 && (
          <span style={{ fontSize: 13.5, color: "#8C8578" }}>
            Still needs {missing.map((leg) => leg.toLowerCase()).join(", ")}.
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function AddRacePage() {
  const { data, isPending } = useSubmissions();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const submissions = useMemo(() => data ?? [], [data]);
  const current = submissions.find((s) => s.id === openId) ?? submissions[0];
  const showForm = adding || (!isPending && submissions.length === 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AppHeader active="races" ctaLabel="My plans" ctaHref={routes.myPlans} />

      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "52px 56px 0" }}>
        <Reveal className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>
          NOT ON THE CALENDAR
        </Reveal>
        <Reveal as="h1" delay={0.05} style={{ margin: "16px 0 0", fontSize: 62, lineHeight: 0.94, fontWeight: 600, letterSpacing: "-.05em" }}>
          Add your own race.
        </Reveal>
        <Reveal as="p" delay={0.1} style={{ margin: "15px 0 0", maxWidth: 620, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
          You already have the route files — from the athlete guide, or traced from the published
          course map. Upload one per leg and the same ingest the official calendar goes through
          builds you a course: resampled to 10 m nodes, elevation sampled from terrain rather than
          read out of your file, and validated by the same rules.
        </Reveal>
      </section>

      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "32px 56px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 32, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {isPending ? (
              <div style={{ ...CARD, padding: 32 }}><Skeleton width="100%" height={220} /></div>
            ) : showForm ? (
              <DetailsForm
                onCreated={(submission) => {
                  setAdding(false);
                  setOpenId(submission.id);
                }}
              />
            ) : current ? (
              <SubmissionPanel submission={current} />
            ) : null}

            {!showForm && (
              <span
                onClick={() => setAdding(true)}
                className="row-hover-border"
                style={{ display: "inline-flex", alignItems: "center", alignSelf: "flex-start", height: 44, padding: "0 18px", border: "1px dashed rgba(21,20,15,.22)", borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#5C574B" }}
              >
                + Add another race
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 100 }}>
            {submissions.length > 0 && (
              <div style={{ ...CARD, padding: "22px 24px" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>RACES YOU HAVE ADDED</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 14 }}>
                  {submissions.map((s) => {
                    const on = s.id === current?.id && !showForm;
                    const status = statusCopy(s.status);
                    return (
                      <div
                        key={s.id}
                        onClick={() => { setAdding(false); setOpenId(s.id); }}
                        className="row-hover-faint"
                        style={{ padding: "12px 13px", borderRadius: 7, cursor: "pointer", background: on ? "rgba(21,20,15,.055)" : "transparent" }}
                      >
                        <div style={{ fontSize: 14, fontWeight: on ? 600 : 500, letterSpacing: "-.015em" }}>{s.name}</div>
                        <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: status.tone, marginTop: 5 }}>
                          {status.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ ...CARD, padding: "24px 26px" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>WHAT HAPPENS TO YOUR FILES</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18 }}>
                {[
                  {
                    q: "Who sees this course?",
                    a: "Only you. Your file may be an organiser's licensed course data, and republishing it to everyone is not ours to do.",
                  },
                  {
                    q: "Why not use my file's elevation?",
                    a: "A watch altimeter drifts tens of metres over a long ride and swings with the weather. The solver reads gradient straight off the route, so a noisy profile does not make a slightly wrong plan — it makes one that invents climbs.",
                  },
                  {
                    q: "What if it refuses my file?",
                    a: "It tells you which leg and why, keeps the files you already uploaded, and lets you replace the one it is about. Nothing half-built reaches the directory.",
                  },
                ].map((item) => (
                  <div key={item.q}>
                    <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.016em" }}>{item.q}</div>
                    <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.55, color: "#6B6455" }}>{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ marginTop: 88 }}>
        <Footer />
      </div>
    </div>
  );
}

export default function GuardedAddRacePage() {
  return (
    <GuardedPage>
      <AddRacePage />
    </GuardedPage>
  );
}
