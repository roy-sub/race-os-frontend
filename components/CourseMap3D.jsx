'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CourseMapEngine, DISCIPLINE_COLORS, START_GREEN } from '@/lib/map/engine.js';
import kalmarVenue from '@/lib/map/venues/kalmar.js';

const MONO = "'JetBrains Mono',ui-monospace,monospace";

const TABS = [
  { mode: 'All', label: 'ALL' },
  { mode: 'Swim', label: 'SWIM' },
  { mode: 'Bicycle', label: 'BICYCLE' },
  { mode: 'Run', label: 'RUN' },
];

/* Pin geometry. The teardrop is a square with one sharp corner turned -45deg,
   which puts that corner straight down, (size/2)·√2 below the box centre — so
   these offsets land the tip exactly on the anchor the engine projects.
   Every marker offset below is stated as an explicit left/top from the anchor
   rather than leaning on flexbox static positioning, so the geometry is
   arithmetic rather than a layout side effect. */
const EMPTY_SCENE = { markers: [], flagPts: [] };

const PIN = 15;
const PIN_LEFT = -PIN / 2;
const PIN_TOP = -PIN / 2 - (PIN / 2) * Math.SQRT2;

function pinFace(kind) { return kind === 'CUT-OFF' ? '#E8552A' : kind === 'TRANSITION' ? '#FFFFFF' : '#EDE6DA'; }
function pinDot(kind) { return kind === 'CUT-OFF' ? '#2B1409' : kind === 'TRANSITION' ? '#E8552A' : '#1A1714'; }
function pinInk(kind) { return kind === 'CUT-OFF' ? '#C6421C' : kind === 'TRANSITION' ? '#6E6459' : '#8A8177'; }

/** Zoom / reset buttons need a `:hover` swap that plain inline styles can't
 *  express — track hover locally, same visual result as the prototype's
 *  `style-hover` attribute. */
function HoverButton({ style, hoverStyle, children, ...rest }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      {...rest}
      onMouseEnter={(e) => { setHover(true); rest.onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHover(false); rest.onMouseLeave?.(e); }}
      style={{ ...style, ...(hover ? hoverStyle : null) }}
    >
      {children}
    </button>
  );
}

/**
 * The course map.
 *
 * One renderer, two kinds of venue, and the difference is visible on the card
 * rather than hidden:
 *
 * - The **showcase** venue (Kalmar) is the signed-off hero graphic. Its
 *   terrain is generated, its three legs disagree on scale by 14.5×, and its
 *   vertical is exaggerated about 40× — which is what makes the composition
 *   read, and is why `note` says so in plain words underneath it. It renders
 *   here exactly as it does in `course-map-3d`; nothing about its path
 *   changed to make room for the other kind.
 * - A **surveyed** venue carries a baked terrain field from the backend: real
 *   elevation, one horizontal scale across all three legs, and a vertical
 *   exaggeration that is computed per venue and printed in the subtitle.
 *
 * `venue` is keyed on, not just passed: a different race is a different scene,
 * a different terrain field and a different camera, so the engine is torn down
 * and rebuilt rather than mutated.
 */
export default function CourseMap3D({
  venue = kalmarVenue,
  relief = 1.5,
  contours = true,
  autoOrbit = true,
  note = null,
  attribution = null,
  height = 'min(calc(100vh - 96px),900px)',
}) {
  const stageRef = useRef(null);
  const engineRef = useRef(null);

  const elevRef = useRef(null);
  const elevBarRef = useRef(null);
  const slopeRef = useRef(null);
  const surfaceRef = useRef(null);

  /* What the engine built, handed over when it finished building it. Held in
     state rather than read off `engineRef.current` during render: a ref read
     in render is a value React never knows changed, so the overlay would be a
     frame — or a whole venue — behind. */
  const [scene, setScene] = useState(EMPTY_SCENE);
  const [mode, setMode] = useState('All');
  const [hand, setHand] = useState(true);
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [hoverFlag, setHoverFlag] = useState(null);

  useEffect(() => {
    const engine = new CourseMapEngine({ venue, relief, contours, autoOrbit });
    engineRef.current = engine;
    engine.registerReadoutEls({
      elevEl: elevRef.current,
      elevBarEl: elevBarRef.current,
      slopeEl: slopeRef.current,
      surfaceEl: surfaceRef.current,
    });
    engine.mount(stageRef.current, (built) => {
      setScene(built);
      // A new venue is a new course: the discipline tab and any pinned marker
      // belonged to the old one.
      setMode('All');
      setPinned(null);
      setHover(null);
      setHoverFlag(null);
    });
    return () => {
      engine.unmount();
      engineRef.current = null;
      setScene(EMPTY_SCENE);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue]);

  useEffect(() => { engineRef.current?.setRelief(relief); }, [relief]);
  useEffect(() => { engineRef.current?.setContours(contours); }, [contours]);
  useEffect(() => { engineRef.current?.setAutoOrbit(autoOrbit); }, [autoOrbit]);

  const { markers, flagPts } = scene;

  const visiblePins = useMemo(
    () => markers
      .map((m, i) => ({ ...m, idx: i }))
      .filter(m => mode === 'All' || m.route === mode || m.kind === 'TRANSITION'),
    [markers, mode],
  );

  function changeMode(next) {
    setMode(next);
    setPinned(null);
    engineRef.current?.setMode(next);
  }

  function toggleHand() {
    setHand(h => {
      const next = !h;
      engineRef.current?.setHand(next);
      return next;
    });
  }

  const stat = venue.stats?.[mode] ?? venue.stats?.All ?? { label: '', dist: '—', gain: '—', gainLabel: '', split: '—', splitLabel: '' };
  const stageCursor = hand ? 'grab' : 'crosshair';
  const handBg = hand ? 'rgba(232,85,42,.12)' : '#FFFFFF';
  const handFg = hand ? '#C6421C' : '#6E6459';
  const handBorder = hand ? 'rgba(232,85,42,.35)' : 'rgba(23,19,15,.08)';
  const handLabel = hand ? 'ROTATING' : 'HAND';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1440px',
        background: '#FFFFFF',
        border: '1px solid rgba(23,19,15,.09)',
        borderRadius: '14px',
        boxShadow: '0 1px 2px rgba(23,19,15,.04),0 26px 56px -44px rgba(23,19,15,.45)',
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif",
        color: '#17130F',
      }}
    >
      {/* header */}
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
          gap: '12px 24px', padding: '14px 18px 14px 20px', borderBottom: '1px solid rgba(23,19,15,.08)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '6px 12px', minWidth: 0 }}>
          <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-.025em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
            {venue.meta.title}
          </div>
          <div style={{ fontFamily: MONO, fontSize: '9.5px', letterSpacing: '.15em', color: '#8A8177', whiteSpace: 'nowrap' }}>
            {venue.meta.subtitle}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '3px', padding: '3px', borderRadius: '7px', background: '#F1ECE4', border: '1px solid rgba(23,19,15,.05)' }}>
          {TABS.map(t => (
            <button
              key={t.mode}
              onClick={() => changeMode(t.mode)}
              style={{
                border: 0, cursor: 'pointer', borderRadius: '5px', padding: '7px 13px',
                fontFamily: MONO, fontSize: '10px', letterSpacing: '.13em',
                background: mode === t.mode ? '#E8552A' : 'transparent',
                color: mode === t.mode ? '#FFF8F2' : '#6E6459',
                transition: 'background .16s ease,color .16s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* stage */}
      <div style={{ position: 'relative', width: '100%', height, minHeight: '420px', background: '#12100E' }}>
        <div
          ref={stageRef}
          style={{
            position: 'absolute', inset: 0, cursor: stageCursor,
            background: 'radial-gradient(122% 96% at 52% 10%,#241F1A 0%,#171412 48%,#0D0C0B 100%)',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: '0 0 160px 46px rgba(8,7,6,.55) inset' }} />

        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {flagPts.map((f, i) => {
            const active = hoverFlag === i;
            const ink = f.kind === 'START' ? '#3D7A52' : '#C6421C';
            const flagBg = f.kind === 'START' ? START_GREEN : '#E8552A';
            return (
              <div
                key={i}
                ref={el => engineRef.current?.registerFlagEl(i, el)}
                onMouseEnter={() => setHoverFlag(i)}
                onMouseLeave={() => setHoverFlag(null)}
                style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'auto', cursor: 'pointer', willChange: 'transform', zIndex: 900, transition: 'opacity .16s ease' }}
              >
                <div style={{ position: 'relative', width: 0, height: 0 }}>
                  <div style={{ position: 'absolute', left: '-6px', top: '-1.75px', width: '12px', height: '3.5px', borderRadius: '50%', background: 'rgba(0,0,0,.55)', filter: 'blur(1.5px)' }} />
                  {/* pole: its base sits exactly on the anchor */}
                  <div style={{ position: 'absolute', left: '-0.9px', top: '-27px', width: '1.8px', height: '27px', background: 'linear-gradient(to top,rgba(245,241,234,.22),rgba(245,241,234,.92))' }} />
                  {/* the drop-in animation gets its own element — a CSS animation
                      overrides the whole transform property, so anything sharing
                      one with it silently loses its own transform */}
                  <div style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, animation: 'dropIn .5s cubic-bezier(.2,1.3,.4,1) both' }}>
                    <div style={{ position: 'absolute', left: '1px', top: '-27px', width: '21px', height: '14px', background: flagBg, boxShadow: '0 2px 8px rgba(0,0,0,.55)' }} />
                  </div>
                  <div style={{ position: 'absolute', left: 0, top: '-58px', transform: `translate(-50%,${active ? '0px' : '4px'})`, opacity: active ? 1 : 0, transition: 'opacity .16s ease,transform .16s ease', pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', whiteSpace: 'nowrap', background: '#FFFFFF', border: '1px solid rgba(23,19,15,.1)', borderRadius: '8px', padding: '8px 11px 9px', boxShadow: '0 16px 34px -16px rgba(12,9,7,.6)' }}>
                      <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '.15em', color: ink }}>{f.kind}</div>
                      <div style={{ fontSize: '12.5px', color: '#17130F', letterSpacing: '-.01em' }}>{f.label}</div>
                      <div style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '.06em', color: '#8A8177' }}>{f.detail}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {visiblePins.map((p, i) => {
            const active = hover === p.idx || pinned === p.idx;
            return (
              <div
                key={p.idx}
                ref={el => engineRef.current?.registerPinEl(p.idx, el)}
                onMouseEnter={() => setHover(p.idx)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setPinned(cur => (cur === p.idx ? null : p.idx))}
                style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'auto', cursor: 'pointer', willChange: 'transform', transition: 'opacity .16s ease' }}
              >
                <div style={{ position: 'relative', width: 0, height: 0 }}>
                  <div style={{ position: 'absolute', left: '-5.5px', top: '-1.75px', width: '11px', height: '3.5px', borderRadius: '50%', background: 'rgba(0,0,0,.5)', filter: 'blur(1px)' }} />
                  {/* the drop-in animation gets its own element — a CSS animation
                      overrides the whole transform property, so sharing one with
                      the pin flattened it into an unrotated square whose point
                      aimed down-left instead of at the track */}
                  <div
                    style={{
                      position: 'absolute', left: 0, top: 0, width: 0, height: 0,
                      animation: 'dropIn .45s cubic-bezier(.2,1.4,.4,1) both', animationDelay: `${i * 26}ms`,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute', left: `${PIN_LEFT}px`, top: `${PIN_TOP}px`,
                        width: `${PIN}px`, height: `${PIN}px`, borderRadius: '50% 50% 50% 0',
                        transform: 'rotate(-45deg)', background: pinFace(p.kind),
                        boxShadow: '0 2px 7px rgba(0,0,0,.55),0 0 0 1.5px rgba(13,12,11,.85)',
                      }}
                    >
                      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '4.5px', height: '4.5px', borderRadius: '50%', background: pinDot(p.kind) }} />
                    </div>
                  </div>
                  <div style={{ position: 'absolute', left: 0, top: '-36px', transform: `translate(-50%,${active ? '0px' : '4px'})`, opacity: active ? 1 : 0, transition: 'opacity .16s ease,transform .16s ease', pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', whiteSpace: 'nowrap', background: '#FFFFFF', border: '1px solid rgba(23,19,15,.1)', borderRadius: '8px', padding: '8px 11px 9px', boxShadow: '0 16px 34px -16px rgba(12,9,7,.6)' }}>
                      <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '.15em', color: pinInk(p.kind) }}>{p.kind}</div>
                      <div style={{ fontSize: '12.5px', color: '#17130F', letterSpacing: '-.01em' }}>{p.label}</div>
                      <div style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '.06em', color: '#8A8177' }}>{p.detail}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* stat card */}
        <div
          style={{
            position: 'absolute', left: '18px', bottom: '16px', display: 'flex', flexDirection: 'column', gap: 0,
            minWidth: 0, maxWidth: 'min(420px,72%)', borderRadius: '11px', background: '#FFFFFF',
            border: '1px solid rgba(23,19,15,.08)', boxShadow: '0 24px 48px -22px rgba(12,9,6,.45)', overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px 18px 15px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '.19em', color: '#8A8177', whiteSpace: 'nowrap' }}>{stat.label}</div>
            <div style={{ display: 'flex', gap: '26px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ fontFamily: MONO, fontSize: '22px', lineHeight: 1, letterSpacing: '-.04em', color: '#17130F', whiteSpace: 'nowrap' }}>{stat.dist}</div>
                <div style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '.15em', color: '#8A8177', whiteSpace: 'nowrap' }}>DISTANCE</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ fontFamily: MONO, fontSize: '22px', lineHeight: 1, letterSpacing: '-.04em', color: '#17130F', whiteSpace: 'nowrap' }}>{stat.gain}</div>
                <div style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '.15em', color: '#8A8177', whiteSpace: 'nowrap' }}>{stat.gainLabel}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ fontFamily: MONO, fontSize: '22px', lineHeight: 1, letterSpacing: '-.04em', color: '#17130F', whiteSpace: 'nowrap' }}>{stat.split}</div>
                {/* What this number is depends on the venue, so the venue
                    names it. A generated map shows a target split; a real race
                    has no target until a plan has been solved, so it shows the
                    published cut-off instead — and calling that a target would
                    be putting a number in the athlete's mouth. */}
                <div style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '.15em', color: '#8A8177', whiteSpace: 'nowrap' }}>{stat.splitLabel ?? 'TARGET SPLIT'}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '11px 18px 12px', borderTop: '1px solid rgba(23,19,15,.07)', background: 'rgba(23,19,15,.015)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '.18em', color: '#8A8177', whiteSpace: 'nowrap' }}>AT THIS POINT</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <div ref={elevRef} style={{ fontFamily: MONO, fontSize: '17px', lineHeight: 1, letterSpacing: '-.03em', color: '#17130F' }}>—</div>
                <div style={{ fontFamily: MONO, fontSize: '9.5px', color: '#8A8177' }}>m</div>
              </div>
            </div>
            <div style={{ width: '1px', height: '26px', background: 'rgba(23,19,15,.09)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 auto', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <div ref={slopeRef} style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '.1em', color: '#6E6459', whiteSpace: 'nowrap' }}>GRADE —</div>
                <div ref={surfaceRef} style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '.1em', color: '#6E6459', whiteSpace: 'nowrap' }}>NO CURSOR</div>
              </div>
              <div style={{ height: '2.5px', borderRadius: '3px', background: 'rgba(23,19,15,.09)', overflow: 'hidden' }}>
                <div ref={elevBarRef} style={{ height: '100%', width: '0%', background: 'linear-gradient(90deg,#59C3D9,#E8552A)', transition: 'width .08s linear' }} />
              </div>
            </div>
          </div>
        </div>

        {/* zoom / hand controls */}
        <div style={{ position: 'absolute', bottom: '16px', right: '18px', display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: '7px' }}>
          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', background: '#FFFFFF', border: '1px solid rgba(23,19,15,.08)', boxShadow: '0 14px 30px -18px rgba(12,9,6,.35)' }}>
            <HoverButton
              onClick={() => engineRef.current?.zoomIn()}
              style={{ border: 0, borderRight: '1px solid rgba(23,19,15,.08)', cursor: 'pointer', width: '34px', height: '34px', background: 'transparent', color: '#6E6459', fontFamily: MONO, fontSize: '14px' }}
              hoverStyle={{ background: 'rgba(23,19,15,.06)', color: '#17130F' }}
            >
              +
            </HoverButton>
            <HoverButton
              onClick={() => engineRef.current?.zoomOut()}
              style={{ border: 0, borderRight: '1px solid rgba(23,19,15,.08)', cursor: 'pointer', width: '34px', height: '34px', background: 'transparent', color: '#6E6459', fontFamily: MONO, fontSize: '14px' }}
              hoverStyle={{ background: 'rgba(23,19,15,.06)', color: '#17130F' }}
            >
              −
            </HoverButton>
            <HoverButton
              onClick={() => engineRef.current?.resetView()}
              style={{ border: 0, cursor: 'pointer', height: '34px', padding: '0 12px', background: 'transparent', color: '#6E6459', fontFamily: MONO, fontSize: '9.5px', letterSpacing: '.13em' }}
              hoverStyle={{ background: 'rgba(23,19,15,.06)', color: '#17130F' }}
            >
              RESET
            </HoverButton>
          </div>
          <button
            onClick={toggleHand}
            style={{
              display: 'flex', alignItems: 'center', gap: '9px', border: `1px solid ${handBorder}`, cursor: 'pointer',
              height: '34px', padding: '0 13px', borderRadius: '8px', background: handBg, color: handFg,
              fontFamily: MONO, fontSize: '9.5px', letterSpacing: '.14em', boxShadow: '0 14px 30px -18px rgba(12,9,6,.35)',
              transition: 'background .15s ease,color .15s ease,border-color .15s ease',
            }}
          >
            <span style={{ display: 'flex', gap: '1.5px', alignItems: 'flex-end' }}>
              <span style={{ width: '2.5px', height: '8px', borderRadius: '2px', background: 'currentColor' }} />
              <span style={{ width: '2.5px', height: '11px', borderRadius: '2px', background: 'currentColor' }} />
              <span style={{ width: '2.5px', height: '10px', borderRadius: '2px', background: 'currentColor' }} />
              <span style={{ width: '2.5px', height: '7px', borderRadius: '2px', background: 'currentColor' }} />
            </span>
            <span>{handLabel}</span>
          </button>
        </div>
      </div>

      {/* The footer the design does not have, and needs.
          A stylised map that does not say it is stylised is a claim about a
          place, not a drawing of one — so the showcase map states plainly that
          it is illustrative, and every map states where its data came from. */}
      {(note || attribution) && (
        <div
          style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
            gap: '8px 20px', padding: '10px 18px 11px 20px', borderTop: '1px solid rgba(23,19,15,.07)',
            background: 'rgba(23,19,15,.015)',
          }}
        >
          {note && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C4BCAC', flex: 'none' }} />
              <span style={{ fontSize: '12px', lineHeight: 1.45, color: '#6E6459' }}>{note}</span>
            </div>
          )}
          {attribution && (
            <div style={{ fontFamily: MONO, fontSize: '8.5px', letterSpacing: '.13em', color: '#A8A192', whiteSpace: 'nowrap' }}>
              {attribution.toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// re-exported for consumers that want the discipline palette without reaching into the engine module
export { DISCIPLINE_COLORS };
