// CourseMapEngine — the imperative Three.js terrain/route/water engine behind
// the Kalmar 70.3 course map. Framework-agnostic: a React (or any UI layer)
// component mounts it onto a DOM element and wires discrete UI state (mode,
// hand-rotate) through the setters below, plus DOM nodes for the live cursor
// readout and the pin/flag overlay, which are updated directly every frame
// for performance (bypassing React's render cycle, same as the original
// prototype did).
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import kalmarVenue from './venues/kalmar.js';
import { RasterTerrain, SHORE_TEXTURE_RANGE } from './raster.js';

export const M_PER_UNIT = 7, W = 228, D = 156, SLAB = 16;
// OrbitControls.autoRotate advances by (2π/3600)·autoRotateSpeed per update()
// call (no deltaTime passed); solved so that per-frame pace matches the
// original design's ~0.0006 rad/frame ambient orbit.
const AUTO_ROTATE_SPEED = (0.0006 * 3600) / (2 * Math.PI);
export const DISCIPLINE_COLORS = { Swim: '#59C3D9', Bicycle: '#E8552A', Run: '#7FC79A' };
export const START_GREEN = '#5FB07B';

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function ss(a, b, t) { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
function segD(px, pz, ax, az, bx, bz) {
  const vx = bx - ax, vz = bz - az, wx = px - ax, wz = pz - az;
  const t = clamp((vx * wx + vz * wz) / (vx * vx + vz * vz || 1), 0, 1);
  return { d: Math.hypot(wx - vx * t, wz - vz * t), t };
}
function cat2(pts, closed, step) {
  const n = pts.length, out = [];
  const P = i => pts[closed ? (i + n * 2) % n : clamp(i, 0, n - 1)];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const k = Math.max(2, Math.round(L / step));
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      const x = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const z = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      out.push([x, z]);
    }
  }
  out.push(closed ? out[0].slice() : [pts[n - 1][0], pts[n - 1][1]]);
  return out;
}
function smoothArr(ys, passes, win, closed) {
  const n = ys.length, h = Math.floor(win / 2);
  for (let p = 0; p < passes; p++) {
    const src = ys.slice();
    for (let i = 0; i < n; i++) {
      let s = 0, c = 0;
      for (let k = -h; k <= h; k++) {
        let j = i + k;
        j = closed ? (j + n) % n : clamp(j, 0, n - 1);
        s += src[j]; c++;
      }
      ys[i] = s / c;
    }
  }
}
function gradeLimit(pts, ys, maxG, closed) {
  const n = ys.length, last = closed ? n : n - 1;
  for (let it = 0; it < 160; it++) {
    let changed = 0;
    for (let i = 0; i < last; i++) {
      const j = (i + 1) % n;
      const ds = Math.hypot(pts[j][0] - pts[i][0], pts[j][1] - pts[i][1]) || 0.01;
      const lim = maxG * ds, d = ys[j] - ys[i];
      if (Math.abs(d) > lim) {
        const ex = (Math.abs(d) - lim) / 2 * Math.sign(d);
        ys[i] += ex; ys[j] -= ex; changed++;
      }
    }
    if (!changed) break;
  }
}
function ridged(x, z) {
  let v = 0, a = 1, f = 0.062;
  for (let o = 0; o < 4; o++) {
    const s = Math.sin(x * f + o * 1.7) * Math.cos(z * f * 1.13 + o * 2.3);
    v += a * (1 - Math.abs(s));
    a *= 0.52; f *= 2.07;
  }
  return v - 0.95;
}

/* Resolution of the baked elevation field the contour system draws from, and
   how hard it is generalised before contouring. Sigma is in texels (one texel
   is ~0.45 world units), so this strips sub-metre noise — which is what makes
   isolines ragged — without moving a single real landform. */
const DEM_NX = 512, DEM_NZ = 352, DEM_SMOOTH_SIGMA = 1.6;

const FRAME_MARGIN_ROUTE = 0.20;
/* The viewing angle used when a venue has no solved camera of its own.
 *
 * VENUES.md is explicit that a venue may omit `view` and let `fitPoints()`
 * frame it — but the *direction* it is framed from still has to come from
 * somewhere, and eyeballing a new one per race would give fifteen subtly
 * different compositions. These are the showcase map's own solved angles, so
 * every race is read from the same three-quarter view and the set looks like
 * one set. Only the distance and target are fitted, per venue. */
const DEFAULT_AZIMUTH = 0.30422, DEFAULT_POLAR = 1.04119;
/* Air around the slab. Matched by eye to the showcase map's solved
   composition, which sits the plate in frame with the background visible past
   its far corner rather than filling the stage with terrain. */
const FRAME_MARGIN_SLAB = 0.12;
const FRAME_MIN_DIST = 112, FRAME_MAX_DIST = 520;

/** Separable Gaussian over a scalar grid, clamped at the edges. */
function gaussianBlur2D(src, nx, nz, sigma) {
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k = new Float32Array(r * 2 + 1);
  let norm = 0;
  for (let i = -r; i <= r; i++) { const v = Math.exp(-(i * i) / (2 * sigma * sigma)); k[i + r] = v; norm += v; }
  for (let i = 0; i < k.length; i++) k[i] /= norm;
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
  for (let j = 0; j < nz; j++) {
    const row = j * nx;
    for (let i = 0; i < nx; i++) {
      let s = 0;
      for (let t = -r; t <= r; t++) s += k[t + r] * src[row + clamp(i + t, 0, nx - 1)];
      tmp[row + i] = s;
    }
  }
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      let s = 0;
      for (let t = -r; t <= r; t++) s += k[t + r] * tmp[clamp(j + t, 0, nz - 1) * nx + i];
      out[j * nx + i] = s;
    }
  }
  return out;
}

/** These shaders write their output straight to the frame buffer — the scene
 *  runs no output colour-space conversion — so a colour reaches the screen as
 *  the literal value the shader emits. THREE.Color would linearise a hex
 *  string on the way in and land it about a quarter as bright, so ocean
 *  colours, which have to match an exact spec, are authored in display space. */
function screenColor(hex) {
  return new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);
}

/** Walks back along a course line from its final point by `dist` world units
 *  and returns the point there, interpolated along the segment it lands in. */
function alongFromEnd(c, dist) {
  const pts = c.pts;
  let acc = 0;
  for (let i = pts.length - 1; i > 0; i--) {
    const a = pts[i], b = pts[i - 1];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (acc + seg >= dist) {
      const t = seg ? (dist - acc) / seg : 0;
      return {
        x: a[0] + (b[0] - a[0]) * t,
        z: a[1] + (b[1] - a[1]) * t,
        y: c.ys[i] + (c.ys[i - 1] - c.ys[i]) * t,
      };
    }
    acc += seg;
  }
  return { x: pts[0][0], z: pts[0][1], y: c.ys[0] };
}

/** Contour interval snapped to a round number of metres, the way a real
 *  topographic sheet picks one — ~15-22 intervals across the relief. */
function contourInterval(reliefUnits, mPerUnit = M_PER_UNIT) {
  const rangeM = Math.max(reliefUnits * mPerUnit, 1);
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500];
  const stepM = steps.find(s => rangeM / s <= 30) || 500;
  return stepM / mPerUnit;
}

export class CourseMapEngine {
  constructor({ venue = kalmarVenue, relief = 1.5, contours = true, autoOrbit = true } = {}) {
    /* Everything race-specific comes from here. The engine itself knows about
       no particular venue — see src/venues/kalmar.js and VENUES.md. */
    this.venue = venue;
    this.R = venue.terrain;
    /* The terrain seam. A venue carrying a baked `field` is a real place and
       is sampled from measured elevation; a venue without one is the
       generated showcase and takes every path below exactly as it always did.
       Kalmar must keep rendering identically — it is signed-off artwork, not
       a survey (TRACKS.md §1) — so nothing here changes when `raster` is null. */
    this.raster = venue.field ? new RasterTerrain(venue.field, venue.world) : null;
    /* Metres per world unit vertically. 7 for the generated map, and whatever
       the bake chose for a real one: the elevation readout and the contour
       interval both read it, and a shared constant would report one venue's
       heights in another venue's units. */
    this.mPerUnit = this.raster ? this.raster.metresPerUnit : M_PER_UNIT;
    this.relief = relief;
    this.contours = contours;
    this.autoOrbit = autoOrbit;
    this.mode = 'All';
    this.hand = true;
    this.pinEls = {};
    this.flagEls = {};
    this.want = null;
  }

  // ---- terrain sampling -------------------------------------------------

  coastX(z) { const s = this.R.sea; return s.base + s.amp * Math.sin(z * s.f) + s.amp2 * Math.sin(z * s.f2); }

  baseHeight(x, z) {
    // A real venue's ground is measured, not generated. Everything below this
    // line is the showcase map's analytic landform and is never reached for one.
    if (this.raster) return this.raster.baseHeight(x, z);
    const relief = this.relief, wl = this.R.waterLevel;
    const inland = this.coastX(z) - x;
    const dh = Math.hypot(x - this.R.hub[0], z - this.R.hub[1]);

    /* Organic coastline. Headlands only ever reach *seaward* of the nominal
       coast line, never behind it, so the sea polygon still covers every
       submerged fragment; they fade out around the race village, where the
       beach is groomed — which also keeps the swim start and the T1/T2
       transition on exactly the points they sat on before. */
    const headland = 3.4
      * (0.5 + 0.5 * Math.sin(z * 0.205 + 1.7))
      * (0.62 + 0.38 * Math.sin(z * 0.079 - 0.6))
      * ss(22, 48, dh);
    const shore = inland + headland;

    /* Continuous land <-> sea profile. The seabed descends offshore, a short
       foreshore lifts out of the water and merges into the coastal plain. The
       old profile stepped 1.4 units vertically across the water line, which is
       what made the shore read as a cut-out slab. */
    const surf = ss(-4.0, 3.4, shore);
    const seabed = -0.85 - 0.075 * Math.max(-shore, 0);
    const plain = 0.5 + 2.4 * ss(0, 130, Math.max(inland, 0));
    let h = seabed * (1 - surf) + plain * surf;

    const shelf = ss(3, 42, inland);
    h += shelf * relief * (1.15 * Math.sin(x * 0.045) * Math.cos(z * 0.052)
      + 0.5 * Math.sin(x * 0.028 + z * 0.037)
      + 0.34 * Math.sin(x * 0.108) * Math.cos(z * 0.096));
    h = Math.max(h, -9);
    for (const [px, pz, pr, pa] of this.R.peaks) {
      h += pa * relief * Math.exp(-((x - px) * (x - px) + (z - pz) * (z - pz)) / (2 * pr * pr));
    }
    const alt = ss(wl + 2, wl + 11, h);
    h += relief * this.R.rugged * ridged(x, z) * (0.3 + 0.7 * alt) * shelf;
    const tw = ss(21, 10, dh);
    h = h * (1 - tw) + (wl + 1.7) * tw;
    return h;
  }

  shoreToward(p, target) {
    const wl = this.R.waterLevel;
    let dx = target[0] - p[0], dz = target[1] - p[1];
    const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    let last = [p[0], p[1]];
    for (let s = 0; s < 200; s++) {
      const x = p[0] + dx * s * 0.5, z = p[1] + dz * s * 0.5;
      if (this.baseHeight(x, z) > wl + 0.25) return [x, z];
      last = [x, z];
    }
    return last;
  }

  roadProfile(pts, closed, tieStart, tieEnd) {
    const wl = this.R.waterLevel;
    const ys = pts.map(p => Math.max(this.baseHeight(p[0], p[1]), wl + 1.1));
    smoothArr(ys, 6, 11, closed);
    gradeLimit(pts, ys, this.R.maxGrade, closed);
    smoothArr(ys, 2, 5, closed);
    const n = ys.length, tie = wl + 0.32, span = 10;
    for (let i = 0; i < n; i++) ys[i] = Math.max(ys[i], wl + 0.9);
    if (tieStart) for (let i = 0; i < span; i++) { const w = 1 - i / span; ys[i] = ys[i] * (1 - w) + tie * w; }
    if (tieEnd) for (let i = 0; i < span; i++) { const w = 1 - i / span; ys[n - 1 - i] = ys[n - 1 - i] * (1 - w) + tie * w; }
    return ys;
  }

  prepare() {
    if (this.raster) return this.prepareReal();
    const wl = this.R.waterLevel;
    this.grid = null;

    let rp = cat2(this.R.river, false, 3.2);
    let cut = rp.findIndex(p => p[0] >= this.coastX(p[1]) - 1.5);
    if (cut < 2) cut = rp.length;
    rp = rp.slice(0, cut);
    const ry = rp.map(p => this.baseHeight(p[0], p[1]));
    smoothArr(ry, 3, 9, false);
    ry[ry.length - 1] = wl - 0.35;
    for (let i = ry.length - 2; i >= 0; i--) ry[i] = Math.max(ry[i], ry[i + 1] + 0.05);
    smoothArr(ry, 1, 5, false);
    for (let i = ry.length - 2; i >= 0; i--) ry[i] = Math.max(ry[i], ry[i + 1] + 0.02);
    this.riverC = { pts: rp, ys: ry, kind: 'river' };

    // swim: one closed ring touching the beach twice — at the start and at the
    // swim exit, which is the T1/T2 transition. Closing it is what removes the
    // cusps an open out-and-back leaves where its two ends meet.
    const water = this.venue.courses.swim(this);
    const start = this.shoreToward(water[0], this.R.hub);
    const exit = this.shoreToward(water[this.venue.courses.swimExit], this.R.hub);
    const ring = water.slice();
    ring[0] = start;
    ring[this.venue.courses.swimExit] = exit;
    const sd = cat2(ring, true, 2.4);
    this.swimC = { pts: sd, ys: sd.map(() => wl + 0.32), kind: 'swim' };

    // bike: leaves and returns to the exact swim-exit point
    const bd = cat2([exit].concat(this.venue.courses.bike), true, 3.0);
    this.bikeC = { pts: bd, ys: this.roadProfile(bd, true, true, true), kind: 'road' };

    // run: leaves the transition, loops south and returns to it — closed, so
    // the spline is C1 through the transition too, with no seam
    const rr = cat2([exit].concat(this.venue.courses.run), true, 3.0);
    this.runC = { pts: rr, ys: this.roadProfile(rr, true, true, true), kind: 'road' };

    this.start = start; this.exit = exit;
    this.buildIndex([this.riverC, this.bikeC, this.runC]);
  }

  /* The same preparation for a surveyed venue.
   *
   * Three things the generated path does are wrong here and are therefore not
   * done. The swim is not authored as offsets from a coastline formula — it is
   * a measured line in real water, so it is used as given. The start and the
   * transition are not walked inland to a waterline — they are where the
   * organiser puts them. And there is no river to carve, because the valley is
   * already in the elevation model; carving an invented one on top would be
   * putting fiction into a survey.
   *
   * What is shared is everything that makes the map look like the map: the
   * same Catmull-Rom through the control points, the same road profile with
   * its smoothing and grade limit, the same spatial index, the same markers,
   * camera and contours. That is what "the same design system with real data"
   * means in code.
   */
  prepareReal() {
    const wl = this.R.waterLevel;
    this.grid = null;
    this.riverC = { pts: [], ys: [], kind: 'river' };

    const swim = this.venue.courses.swim;
    const bike = this.venue.courses.bike;
    const run = this.venue.courses.run;

    /* Open curves, not closed rings. A real course is a real line: forcing it
       closed would draw a leg between the finish and the start that nobody
       races. The showcase map closes its rings to avoid the cusp an open
       curve leaves where its two ends meet — here the ends are genuinely
       apart, so there is no cusp to avoid. */
    const sd = cat2(swim, false, 2.4);
    this.swimC = { pts: sd, ys: sd.map(() => wl + 0.32), kind: 'swim' };

    const bd = cat2(bike, false, 3.0);
    this.bikeC = { pts: bd, ys: this.roadProfile(bd, false, true, true), kind: 'road' };

    const rd = cat2(run, false, 3.0);
    this.runC = { pts: rd, ys: this.roadProfile(rd, false, true, true), kind: 'road' };

    this.start = sd[0];
    // The transition is where the swim comes out and the bike sets off, which
    // on a real course is one place and is already in the data.
    this.exit = bd[0];
    this.buildIndex([this.bikeC, this.runC]);
  }

  buildIndex(list) {
    this.cell = 14;
    const g = new Map(), pad = 17;
    for (const c of list) {
      for (let i = 0; i < c.pts.length - 1; i++) {
        const a = c.pts[i], b = c.pts[i + 1];
        const x0 = Math.floor((Math.min(a[0], b[0]) - pad) / this.cell), x1 = Math.floor((Math.max(a[0], b[0]) + pad) / this.cell);
        const z0 = Math.floor((Math.min(a[1], b[1]) - pad) / this.cell), z1 = Math.floor((Math.max(a[1], b[1]) + pad) / this.cell);
        for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
          const k = ix + ',' + iz, arr = g.get(k);
          if (arr) arr.push([c, i]); else g.set(k, [[c, i]]);
        }
      }
    }
    this.grid = g;
  }

  height(x, z) {
    let h = this.baseHeight(x, z);
    if (!this.grid) return h;
    const cands = this.grid.get(Math.floor(x / this.cell) + ',' + Math.floor(z / this.cell));
    if (!cands) return h;
    /* Roads are blended by inverse distance across every one in reach, not
       snapped to the nearest. Picking the nearest makes the carve height jump
       across the medial line between two roads running close together, and that
       discontinuity shows on the surface as a sawtooth seam. The cubic weight
       keeps the closest road dominant, so each road bed still sits at its own
       profile, while two roads near each other now grade into one another. */
    let bd = 1e9, wsum = 0, ysum = 0, rd = 1e9, ry = 0;
    for (const [c, i] of cands) {
      const a = c.pts[i], b = c.pts[i + 1];
      const r = segD(x, z, a[0], a[1], b[0], b[1]);
      if (c.kind === 'river') {
        if (r.d < rd) { rd = r.d; ry = c.ys[i] + (c.ys[i + 1] - c.ys[i]) * r.t; }
        continue;
      }
      if (r.d < bd) bd = r.d;
      if (r.d < 11) {
        const t = 1 - ss(2.6, 11, r.d);
        const w = t * t * t + 1e-6;
        wsum += w;
        ysum += w * (c.ys[i] + (c.ys[i + 1] - c.ys[i]) * r.t);
      }
    }
    if (rd < 17) {
      const w = (1 - ss(3, 17, rd)) * 0.72;
      h = h * (1 - w) + (ry + 0.6) * w;
      if (rd < 3.1) h = Math.min(h, ry - 0.45);
    }
    if (bd < 11 && wsum > 0) {
      const w = (1 - ss(2.6, 11, bd)) * 0.93;
      h = h * (1 - w) + (ysum / wsum) * w;
    }
    return h;
  }

  waterHere(x, z) {
    // A mask, not a half-plane: `x > coastX(z)` cannot express a bay, an
    // island or an estuary, and every real venue past Kalmar has at least one.
    if (this.raster) return this.raster.waterAt(x, z);
    return x > this.coastX(z) ? this.R.waterLevel : null;
  }

  // ---- lifecycle ----------------------------------------------------------

  /**
   * Build the scene into `stageEl`.
   *
   * `onReady` is handed the markers and flags the build produced. It is a
   * callback rather than something the caller reads back off the instance
   * afterwards, because a React caller reading an imperative object during
   * render is exactly the pattern that goes stale — the engine says when it
   * has something to show, and the UI layer reacts to that.
   */
  mount(stageEl, onReady) {
    if (!stageEl || this.renderer) return;
    this.stage = stageEl;
    this.onReady = onReady;
    this.prepare();
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(30, 16 / 9, 1, 3000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    stageEl.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    this.renderer = renderer;

    const c = new OrbitControls(this.cam, renderer.domElement);
    c.enableDamping = true; c.dampingFactor = 0.08; c.enablePan = false;
    c.minDistance = 112; c.maxDistance = 520;
    c.minPolarAngle = 0.24; c.maxPolarAngle = 1.36; c.rotateSpeed = 0.55;
    c.enableRotate = this.hand;
    // Slow ambient orbit while the user isn't dragging — driven by OrbitControls'
    // own autoRotate (its setAzimuthalAngle has no setter counterpart), speed
    // calibrated to the same ~0.0006 rad/frame pace as the original design.
    c.autoRotateSpeed = AUTO_ROTATE_SPEED;
    c.autoRotate = !this.hand && this.autoOrbit;
    this.controls = c;

    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.build();
    this.frame('All', true);

    this.ray = new THREE.Raycaster(); this.ndc = new THREE.Vector2();
    this._onPointerMove = e => {
      const r = renderer.domElement.getBoundingClientRect();
      this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.needRay = true;
    };
    this._onPointerLeave = () => { this.needRay = false; this.clearCursor(); };
    renderer.domElement.addEventListener('pointermove', this._onPointerMove);
    renderer.domElement.addEventListener('pointerleave', this._onPointerLeave);

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(stageEl);

    this._running = true;
    const loop = () => {
      if (!this._running) return;
      this.raf = requestAnimationFrame(loop);
      const cu = this.contours ? 1 : 0;
      if (this.surf.material.uniforms.uContours.value !== cu) this.surf.material.uniforms.uContours.value = cu;
      if (this.sea) this.sea.material.uniforms.uTime.value = performance.now() * 0.001;
      if (this.want) {
        const k = 0.07;
        c.target.lerp(this.want.target, k);
        const dir = this.cam.position.clone().sub(c.target);
        const len = dir.length() + (this.want.dist - dir.length()) * k;
        this.cam.position.copy(c.target.clone().add(dir.normalize().multiplyScalar(len)));
        if (c.target.distanceTo(this.want.target) < 0.4 && Math.abs(len - this.want.dist) < 0.6) this.want = null;
      }
      c.update();
      this.renderer.render(this.scene, this.cam);
      this.placeOverlay();
      if (this.needRay) { this.needRay = false; this.sampleCursor(); }
    };
    loop();

    if (this.onReady) this.onReady({ markers: this.markers, flagPts: this.flagPts });
  }

  unmount() {
    this._running = false;
    cancelAnimationFrame(this.raf);
    if (this.ro) this.ro.disconnect();
    if (this.renderer) {
      this.renderer.domElement.removeEventListener('pointermove', this._onPointerMove);
      this.renderer.domElement.removeEventListener('pointerleave', this._onPointerLeave);
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
    if (this.controls) this.controls.dispose();
    if (this.demTex) { this.demTex.dispose(); this.demTex = null; }
    this.renderer = null;
  }

  // ---- scene construction ---------------------------------------------

  build() {
    this.buildTerrain();
    this.buildWater();
    this.buildRoutes();
    this.buildCursorMark();
    this.applyMode();
    this.markers = this.venue.aid.map(a => {
      const c = a.route === 'Bicycle' ? this.bikeC : a.route === 'Run' ? this.runC : this.swimC;
      const i = clamp(Math.round(a.t * (c.pts.length - 1)), 0, c.pts.length - 1);
      return { ...a, x: c.pts[i][0], z: c.pts[i][1], y: c.ys[i] };
    });
    this.markers.push({
      route: 'Bicycle', kind: 'TRANSITION', ...this.venue.transition, x: this.exit[0], z: this.exit[1], y: this.R.waterLevel + 0.9,
    });
    /* Both flags sit on the race line itself. The start is the swim line's
       first point; the finish is the run's last stretch into the transition —
       walked back a few units from the very end so it reads as the finish
       chute instead of stacking on the T1/T2 pin that already marks that exact
       point. (It used to be pinned 7 units past the village hub, which left it
       ~21 units adrift in open ground, attached to nothing.) */
    const fin = alongFromEnd(this.runC, this.venue.finishBack);
    this.flagPts = [
      {
        kind: 'START', ...this.venue.startFlag,
        x: this.swimC.pts[0][0], z: this.swimC.pts[0][1], y: this.swimC.ys[0],
      },
      {
        kind: 'FINISH', ...this.venue.finishFlag,
        x: fin.x, z: fin.z, y: fin.y,
      },
    ];
    this.anchors = {
      pins: this.markers.map(m => new THREE.Vector3(m.x, m.y + 1.2, m.z)),
      // stand each flag on whichever is higher, the ground or the track it marks,
      // so a pole can never sink into the terrain
      flags: this.flagPts.map(f => new THREE.Vector3(f.x, Math.max(this.height(f.x, f.z), f.y) + 0.5, f.z)),
    };
  }

  rebuild() {
    ['surf', 'sides', 'base', 'sea', 'routeGroup', 'cursorMark'].forEach(k => {
      if (this[k]) { this.group.remove(this[k]); this[k] = null; }
    });
    this.prepare();
    this.build();
    this.frame(this.mode, true);
  }

  /* Bakes the elevation field the contour system reads. It is the same
     this.height() the mesh is built from — routes and river carving included —
     sampled well above mesh resolution and lightly generalised, so every
     isoline drawn from it is a true isoline of this terrain rather than a
     decorative curve. */
  buildElevationField() {
    const raw = new Float32Array(DEM_NX * DEM_NZ);
    for (let j = 0; j < DEM_NZ; j++) {
      const z = -D / 2 + (D * j) / (DEM_NZ - 1);
      const row = j * DEM_NX;
      for (let i = 0; i < DEM_NX; i++) raw[row + i] = this.height(-W / 2 + (W * i) / (DEM_NX - 1), z);
    }
    // kept unsmoothed for the marker occlusion test, which wants the terrain as
    // actually rendered rather than the generalised version the contours use
    this.demRaw = raw;
    const data = gaussianBlur2D(raw, DEM_NX, DEM_NZ, DEM_SMOOTH_SIGMA);
    if (this.demTex) this.demTex.dispose();
    const tex = new THREE.DataTexture(data, DEM_NX, DEM_NZ, THREE.RedFormat, THREE.FloatType);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    this.demTex = tex;
    return tex;
  }

  buildTerrain() {
    const T = THREE;
    const segX = 240, segZ = Math.round(segX * D / W);
    const geo = new T.PlaneGeometry(W, D, segX, segZ);
    const pos = geo.attributes.position;
    let hmin = 1e9, hmax = -1e9;
    for (let i = 0; i < pos.count; i++) {
      const h = this.height(pos.getX(i), -pos.getY(i));
      pos.setZ(i, h);
      if (h < hmin) hmin = h;
      if (h > hmax) hmax = h;
    }
    geo.computeVertexNormals();
    this.hmax = hmax;

    const demTex = this.buildElevationField();
    this.contourInterval = contourInterval(hmax - this.R.waterLevel, this.mPerUnit);

    const mat = new T.ShaderMaterial({
      uniforms: {
        uLow: { value: new T.Color('#221D18') },
        uMid: { value: new T.Color('#3A322A') },
        uHigh: { value: new T.Color('#635647') },
        uPeak: { value: new T.Color('#9B8B75') },
        uLine: { value: new T.Color('#C9B79A') },
        uSand: { value: new T.Color('#7A6A55') },
        uContours: { value: this.contours ? 1 : 0 },
        uInterval: { value: this.contourInterval },
        uBase: { value: Math.max(hmin, this.R.waterLevel - 4) },
        uTop: { value: hmax * 0.94 },
        uWaterLevel: { value: this.R.waterLevel },
        uDem: { value: demTex },
        uDemSize: { value: new T.Vector2(DEM_NX, DEM_NZ) },
        uFieldMin: { value: new T.Vector2(-W / 2, -D / 2) },
        uFieldSize: { value: new T.Vector2(W, D) },
        uMinorPx: { value: 0.40 },
        uMajorPx: { value: 0.80 },
        uMinorAlpha: { value: 0.26 },
        uMajorAlpha: { value: 0.54 },
      },
      vertexShader: `
        varying float vH; varying vec3 vN; varying vec3 vW;
        void main(){
          vH = position.z; vN = normalMatrix * normal;
          vec4 wp = modelMatrix * vec4(position,1.0); vW = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        precision highp float;
        uniform vec3 uLow, uMid, uHigh, uPeak, uLine, uSand;
        uniform float uContours, uInterval, uTop, uBase, uWaterLevel;
        uniform float uMinorPx, uMajorPx, uMinorAlpha, uMajorAlpha;
        uniform sampler2D uDem;
        uniform vec2 uDemSize, uFieldMin, uFieldSize;
        varying float vH; varying vec3 vN; varying vec3 vW;

        float demTexel(vec2 ij){
          vec2 uv = (clamp(ij, vec2(0.0), uDemSize - 1.0) + 0.5) / uDemSize;
          return texture2D(uDem, uv).r;
        }
        vec4 crW(float t){
          float t2 = t * t, t3 = t2 * t;
          return 0.5 * vec4(-t3 + 2.0 * t2 - t,
                             3.0 * t3 - 5.0 * t2 + 2.0,
                            -3.0 * t3 + 4.0 * t2 + t,
                             t3 - t2);
        }
        vec4 crD(float t){
          float t2 = t * t;
          return 0.5 * vec4(-3.0 * t2 + 4.0 * t - 1.0,
                             9.0 * t2 - 10.0 * t,
                            -9.0 * t2 + 8.0 * t + 1.0,
                             3.0 * t2 - 2.0 * t);
        }
        /* Catmull-Rom reconstruction of the baked elevation field. Sampling a
           C1 surface per fragment is what keeps isolines smooth: reading a
           linearly interpolated vertex height instead makes every line
           piecewise-straight across each triangle, which is what the previous
           contours were doing. Returns (height, dH/dgx, dH/dgz). */
        vec3 demSample(vec2 g){
          vec2 f = floor(g), t = g - f;
          vec4 wx = crW(t.x), wy = crW(t.y), dx = crD(t.x), dy = crD(t.y);
          vec4 r0 = vec4(demTexel(f + vec2(-1.0, -1.0)), demTexel(f + vec2(0.0, -1.0)), demTexel(f + vec2(1.0, -1.0)), demTexel(f + vec2(2.0, -1.0)));
          vec4 r1 = vec4(demTexel(f + vec2(-1.0,  0.0)), demTexel(f + vec2(0.0,  0.0)), demTexel(f + vec2(1.0,  0.0)), demTexel(f + vec2(2.0,  0.0)));
          vec4 r2 = vec4(demTexel(f + vec2(-1.0,  1.0)), demTexel(f + vec2(0.0,  1.0)), demTexel(f + vec2(1.0,  1.0)), demTexel(f + vec2(2.0,  1.0)));
          vec4 r3 = vec4(demTexel(f + vec2(-1.0,  2.0)), demTexel(f + vec2(0.0,  2.0)), demTexel(f + vec2(1.0,  2.0)), demTexel(f + vec2(2.0,  2.0)));
          vec4 rv = vec4(dot(r0, wx), dot(r1, wx), dot(r2, wx), dot(r3, wx));
          vec4 rd = vec4(dot(r0, dx), dot(r1, dx), dot(r2, dx), dot(r3, dx));
          return vec3(dot(rv, wy), dot(rd, wy), dot(rv, dy));
        }

        void main(){
          float t = clamp((vH - uBase) / max(uTop - uBase, 0.001), 0.0, 1.0);
          vec3 base = t < 0.44 ? mix(uLow, uMid, t / 0.44)
                    : t < 0.80 ? mix(uMid, uHigh, (t - 0.44) / 0.36)
                               : mix(uHigh, uPeak, (t - 0.80) / 0.20);
          vec3 n = normalize(vN);
          float d = max(dot(n, normalize(vec3(-0.40, 0.82, 0.42))), 0.0);
          float facing = 1.0 - clamp(n.y, 0.0, 1.0);
          base *= 0.42 + 0.86 * d;
          base += uPeak * pow(facing, 2.2) * 0.09;

          vec2 g = (vW.xz - uFieldMin) / uFieldSize * (uDemSize - 1.0);
          vec3 dem = demSample(g);
          float H = dem.x;
          vec2 grad = vec2(dem.y, dem.z) * (uDemSize - 1.0) / uFieldSize;
          float slope = length(grad);

          /* Wet-sand foreshore, so land meets water as a beach rather than a
             cut edge. */
          float above = H - uWaterLevel;
          float beach = (1.0 - smoothstep(0.0, 2.4, abs(above))) * smoothstep(-1.6, 0.1, above);
          base = mix(base, uSand, beach * 0.22);

          /* Contours. Distance to the nearest isoline is measured in pixels —
             the value's distance divided by its screen-space gradient — so
             every line carries the same weight whatever the slope or the zoom,
             instead of thinning out on flats and clotting on faces. */
          float f  = H / uInterval;
          float fm = H / (uInterval * 5.0);
          float df  = max(fwidth(f),  1e-6);
          float dfm = max(fwidth(fm), 1e-6);
          float pxMinor = abs(fract(f  + 0.5) - 0.5) / df;
          float pxMajor = abs(fract(fm + 0.5) - 0.5) / dfm;
          float minor = 1.0 - smoothstep(uMinorPx - 0.5, uMinorPx + 0.5, pxMinor);
          float major = 1.0 - smoothstep(uMajorPx - 0.5, uMajorPx + 0.5, pxMajor);

          /* Drop lines where they would stop meaning anything: dead-flat
             ground carries no contour, slopes that pack lines tighter than
             they can be drawn keep only the index contour, and everything at
             or below the water line is cut — so contours end at the coast. */
          float flatFade   = smoothstep(0.004, 0.020, slope);
          float crowdMinor = 1.0 - smoothstep(0.26, 0.70, uMinorPx * df);
          float crowdMajor = 1.0 - smoothstep(0.26, 0.70, uMajorPx * dfm);
          float landFade   = smoothstep(uWaterLevel + 0.15, uWaterLevel + 1.20, H);
          float lines = max(minor * uMinorAlpha * crowdMinor, major * uMajorAlpha * crowdMajor)
                      * uContours * flatFade * landFade;
          lines *= 0.45 + 0.55 * clamp(n.y, 0.0, 1.0);
          base = mix(base, uLine, lines);

          base *= 0.58 + 0.42 * smoothstep(165.0, 45.0, length(vW.xz));
          gl_FragColor = vec4(base, 1.0);
        }`,
    });
    const surf = new T.Mesh(geo, mat);
    surf.rotation.x = -Math.PI / 2;
    this.surf = surf; this.group.add(surf);

    // cut-away side walls with sedimentary strata
    const nx = 190, nz = 130, verts = [], edge = [];
    for (let i = 0; i <= nx; i++) edge.push([-W / 2 + W * i / nx, -D / 2]);
    for (let j = 1; j <= nz; j++) edge.push([W / 2, -D / 2 + D * j / nz]);
    for (let i = nx - 1; i >= 0; i--) edge.push([-W / 2 + W * i / nx, D / 2]);
    for (let j = nz - 1; j >= 1; j--) edge.push([-W / 2, -D / 2 + D * j / nz]);
    for (let k = 0; k < edge.length; k++) {
      const a = edge[k], b = edge[(k + 1) % edge.length];
      const ha = this.height(a[0], a[1]), hb = this.height(b[0], b[1]);
      verts.push(a[0], ha, a[1], b[0], hb, b[1], a[0], -SLAB, a[1]);
      verts.push(b[0], hb, b[1], b[0], -SLAB, b[1], a[0], -SLAB, a[1]);
    }
    const sg = new T.BufferGeometry();
    sg.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
    sg.computeVertexNormals();
    const sideMat = new T.ShaderMaterial({
      side: T.DoubleSide,
      uniforms: { uTopY: { value: hmax }, uBotY: { value: -SLAB } },
      vertexShader: `
        varying vec3 vP;
        void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        precision highp float;
        uniform float uTopY, uBotY;
        varying vec3 vP;
        float band(float y, float period){ float f = fract(y / period); return smoothstep(0.0, 0.12, f) * (1.0 - smoothstep(0.78, 0.98, f)); }
        void main(){
          float depth = clamp((vP.y - uBotY) / max(uTopY - uBotY, 0.001), 0.0, 1.0);
          vec3 deep = vec3(0.055, 0.048, 0.043);
          vec3 mid  = vec3(0.125, 0.104, 0.086);
          vec3 top  = vec3(0.215, 0.180, 0.145);
          vec3 col = depth < 0.55 ? mix(deep, mid, depth / 0.55) : mix(mid, top, (depth - 0.55) / 0.45);
          float wob = sin(vP.x * 0.07 + vP.z * 0.05) * 0.55 + sin(vP.x * 0.021 - vP.z * 0.017) * 1.1;
          float strata = band(vP.y + wob, 2.35) * 0.5 + band(vP.y * 1.0 + wob * 0.6 + 1.1, 7.4) * 0.5;
          col += vec3(0.075, 0.060, 0.044) * strata * (0.35 + 0.65 * depth);
          float grit = fract(sin(dot(vec2(vP.x, vP.y * 3.1), vec2(12.9898, 78.233))) * 43758.5453);
          col += (grit - 0.5) * 0.012;
          float soil = 1.0 - smoothstep(0.86, 1.0, depth);
          col = mix(vec3(0.30, 0.25, 0.20), col, soil);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.sides = new T.Mesh(sg, sideMat);
    this.group.add(this.sides);

    this.base = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshBasicMaterial({ color: 0x0B0A09 }));
    this.base.rotation.x = Math.PI / 2;
    this.base.position.y = -SLAB;
    this.group.add(this.base);
  }

  buildWater() {
    const T = THREE, wl = this.R.waterLevel;
    if (this.raster && !this.raster.hasWater) return;  // an inland venue with no lake in frame

    /* The sea's footprint.
     *
     * The generated map extrudes a polygon from `coastX(z)`, which is exactly
     * the single-valued coastline a real venue cannot use. For a surveyed one
     * the water sheet covers the whole slab and the land simply stands above
     * it: the baked field puts every water cell below the water line and every
     * land cell above it, so the terrain hides the sheet everywhere it should
     * and nowhere it should not. That is one plane instead of a reconstructed
     * coast outline, and it copes with bays, islands and estuaries for free.
     */
    let geometry;
    if (this.raster) {
      geometry = new T.PlaneGeometry(W, D, 120, 84);
    } else {
      const shape = new T.Shape(), zs = [];
      for (let z = -D / 2; z <= D / 2; z += 2) zs.push(z);
      shape.moveTo(this.coastX(zs[0]), -zs[0]);
      zs.forEach(z => shape.lineTo(this.coastX(z), -z));
      shape.lineTo(W / 2, -D / 2); shape.lineTo(W / 2, D / 2);
      geometry = new T.ShapeGeometry(shape);
    }
    const shoreTexture = this.raster ? this.raster.shoreTexture(T) : null;
    const seaMat = new T.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        // #0B3D5C is the ocean. The other two are small tonal moves either
        // side of it — a touch deeper offshore, a touch lighter over the
        // shoals — so the whole surface still reads as the one colour.
        uOcean: { value: screenColor(0x0B3D5C) },
        uDeep: { value: screenColor(0x072F49) },
        uShoal: { value: screenColor(0x14567A) },
        uCoast: {
          value: this.raster
            ? new T.Vector4(0, 0, 0, 0)
            : new T.Vector4(this.R.sea.base, this.R.sea.amp, this.R.sea.f, this.R.sea.amp2),
        },
        uCoastF2: { value: this.raster ? 0 : this.R.sea.f2 },
        uShore: { value: shoreTexture },
        uSlab: { value: new T.Vector2(W, D) },
        uShoreRange: { value: SHORE_TEXTURE_RANGE },
      },
      defines: this.raster ? { USE_SHORE_FIELD: '' } : {},
      vertexShader: `
        uniform float uTime;
        varying vec3 vWP;
        void main(){
          vec3 p = position;
          float wave = sin(p.x * 0.15 + uTime * 0.55) * cos(p.y * 0.12 - uTime * 0.4) * 0.14
                     + sin(p.x * 0.045 - uTime * 0.22) * 0.22
                     + sin(p.y * 0.08 + uTime * 0.33) * 0.1;
          p.z += wave;
          vec4 wp = modelMatrix * vec4(p, 1.0);
          vWP = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        precision highp float;
        uniform vec3 uOcean, uDeep, uShoal;
        uniform vec4 uCoast;
        uniform float uTime, uCoastF2, uShoreRange;
        uniform vec2 uSlab;
        uniform sampler2D uShore;
        varying vec3 vWP;

        /* The coast line, evaluated in the shader, so depth shading follows the
           actual shape of the shore instead of a straight line of longitude. */
        float coastX(float z){
          return uCoast.x + uCoast.y * sin(z * uCoast.z) + uCoast.w * sin(z * uCoastF2);
        }

        void main(){
        #ifdef USE_SHORE_FIELD
          /* A real coast has no closed form, so the same number the formula
             above produces is read from the baked distance-to-shore field
             instead -- the one field that serves every consumer the old
             coastX() had. */
          vec2 uv = (vWP.xz + uSlab * 0.5) / uSlab;
          float offshore = texture2D(uShore, uv).r * uShoreRange;
        #else
          float offshore = max(vWP.x - coastX(vWP.z), 0.0);
        #endif
          vec3 viewDir = normalize(cameraPosition - vWP);
          float fresnel = pow(1.0 - clamp(viewDir.y, 0.0, 1.0), 3.0);

          /* Ocean body: one colour across the whole surface, moved only
             slightly deeper offshore and slightly lighter over the shoals. */
          vec3 col = uOcean;
          col = mix(col, uShoal, (1.0 - smoothstep(0.0, 16.0, offshore)) * 0.34);
          col = mix(col, uDeep, smoothstep(0.0, 58.0, offshore) * 0.30);

          /* Long, low swell — a slow tonal drift over the body of the water,
             no speckle. */
          float swell = sin(vWP.x * 0.045 - uTime * 0.20) * 0.50
                      + sin(vWP.z * 0.037 + uTime * 0.15) * 0.30
                      + sin((vWP.x + vWP.z) * 0.019 - uTime * 0.11) * 0.20;
          col *= 1.0 + swell * 0.035;

          /* Grazing-angle sheen and a slow glint band travelling with the swell. */
          float glint = sin(vWP.x * 0.10 + vWP.z * 0.075 + uTime * 0.35) * 0.5 + 0.5;
          col += vec3(0.045, 0.060, 0.070) * pow(glint, 8.0);
          col += vec3(0.020, 0.045, 0.060) * fresnel;

          /* Soft wash along the water's edge so the coast doesn't read as a
             cut line — kept restrained, this is surf, not surf-white. */
          float wash = (1.0 - smoothstep(0.0, 2.6, offshore))
                     * (0.55 + 0.45 * sin(vWP.z * 0.55 + uTime * 0.8));
          col = mix(col, vec3(0.36, 0.50, 0.58), wash * 0.16);

          /* Opaque out at sea so the ocean colour is exactly the ocean colour;
             a little of the foreshore reads through in the shallows. */
          float alpha = mix(0.94, 1.0, smoothstep(0.0, 10.0, offshore));
          gl_FragColor = vec4(col, alpha);
        }`,
    });
    const sea = new T.Mesh(geometry, seaMat);
    sea.rotation.x = -Math.PI / 2; sea.position.y = wl + 0.05;
    this.sea = sea; this.group.add(sea);

    /* No river ribbon. The tube that used to run down the valley was buried in
       the terrain for most of its length and surfaced only where the ground
       falls away at the coast — that exposed end cap was the blue slab sitting
       in the land near the lower-right shore. The valley itself is untouched
       terrain and now reads through the contours, which is how a watercourse
       belongs on a topographic sheet. Blue lives in the ocean only. */
  }

  routeCurve(c, lift) {
    const T = THREE;
    return new T.CatmullRomCurve3(c.pts.map((p, i) => new T.Vector3(p[0], c.ys[i] + lift, p[1])), false, 'catmullrom', 0.3);
  }

  buildRoutes() {
    const T = THREE, grp = new T.Group();
    this.routeGroup = grp; this.routeMeshes = {};
    [['Swim', this.swimC, 0.28], ['Bicycle', this.bikeC, 0.5], ['Run', this.runC, 0.5]].forEach(([disc, c, lift]) => {
      const sub = new T.Group();
      const casing = new T.Mesh(new T.TubeGeometry(this.routeCurve(c, lift), 700, 0.62, 8, false),
        new T.MeshBasicMaterial({ color: 0x100E0C, transparent: true, opacity: 0.8 }));
      const core = new T.Mesh(new T.TubeGeometry(this.routeCurve(c, lift + 0.62), 700, 0.32, 8, false),
        new T.MeshBasicMaterial({ color: DISCIPLINE_COLORS[disc], transparent: true }));
      const glow = new T.Mesh(new T.TubeGeometry(this.routeCurve(c, lift + 0.62), 320, 1.3, 8, false),
        new T.MeshBasicMaterial({ color: DISCIPLINE_COLORS[disc], transparent: true, opacity: 0.13, blending: T.AdditiveBlending, depthWrite: false }));
      sub.add(casing, glow, core);
      sub.userData = { core, glow, casing };
      grp.add(sub);
      this.routeMeshes[disc] = sub;
    });
    // transition node where all three legs meet
    const node = new T.Mesh(new T.SphereGeometry(0.7, 20, 14), new T.MeshBasicMaterial({ color: 0xF5F1EA }));
    node.position.set(this.exit[0], this.R.waterLevel + 0.94, this.exit[1]);
    grp.add(node);
    this.group.add(grp);
  }

  buildCursorMark() {
    const T = THREE, g = new T.Group();
    const ring = new T.Mesh(new T.RingGeometry(1.5, 2.05, 44), new T.MeshBasicMaterial({ color: 0xF5F1EA, transparent: true, opacity: 0.7, side: T.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    const dot = new T.Mesh(new T.CircleGeometry(0.5, 22), new T.MeshBasicMaterial({ color: 0xE8552A }));
    dot.rotation.x = -Math.PI / 2;
    g.add(ring, dot); g.visible = false;
    this.cursorMark = g; this.group.add(g);
  }

  applyMode() {
    const mode = this.mode;
    Object.keys(this.routeMeshes || {}).forEach(disc => {
      const s = this.routeMeshes[disc], on = mode === 'All' || mode === disc;
      s.userData.core.material.opacity = on ? 1 : 0.1;
      s.userData.casing.material.opacity = on ? 0.8 : 0.12;
      s.userData.glow.visible = on;
    });
  }

  // ---- discrete UI state --------------------------------------------------

  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.applyMode();
    this.frame(mode);
  }

  setHand(hand) {
    this.hand = hand;
    if (this.controls) {
      this.controls.enableRotate = hand;
      this.controls.autoRotate = !hand && this.autoOrbit;
    }
  }

  setRelief(relief) {
    if (relief === this.relief) return;
    this.relief = relief;
    if (this.group) this.rebuild();
  }

  setContours(contours) { this.contours = contours; }

  setAutoOrbit(autoOrbit) {
    this.autoOrbit = autoOrbit;
    if (this.controls) this.controls.autoRotate = !this.hand && autoOrbit;
  }

  /* Frames a set of world points: binary-searches the distance that just
     contains them with a margin, then slides the target until they sit centred.
     It measures the real projection instead of scaling a magic radius by a fudge
     factor, so the framing holds its proportions at any window shape and the
     map cannot end up cropped. */
  fitPoints(pts, margin) {
    const T = THREE;
    const el = this.stage;
    const aspect = el ? el.clientWidth / Math.max(el.clientHeight, 1) : 1.8;
    const view = this.venue.view;
    const az = view ? view.azimuth : DEFAULT_AZIMUTH;
    const po = view ? view.polar : DEFAULT_POLAR;
    const dir = new T.Vector3(Math.sin(po) * Math.sin(az), Math.cos(po), Math.sin(po) * Math.cos(az));
    const right = new T.Vector3().crossVectors(new T.Vector3(0, 1, 0), dir).normalize();
    const up = new T.Vector3().crossVectors(dir, right).normalize();

    const cam = new T.PerspectiveCamera(this.cam.fov, aspect, this.cam.near, this.cam.far);
    const target = new T.Box3().setFromPoints(pts).getCenter(new T.Vector3());
    const v = new T.Vector3();
    const bboxAt = dist => {
      cam.position.copy(target).addScaledVector(dir, dist);
      cam.lookAt(target);
      cam.updateMatrixWorld(true);
      cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const p of pts) {
        v.copy(p).project(cam);
        x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x);
        y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
      }
      return { x0, x1, y0, y1 };
    };

    const lim = 1 - margin;
    let dist = 240;
    // target and distance depend on each other, so settle them together
    for (let pass = 0; pass < 4; pass++) {
      let lo = FRAME_MIN_DIST, hi = FRAME_MAX_DIST;
      for (let i = 0; i < 32; i++) {
        const mid = (lo + hi) / 2;
        const b = bboxAt(mid);
        if ((b.x1 - b.x0) / 2 <= lim && (b.y1 - b.y0) / 2 <= lim) hi = mid; else lo = mid;
      }
      dist = hi;
      const b = bboxAt(dist);
      const hh = dist * Math.tan((cam.fov * Math.PI / 180) / 2);
      target.addScaledVector(right, ((b.x0 + b.x1) / 2) * hh * aspect);
      target.addScaledVector(up, ((b.y0 + b.y1) / 2) * hh);
    }
    return { target, dist };
  }

  frame(mode, instant) {
    const T = THREE;
    let target, dist;
    if (mode === 'All' && this.venue.view) {
      const el = this.stage;
      const aspect = el ? el.clientWidth / Math.max(el.clientHeight, 1) : this.venue.view.aspect;
      target = new T.Vector3(...this.venue.view.target);
      // exact at the aspect the view was set on; on a narrower window pull back
      // just far enough to keep the same content in frame
      dist = clamp(this.venue.view.distance * Math.max(1, this.venue.view.aspect / aspect), FRAME_MIN_DIST, FRAME_MAX_DIST);
    } else if (mode === 'All') {
      /* No solved camera: frame the **slab**, not the course.
       *
       * VENUES.md offers `fitPoints()` as the alternative to a hand-posed
       * view, and the points to fit are the plate rather than the route. The
       * showcase map's solved composition sits the whole slab in frame with
       * air around it, and a surveyed venue is already padded to fit inside
       * the same slab — so framing the plate gives every race the same
       * composition, where framing the route would zoom a compact course
       * until its terrain ran off the top edge. */
      const pts = [];
      for (const sx of [-1, -0.5, 0, 0.5, 1]) {
        for (const sz of [-1, -0.5, 0, 0.5, 1]) {
          const x = (sx * W) / 2, z = (sz * D) / 2;
          pts.push(new T.Vector3(x, this.height(x, z), z));
        }
      }
      ({ target, dist } = this.fitPoints(pts, FRAME_MARGIN_SLAB));
    } else {
      const c = mode === 'Swim' ? this.swimC : mode === 'Bicycle' ? this.bikeC : this.runC;
      const pts = c.pts.map((p, i) => new T.Vector3(p[0], c.ys[i], p[1]));
      ({ target, dist } = this.fitPoints(pts, FRAME_MARGIN_ROUTE));
    }
    if (instant) {
      const view = this.venue.view;
      const polar = view ? view.polar : DEFAULT_POLAR;
      const azimuth = view ? view.azimuth : DEFAULT_AZIMUTH;
      this.controls.target.copy(target);
      this.cam.position.set(
        target.x + dist * Math.sin(polar) * Math.sin(azimuth),
        target.y + dist * Math.cos(polar),
        target.z + dist * Math.sin(polar) * Math.cos(azimuth));
      this.controls.update();
      this.want = null;
    } else this.want = { target, dist };
  }

  resize() {
    const el = this.stage;
    if (!el || !this.renderer) return;
    /* setSize must be left to write the canvas CSS size (the third argument,
       updateStyle, defaults to true). Suppressing it leaves the canvas with no
       CSS size, so it falls back to its intrinsic size — the width/height
       attributes, which three sets to size x pixelRatio. On any display above
       1x that draws the scene at 1.5-2x, anchored at the stage's top-left,
       while this overlay keeps placing markers against the true stage box:
       every pin and flag then sits adrift toward the top-left, further out the
       further it is from that corner. The backing store stays at pixelRatio
       either way, so nothing is lost in sharpness. */
    this.renderer.setSize(el.clientWidth, el.clientHeight);
    this.cam.aspect = el.clientWidth / Math.max(el.clientHeight, 1);
    this.cam.updateProjectionMatrix();
  }

  project(v3) {
    const el = this.stage, v = v3.clone().project(this.cam);
    return { x: (v.x * 0.5 + 0.5) * el.clientWidth, y: (-v.y * 0.5 + 0.5) * el.clientHeight, z: v.z };
  }

  // ---- overlay + cursor readout -------------------------------------------

  registerReadoutEls({ elevEl, elevBarEl, slopeEl, surfaceEl }) {
    this.elevEl = elevEl; this.elevBarEl = elevBarEl; this.slopeEl = slopeEl; this.surfaceEl = surfaceEl;
  }

  registerPinEl(idx, el) { if (el) this.pinEls[idx] = el; else delete this.pinEls[idx]; }
  registerFlagEl(idx, el) { if (el) this.flagEls[idx] = el; else delete this.flagEls[idx]; }

  /** Bilinear read of the baked elevation field — the terrain height at any
   *  world x,z, for the cost of four array lookups. */
  sampleDem(x, z) {
    const d = this.demRaw;
    if (!d) return this.height(x, z);
    const gx = clamp((x + W / 2) / W * (DEM_NX - 1), 0, DEM_NX - 1);
    const gz = clamp((z + D / 2) / D * (DEM_NZ - 1), 0, DEM_NZ - 1);
    const i0 = Math.floor(gx), j0 = Math.floor(gz);
    const i1 = Math.min(i0 + 1, DEM_NX - 1), j1 = Math.min(j0 + 1, DEM_NZ - 1);
    const fx = gx - i0, fz = gz - j0;
    const a = d[j0 * DEM_NX + i0], b = d[j0 * DEM_NX + i1];
    const c = d[j1 * DEM_NX + i0], e = d[j1 * DEM_NX + i1];
    return (a + (b - a) * fx) * (1 - fz) + (c + (e - c) * fx) * fz;
  }

  /** Is the ground between this anchor and the camera? Markers live in an HTML
   *  overlay above the canvas, so nothing hides them for free — a pin on the
   *  far slope would otherwise show straight through the mountain. Walking the
   *  height field from the anchor toward the camera costs a few dozen array
   *  reads, where raycasting the 78k-triangle terrain mesh every frame would
   *  not be affordable. */
  isOccluded(anchor) {
    const cam = this.cam.position;
    const dx = cam.x - anchor.x, dy = cam.y - anchor.y, dz = cam.z - anchor.z;
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-3) return false;
    // skip the anchor's immediate surroundings: it sits just above its own
    // ground, which must not count as blocking it
    const t0 = Math.min(2.5 / len, 0.4);
    const steps = 56;
    for (let s = 1; s <= steps; s++) {
      const t = t0 + (1 - t0) * (s / steps);
      const y = anchor.y + dy * t;
      if (y > this.hmax + 0.5) break;                  // above every summit: clear
      const x = anchor.x + dx * t, z = anchor.z + dz * t;
      if (x < -W / 2 || x > W / 2 || z < -D / 2 || z > D / 2) break;  // off the slab
      if (this.sampleDem(x, z) > y + 0.35) return true;
    }
    return false;
  }

  /** Show or hide one marker, writing only on a change so the compositor is not
   *  handed a new value every frame. */
  setMarkerVisible(node, visible) {
    if (node.__vis === visible) return;
    node.__vis = visible;
    node.style.opacity = visible ? '1' : '0';
    node.style.pointerEvents = visible ? 'auto' : 'none';
  }

  placeOverlay() {
    if (!this.anchors) return;
    for (const k of Object.keys(this.pinEls)) {
      const idx = +k, node = this.pinEls[idx], anchor = this.anchors.pins[idx];
      if (!node || !anchor) continue;
      const s = this.project(anchor);
      node.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`;
      node.style.zIndex = String(800 - Math.round(s.z * 700));
      // s.z leaves [-1,1] once the anchor falls behind the camera, where the
      // projection flips and would strand the pin on the wrong side
      this.setMarkerVisible(node, s.z < 1 && !this.isOccluded(anchor));
    }
    for (const k of Object.keys(this.flagEls)) {
      const idx = +k, node = this.flagEls[idx], anchor = this.anchors.flags[idx];
      if (!node || !anchor) continue;
      const s = this.project(anchor);
      node.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`;
      this.setMarkerVisible(node, s.z < 1 && !this.isOccluded(anchor));
    }
  }

  clearCursor() {
    if (this.cursorMark) this.cursorMark.visible = false;
    if (this.elevEl) this.elevEl.textContent = '—';
    if (this.elevBarEl) this.elevBarEl.style.width = '0%';
    if (this.slopeEl) this.slopeEl.textContent = 'GRADE —';
    if (this.surfaceEl) this.surfaceEl.textContent = 'NO CURSOR';
  }

  sampleCursor() {
    if (!this.surf) return;
    this.ray.setFromCamera(this.ndc, this.cam);
    const hit = this.ray.intersectObject(this.surf, false)[0];
    if (!hit) { this.clearCursor(); return; }
    const p = hit.point, wl = this.R.waterLevel;
    const water = this.waterHere(p.x, p.z);
    const units = water === null ? p.y : wl;
    const meters = Math.round((units - wl) * this.mPerUnit + this.R.datum);
    const top = Math.max(this.hmax || 20, 6);
    if (this.elevEl) this.elevEl.textContent = String(Math.max(0, meters));
    if (this.elevBarEl) this.elevBarEl.style.width = `${clamp(((units - wl) / top) * 100, 0, 100).toFixed(0)}%`;
    if (this.slopeEl) {
      const n = hit.face ? hit.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(this.surf.matrixWorld)).normalize() : null;
      const grade = n ? Math.tan(Math.acos(clamp(n.y, 0, 1))) * 100 / 3.2 : 0;
      this.slopeEl.textContent = water === null ? `GRADE ${grade.toFixed(1)}%` : 'GRADE —';
    }
    if (this.surfaceEl) {
      /* Named from the ground under the cursor, and only from what is
         actually known about it. A surveyed venue has no invented river to
         name and its shore comes from the water mask rather than from a
         coastline formula. */
      let label = this.raster ? 'GROUND' : 'FARMLAND';
      if (water !== null) label = 'OPEN WATER';
      else if (Math.hypot(p.x - this.R.hub[0], p.z - this.R.hub[1]) < 14) label = 'RACE VILLAGE';
      else if (!this.raster && this.nearRiver(p.x, p.z) < 6) label = 'RIVER';
      else if (this.raster ? this.raster.shoreDistance(p.x, p.z) < 8 : this.coastX(p.z) - p.x < 8) label = 'SHORE';
      else if (units - wl > 0.6 * top) label = 'RIDGE';
      else if (units - wl > 0.32 * top) label = 'HILLSIDE';
      this.surfaceEl.textContent = label;
    }
    if (this.cursorMark) {
      this.cursorMark.visible = true;
      this.cursorMark.position.set(p.x, units + 0.45, p.z);
    }
  }

  nearRiver(x, z) {
    const c = this.riverC;
    let d = 1e9;
    for (let i = 0; i < c.pts.length - 1; i += 2) {
      const a = c.pts[i], b = c.pts[i + 1];
      d = Math.min(d, segD(x, z, a[0], a[1], b[0], b[1]).d);
    }
    return d;
  }

  zoom(f) {
    if (!this.cam) return;
    const t = this.controls.target, dir = this.cam.position.clone().sub(t);
    const len = clamp(dir.length() * f, 112, 520);
    this.cam.position.copy(t.clone().add(dir.normalize().multiplyScalar(len)));
    this.controls.update();
    this.want = null;
  }

  zoomIn() { this.zoom(0.82); }
  zoomOut() { this.zoom(1.22); }
  resetView() { this.frame(this.mode, true); }
}
