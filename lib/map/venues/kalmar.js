/* Kalmar 70.3 — the reference venue.
 *
 * Everything venue-specific lives in a file like this one. The engine holds no
 * knowledge of any particular race: hand it a different venue object and it
 * builds a different map. See VENUES.md for the full field-by-field schema, the
 * units, the constraints each field has to satisfy, and how to author a new one.
 *
 * IMPORTANT: this terrain is invented, not surveyed. `terrain` below drives a
 * procedural landform (sine shelves, Gaussian peaks, ridged noise) that reads as
 * a plausible coastal plain — it is not a DEM of Sweden, and the coastline is
 * not Kalmar's real coastline. If a venue has to match the real place, see the
 * "Real-terrain path" section of VENUES.md; it needs a different terrain source,
 * not different numbers here.
 */
export const kalmar = {
  id: 'kalmar',

  /* Header copy and the stat card. Purely presentational. */
  meta: {
    title: 'Kalmar 70.3',
    subtitle: 'KALMAR, SWEDEN · COASTAL PLAIN · MAX 168 M',
  },
  stats: {
    All: { label: 'FULL COURSE · 70.3', dist: '113.0 km', gain: '412', gainLabel: 'M GAIN', split: '11:45' },
    Swim: { label: 'SWIM · KALMAR STRAIT', dist: '1.9 km', gain: '18', gainLabel: '°C WATER', split: '1:06' },
    Bicycle: { label: 'BICYCLE · ONE LOOP', dist: '90.1 km', gain: '387', gainLabel: 'M GAIN', split: '6:05' },
    Run: { label: 'RUN · OUT AND BACK', dist: '21.1 km', gain: '25', gainLabel: 'M GAIN', split: '4:22' },
  },

  /* The landform. All lengths are world units; 1 unit = M_PER_UNIT metres. */
  terrain: {
    datum: 0,          // metres added to every reported elevation
    waterLevel: 0,     // world y of the sea surface
    maxGrade: 0.075,   // steepest gradient a road is allowed to hold
    rugged: 0.95,      // amplitude of the ridged-noise detail
    // Coastline: x = base + amp·sin(z·f) + amp2·sin(z·f2). Land is x < coastX(z).
    sea: { base: 46, amp: 5, f: 0.036, amp2: 1.6, f2: 0.085 },
    // Hills as [x, z, radius, height] Gaussians.
    peaks: [[-74, -24, 30, 12], [-96, -6, 22, 9], [-56, -44, 22, 7], [-36, 26, 26, 8],
      [-62, 40, 20, 6], [4, -46, 24, 5], [-14, 40, 18, 4], [16, 24, 16, 3]],
    // Drainage line, inland to sea; carves a valley, drawn only as contours.
    river: [[-108, 46], [-80, 42], [-52, 38], [-26, 39], [0, 41], [24, 43], [46, 41], [60, 40]],
    hub: [32, 2],      // race village; terrain is flattened around it
  },

  /* The three course lines. Each is a closed ring of control points spaced
     9-14 units apart — even spacing is what makes a Catmull-Rom through them
     read as one clean sweep, and closing them is what keeps them free of cusps. */
  courses: {
    /* Swim is given as (offset from the coast line, z) so it follows the shore's
       curve rather than a straight meridian. Index 0 and index `swimExit` are
       the two beach touches — the start, and the swim exit which is the T1/T2
       transition every other course line hangs off. The last point carries the
       ring back along the shore a few units offshore so it stays in water. */
    swim: self => [[4, 14], [11, 18], [21, 17], [28, 9], [28, -1], [22, -10], [12, -13], [4, -6], [3, 3]]
      .map(([o, z]) => [self.coastX(z) + o, z]),
    swimExit: 7,
    // Bike and run are plain world [x, z]; the transition is prepended by the
    // engine, so both rings begin and end there.
    bike: [[14, 17], [-14, 27], [-44, 30], [-70, 21], [-88, 1], [-76, -24], [-48, -36], [-18, -34], [4, -22], [20, -10]],
    run: [[45, 8], [46, 20], [43, 33], [35, 44], [23, 47], [13, 40], [15, 28], [27, 20], [40, 7]],
  },

  /* Markers placed by fraction `t` along their course line. */
  aid: [
    { route: 'Bicycle', t: 0.17, kind: 'AID', label: 'Aid station 1', detail: 'BIKE KM 15 · WATER, CARB' },
    { route: 'Bicycle', t: 0.33, kind: 'AID', label: 'Aid station 2', detail: 'BIKE KM 30 · SPECIAL NEEDS' },
    { route: 'Bicycle', t: 0.48, kind: 'CUT-OFF', label: 'Turn · km 45', detail: 'CUT-OFF 6:10 · HIGH POINT' },
    { route: 'Bicycle', t: 0.66, kind: 'AID', label: 'Aid station 3', detail: 'BIKE KM 59 · WATER, GEL' },
    { route: 'Bicycle', t: 0.84, kind: 'AID', label: 'Aid station 4', detail: 'BIKE KM 76 · WATER' },
    { route: 'Run', t: 0.22, kind: 'AID', label: 'Aid station 5', detail: 'RUN KM 4.6 · WATER, COLA' },
    { route: 'Run', t: 0.5, kind: 'AID', label: 'Aid station 6 · turn', detail: 'RUN KM 10.5 · ICE, SPONGE' },
    { route: 'Run', t: 0.78, kind: 'AID', label: 'Aid station 7', detail: 'RUN KM 16.4 · WATER, GEL' },
    { route: 'Swim', t: 0.5, kind: 'CUT-OFF', label: 'Far turn buoy', detail: 'SWIM EXIT CUT-OFF 2:20' },
  ],
  transition: { label: 'T1 / T2 · race village', detail: 'SWIM EXIT 2:20 · BIKE IN 8:30' },
  startFlag: { label: 'Swim start · beach', detail: '07:00 ROLLING START · KM 0.0' },
  finishFlag: { label: 'Finish chute · race village', detail: 'KM 113.0 · CUT-OFF 16:00' },
  // How far back along the run's last stretch the finish flag sits, world units.
  finishBack: 14,

  /* The default camera. Set by hand, then solved: OrbitControls has panning
     disabled, so only azimuth, polar and distance could have been changed from
     what the framing produced, and those three were recovered by least squares
     from five known world anchors measured off the reference (RMS 2.1px).
     `aspect` records the stage shape it was set on, so the composition can be
     held exactly there and only relaxed on a narrower window.
     See VENUES.md "Solving a default camera" to reproduce this for a new venue. */
  view: {
    target: [2.0283, -6.6384, 15.3898],
    azimuth: 0.30422,
    polar: 1.04119,
    distance: 244.547,
    aspect: 1335 / 518,
  },
};

export default kalmar;
