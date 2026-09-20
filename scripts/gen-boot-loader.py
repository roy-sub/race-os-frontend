#!/usr/bin/env python3
"""Generate `lib/bootLoaderMarkup.ts` — the page-entry cycling animation.

Run with `python3 scripts/gen-boot-loader.py` from anywhere; it writes the
TypeScript file in place.

**Why this is generated rather than hand-written.** The markup is two
animations of the same rider — a 24-frame filmstrip on the dark shutter and an
8-frame plate on paper — which is 32 poses, each with a hip, two knees, two
pedals, two elbows and a head. Hand-keyed, they drift: the original run cycle
carried two subtly different figures for exactly that reason. Here every pose
is solved from one crank angle by inverse kinematics, so the two stages cannot
disagree, and a change to the rider's proportions is one constant rather than
thirty-two edits.

**What is load-bearing.** `app/globals.css` advances the strip with
`om-gait .58s steps(24)` across a fixed `2376px` (24 x 99), and the paper plate
reveals one of eight frames through `omRunFrame` with staggered negative
delays. Changing either frame count means changing that CSS with it.
"""

import math
from pathlib import Path

# --- the machine, in the 99x99 filmstrip box -------------------------------
GROUND_Y = 87.0
WHEEL_R = 13.0
REAR_HUB = (27.0, 74.0)
FRONT_HUB = (73.0, 74.0)
BB = (50.0, 74.0)
SADDLE = (40.0, 56.0)
HEAD_TUBE_TOP = (66.0, 57.0)
BAR = (72.0, 55.0)

# --- the rider -------------------------------------------------------------
HIP = (41.0, 53.0)
SHOULDER = (56.0, 40.5)
HEAD = (62.5, 34.0)
HEAD_R = 5.6
HAND = (71.0, 54.0)

CRANK = 7.5
THIGH, SHANK = 15.5, 16.5
# Nearly the shoulder-to-bar distance, so the arm carries a road rider's
# slight bend rather than folding into a triangle against the torso.
UPPER_ARM, FOREARM = 11.2, 11.2


def ik(a, b, l1, l2, prefer):
    """Elbow/knee position for a two-link chain from `a` to `b`.

    `prefer` picks which of the two mirror solutions to take: "x" for the one
    further forward (a knee), "y" for the one further down (an elbow).
    """
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    d = math.hypot(dx, dy)
    d = min(d, l1 + l2 - 1e-6)          # never let the chain snap straight
    d = max(d, abs(l1 - l2) + 1e-6)
    t = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
    h = math.sqrt(max(l1 * l1 - t * t, 0.0))
    ux, uy = dx / d, dy / d
    mx, my = ax + t * ux, ay + t * uy
    px, py = -uy, ux
    one = (mx + h * px, my + h * py)
    two = (mx - h * px, my - h * py)
    if prefer == "x":
        return one if one[0] > two[0] else two
    return one if one[1] > two[1] else two


def pose(phase):
    """Every point the drawing needs, for a crank angle of `phase` turns.

    Angle 0 is the crank horizontal and forward; it advances clockwise on
    screen, which is forward pedalling for a rider facing right.
    """
    theta = 2 * math.pi * phase

    # The torso is not still on a bike, but it is close to it — a little over
    # a pixel of sway at twice pedal frequency, which reads as effort without
    # turning the rider into a runner.
    bob = 0.55 * math.sin(2 * theta)
    hip = (HIP[0], HIP[1] + bob)
    shoulder = (SHOULDER[0], SHOULDER[1] + bob * 0.7)
    head = (HEAD[0], HEAD[1] + bob * 0.7)

    legs = []
    for offset in (0.0, math.pi):           # near leg, then far leg
        a = theta + offset
        pedal = (BB[0] + CRANK * math.cos(a), BB[1] + CRANK * math.sin(a))
        knee = ik(hip, pedal, THIGH, SHANK, "x")
        legs.append({"pedal": pedal, "knee": knee})

    arms = []
    for lean in (0.0, 0.6):                 # near arm, then far arm
        shoulder_pt = (shoulder[0] - lean, shoulder[1] + lean)
        elbow = ik(shoulder_pt, HAND, UPPER_ARM, FOREARM, "y")
        arms.append({"shoulder": shoulder_pt, "elbow": elbow})

    return {
        "hip": hip, "shoulder": shoulder, "head": head,
        "legs": legs, "arms": arms,
        # Three spokes, turning three times per pedal revolution: fast enough
        # to read as rolling, slow enough not to strobe against the frame rate.
        "spoke": theta * 3.0,
    }


def spokes(centre, angle, count=3, inset=0.82):
    out = []
    for i in range(count):
        a = angle + i * 2 * math.pi / count
        out.append((
            centre[0], centre[1],
            centre[0] + WHEEL_R * inset * math.cos(a),
            centre[1] + WHEEL_R * inset * math.sin(a),
        ))
    return out


def f(v):
    """Trim coordinates to one decimal, as the handoff markup does."""
    return f"{v:.1f}"




# ---------------------------------------------------------------- filmstrip
STRIP_FRAMES = 24


def bike_paths():
    """The frame and wheels, which do not move relative to the box."""
    out = [
        f'M{f(REAR_HUB[0])} {f(REAR_HUB[1])} L{f(BB[0])} {f(BB[1])} '
        f'L{f(SADDLE[0])} {f(SADDLE[1])} L{f(REAR_HUB[0])} {f(REAR_HUB[1])}',
        f'M{f(BB[0])} {f(BB[1])} L{f(HEAD_TUBE_TOP[0])} {f(HEAD_TUBE_TOP[1])} '
        f'L{f(SADDLE[0])} {f(SADDLE[1])}',
        f'M{f(HEAD_TUBE_TOP[0])} {f(HEAD_TUBE_TOP[1])} L{f(FRONT_HUB[0])} {f(FRONT_HUB[1])}',
        f'M{f(HEAD_TUBE_TOP[0])} {f(HEAD_TUBE_TOP[1])} L{f(BAR[0])} {f(BAR[1])}',
    ]
    return out


def strip_frame(i):
    p = pose(i / STRIP_FRAMES)
    near, far = p["legs"][0], p["legs"][1]
    near_arm, far_arm = p["arms"][0], p["arms"][1]
    o = []
    A = o.append

    A('<g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">')
    A('<g stroke-width="1" stroke-opacity=".22">')
    for hub in (REAR_HUB, FRONT_HUB):
        for x1, y1, x2, y2 in spokes(hub, p["spoke"]):
            A(f'<path d="M{f(x1)} {f(y1)} L{f(x2)} {f(y2)}"></path>')
    A('</g>')
    A('<g stroke-width="1.4" stroke-opacity=".78">')
    for hub in (REAR_HUB, FRONT_HUB):
        A(f'<circle cx="{f(hub[0])}" cy="{f(hub[1])}" r="{f(WHEEL_R)}"></circle>')
    for d in bike_paths():
        A(f'<path d="{d}"></path>')
    A('</g>')

    A('<g stroke-width="1.6" stroke-opacity=".4">')
    A(f'<path d="M{f(p["hip"][0])} {f(p["hip"][1])} L{f(far["knee"][0])} {f(far["knee"][1])} L{f(far["pedal"][0])} {f(far["pedal"][1])}"></path>')
    A(f'<path d="M{f(BB[0])} {f(BB[1])} L{f(far["pedal"][0])} {f(far["pedal"][1])}"></path>')
    A(f'<path d="M{f(far_arm["shoulder"][0])} {f(far_arm["shoulder"][1])} L{f(far_arm["elbow"][0])} {f(far_arm["elbow"][1])} L{f(HAND[0])} {f(HAND[1])}"></path>')
    A('</g>')

    A('<g stroke-width="1.8">')
    A(f'<path d="M{f(p["hip"][0])} {f(p["hip"][1])} L{f(p["shoulder"][0])} {f(p["shoulder"][1])} L{f(p["head"][0] - 2.7)} {f(p["head"][1] + 3.5)}"></path>')
    A(f'<path d="M{f(BB[0])} {f(BB[1])} L{f(near["pedal"][0])} {f(near["pedal"][1])}"></path>')
    A(f'<path d="M{f(p["hip"][0])} {f(p["hip"][1])} L{f(near["knee"][0])} {f(near["knee"][1])} L{f(near["pedal"][0])} {f(near["pedal"][1])}"></path>')
    A(f'<path d="M{f(near_arm["shoulder"][0])} {f(near_arm["shoulder"][1])} L{f(near_arm["elbow"][0])} {f(near_arm["elbow"][1])} L{f(HAND[0])} {f(HAND[1])}"></path>')
    A(f'<circle cx="{f(p["head"][0])}" cy="{f(p["head"][1])}" r="{f(HEAD_R)}"></circle>')
    A('</g>')
    A('</g>')

    A('<path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>')
    A('<g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">')
    A('<path d="M19 46.0 L5 46.0"></path>')
    A('<path d="M23 64.0 L9 64.0"></path>')
    A('</g>')

    return ('\n        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">'
            + "".join(o) + '</svg>')


# -------------------------------------------------------------- paper plate
PAPER_FRAMES = 8
S = 1.9
OX, OY = 30.0, 132.0


def P(pt):
    return (OX + (pt[0] - 14.0) * S, OY + (pt[1] - GROUND_Y) * S)


def pd(*pts):
    head, *rest = [P(p) for p in pts]
    return "M" + f(head[0]) + " " + f(head[1]) + "".join(f" L{f(x)} {f(y)}" for x, y in rest)


def paper_frame(i):
    p = pose(i / PAPER_FRAMES)
    near, far = p["legs"][0], p["legs"][1]
    near_arm, far_arm = p["arms"][0], p["arms"][1]
    head_c = P(p["head"])
    o = []
    A = o.append

    A(f'\n        <g opacity="0" style="animation:omRunFrame 0.8s steps(1,end) infinite;animation-delay:-{i * 0.1:.3f}s;">')
    A('\n          <g fill="none" stroke="#15140F" stroke-linecap="round" stroke-linejoin="round">')

    A('\n            <g stroke-width="1.4" stroke-opacity=".14">')
    for hub in (REAR_HUB, FRONT_HUB):
        for x1, y1, x2, y2 in spokes(hub, p["spoke"]):
            A(f'<path d="{pd((x1, y1), (x2, y2))}"></path>')
    A('</g>')

    A('\n            <g stroke-width="2" stroke-opacity=".42">')
    for hub in (REAR_HUB, FRONT_HUB):
        c = P(hub)
        A(f'<circle cx="{f(c[0])}" cy="{f(c[1])}" r="{f(WHEEL_R * S)}"></circle>')
    A(f'<path d="{pd(REAR_HUB, BB, SADDLE, REAR_HUB)}"></path>')
    A(f'<path d="{pd(BB, HEAD_TUBE_TOP, SADDLE)}"></path>')
    A(f'<path d="{pd(HEAD_TUBE_TOP, FRONT_HUB)}"></path>')
    A(f'<path d="{pd(HEAD_TUBE_TOP, BAR)}"></path>')
    A('</g>')

    A('\n            <g stroke-width="1.7" stroke-opacity=".22">')
    A(f'<path d="{pd(p["hip"], far["knee"], far["pedal"])}"></path>')
    A(f'<path d="{pd(BB, far["pedal"])}"></path>')
    A(f'<path d="{pd(far_arm["shoulder"], far_arm["elbow"], HAND)}"></path>')
    A('</g>')

    A('\n            <g stroke-width="2.5">')
    A(f'<path d="{pd(p["hip"], p["shoulder"], (p["head"][0] - 2.7, p["head"][1] + 3.5))}"></path>')
    A(f'<path d="{pd(BB, near["pedal"])}"></path>')
    A(f'<path d="{pd(p["hip"], near["knee"], near["pedal"])}"></path>')
    A(f'<path d="{pd(near_arm["shoulder"], near_arm["elbow"], HAND)}"></path>')
    A(f'<circle cx="{f(head_c[0])}" cy="{f(head_c[1])}" r="{f(HEAD_R * S)}" fill="#F1EEE8"></circle>')
    A('</g>')

    A('\n          </g>\n        </g>')
    return "".join(o)


# The rule runs wheel to wheel — a scale bar under the machine, not a frame
# around it, which is what the run plate's ground line was.
ruler = []
for x in range(36, 165, 16):
    ruler.append(f'<line x1="{x}" y1="140" x2="{x}" y2="147" stroke="#15140F" stroke-opacity=".12" stroke-width="1"></line>')
ruler_line = '<line x1="28" y1="140" x2="169" y2="140" stroke="#15140F" stroke-opacity=".2" stroke-width="1.2"></line>'

markup = f'''// Generated by scripts/gen-boot-loader.py — do not hand-edit.
//
// The page-entry animation: a 24-frame cycling gait over a dark shutter, then
// the same rider on paper under the wordmark. It replaces the Muybridge run
// that shipped with the design handoff.
//
// Both stages are solved from one set of joint positions (hip and pedal, with
// the knee resolved by inverse kinematics from the crank angle), so the two
// cannot drift apart. The frame counts, class names and animation delays are
// load-bearing: `app/globals.css` advances the strip with
// `steps(24)` over a fixed 2376px width, and the paper plate shows one of its
// eight frames at a time through staggered negative delays. Changing either
// count means changing the CSS with it.
export const bootLoaderMarkup = `
  <div id="om-boot" aria-hidden="true">
    <div class="gate"><div class="strip">{"".join(strip_frame(i) for i in range(STRIP_FRAMES))}</div></div>
    <div class="meter"><span></span></div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.32em;color:rgba(251,248,242,.42);">RACEOS</div>
  </div>

  <div data-loader style="position:fixed;inset:0;z-index:200;background:#F1EEE8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;animation:omLoaderOut .8s cubic-bezier(.16,1,.3,1) 1.35s forwards;">
    <div style="display:flex;align-items:center;gap:11px;">
      <svg width="27" height="18" viewBox="0 0 343 229" style="display:block;flex:none;"><g fill="#E4622F"><circle cx="75.5" cy="27.5" r="27.5"></circle><circle cx="267.5" cy="27.5" r="27.5"></circle><circle cx="27.5" cy="114.5" r="27.5"></circle><circle cx="123.5" cy="114.5" r="27.5"></circle><circle cx="219.5" cy="114.5" r="27.5"></circle><circle cx="315.5" cy="114.5" r="27.5"></circle><circle cx="75.5" cy="201.5" r="27.5"></circle><circle cx="267.5" cy="201.5" r="27.5"></circle></g></svg>
      <span style="font-size:17px;font-weight:600;letter-spacing:-.035em;color:#15140F;">RaceOS</span>
    </div>
    <svg width="202" height="171" viewBox="14 8 170 144" style="display:block;">
      {"".join(ruler)}
      {ruler_line}{"".join(paper_frame(i) for i in range(PAPER_FRAMES))}
    </svg>
    <div style="display:flex;flex-direction:column;align-items:center;gap:14px;">
      <div style="width:132px;height:2px;background:rgba(21,20,15,.12);overflow:hidden;">
        <div style="width:100%;height:100%;background:#E4622F;transform-origin:left center;animation:omLoaderBar 1.5s cubic-bezier(.35,.9,.25,1) forwards;"></div>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.2em;color:#8C8578;white-space:nowrap;">MOTION STUDY No. 5 · RIDE</div>
    </div>
  </div>
`;
'''

OUT = Path(__file__).resolve().parent.parent / "lib" / "bootLoaderMarkup.ts"
OUT.write_text(markup, encoding="utf-8")
print(f"gen-boot-loader: wrote {OUT} ({len(markup)} bytes)")
