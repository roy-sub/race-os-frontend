/* A real venue's terrain, sampled from a baked field.
 *
 * The engine's own landform is *generated* — sine shelves, Gaussian peaks,
 * ridged noise — which is what makes the Kalmar showcase map read as a
 * composition and also what makes it incapable of matching a real place.
 * `TRACKS.md` §6 names the two gaps that have to close before a real event can
 * use the same renderer, and this module closes both:
 *
 *   1. **No measured elevation.** `baseHeight(x, z)` here is a bilinear sample
 *      of a height grid the backend baked from a digital elevation model, not
 *      an analytic function.
 *   2. **The coastline is single-valued.** The generated map defines land as
 *      `x < coastX(z)`, which cannot express a bay, an island or an estuary at
 *      all. Here water is a mask plus a distance-to-shore field on the same
 *      grid, which serves every consumer the old `coastX` had — the height
 *      profile, the cursor readout, the sea mesh and the sea shader — and is
 *      capable of a real coast.
 *
 * Nothing in this file touches the generated path. A venue without a `field`
 * renders exactly as it did before, which is the whole point: the showcase map
 * is signed-off artwork and must not move.
 *
 * The grid is laid out row-major over the slab: `x` from `-W/2` to `+W/2`
 * across a row, `z` from `-D/2` to `+D/2` down the rows — the same orientation
 * the terrain plane is displaced in.
 */

export class RasterTerrain {
  /** @param field the `field` + `world` payload from `GET /courses/{ref}/terrain` */
  constructor(field, world) {
    this.nx = field.nx;
    this.nz = field.nz;
    this.heights = Float32Array.from(field.heights);
    this.water = Uint8Array.from(field.water);
    /* Signed distance to the water line: positive inland, negative offshore.
       One field for both the cursor's SHORE label and the sea shader's depth
       falloff — where the generated map evaluates its coastline formula twice,
       once in JS and once in GLSL. */
    this.shore = Float32Array.from(field.signed_shore);

    this.width = world.width;
    this.depth = world.depth;
    this.waterLevel = world.water_level;
    this.hasWater = world.has_water;
    /* Metres per world unit *vertically*. The engine's module constant is 7,
       tuned for the generated map; a real venue computes its own, because the
       elevation readout and the contour interval both read it and a shared
       constant would report one venue's heights in another's units. */
    this.metresPerUnit = world.metres_per_unit_vertical;
    this.datum = world.datum_m;

    this.cellX = this.width / (this.nx - 1);
    this.cellZ = this.depth / (this.nz - 1);
  }

  /** Grid coordinates for a world point, clamped to the slab. */
  _cell(x, z) {
    const fx = Math.min(this.nx - 1, Math.max(0, (x + this.width / 2) / this.cellX));
    const fz = Math.min(this.nz - 1, Math.max(0, (z + this.depth / 2) / this.cellZ));
    const ix = Math.min(this.nx - 2, Math.floor(fx));
    const iz = Math.min(this.nz - 2, Math.floor(fz));
    return { ix, iz, dx: fx - ix, dz: fz - iz };
  }

  /** Bilinear, because the mesh is displaced at grid resolution and the
   *  contour field is reconstructed at 512×352 above it — nearest-neighbour
   *  would put a step under every contour line. */
  _bilinear(array, x, z) {
    const { ix, iz, dx, dz } = this._cell(x, z);
    const row = iz * this.nx;
    const next = row + this.nx;
    const a = array[row + ix];
    const b = array[row + ix + 1];
    const c = array[next + ix];
    const d = array[next + ix + 1];
    return (a * (1 - dx) + b * dx) * (1 - dz) + (c * (1 - dx) + d * dx) * dz;
  }

  baseHeight(x, z) {
    return this._bilinear(this.heights, x, z);
  }

  /** `waterLevel` over water, `null` over land. Same contract as `coastX`. */
  waterAt(x, z) {
    if (!this.hasWater) return null;
    const { ix, iz, dx, dz } = this._cell(x, z);
    const i = (dz > 0.5 ? iz + 1 : iz) * this.nx + (dx > 0.5 ? ix + 1 : ix);
    return this.water[i] ? this.waterLevel : null;
  }

  /** Signed units from the water line: positive inland, negative offshore. */
  shoreDistance(x, z) {
    if (!this.hasWater) return Infinity;
    return this._bilinear(this.shore, x, z);
  }

  /** Highest ground on the slab, for the contour interval and the readout bar. */
  maxHeight() {
    let top = -Infinity;
    for (let i = 0; i < this.heights.length; i++) {
      if (this.heights[i] > top) top = this.heights[i];
    }
    return top;
  }

  /**
   * Shore distance as a texture the sea shader can read.
   *
   * The generated map re-evaluates `coastX(z)` in GLSL to get `offshore`. A
   * real coast has no such closed form, so the same number is looked up from
   * the baked field instead — one channel, linear-filtered, addressed in the
   * same slab space the fragment already has in `vWP`.
   *
   * Encoded as a byte over `[0, SHORE_TEXTURE_RANGE]` units: the shader only
   * uses it out to ~58 units of falloff, so a byte is half a unit of
   * precision where it matters and nothing at all where it does not.
   */
  shoreTexture(THREE) {
    const data = new Uint8Array(this.nx * this.nz);
    for (let i = 0; i < data.length; i++) {
      // The shader wants distance *out to sea*, which is the negative half of
      // the signed field. Land clamps to zero, which is what puts the surf
      // wash exactly on the water line.
      const value = Math.max(0, -this.shore[i]);
      data[i] = Math.min(255, Math.round((value / SHORE_TEXTURE_RANGE) * 255));
    }
    const texture = new THREE.DataTexture(data, this.nx, this.nz, THREE.RedFormat);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
  }

}

/** Units the shore texture's byte range spans. See `shoreTexture`. */
export const SHORE_TEXTURE_RANGE = 96;

/**
 * A venue object for a real event, from the backend's baked field.
 *
 * The shape is the one `VENUES.md` documents, with two differences that are
 * the whole difference between a generated map and a surveyed one:
 *
 * - `field` is present, which switches the engine onto the raster terrain.
 * - `courses` are plain world points already projected and scaled by the
 *   backend, with **one horizontal scale across all three legs**. The showcase
 *   map's three legs disagree by 14.5×, which is what lets its swim read at
 *   all; at true scale a 1.9 km swim beside a 90 km bike loop is a speck, and
 *   showing it as a speck is the honest answer.
 */
export function venueFromField(payload, { title, subtitle, stats, markers } = {}) {
  const world = payload.world;
  return {
    id: payload.course.slug,
    meta: {
      title: title ?? payload.course.name,
      subtitle: subtitle ?? subtitleFor(payload),
    },
    stats: stats ?? statsFor(payload),
    field: payload.field,
    world,
    terrain: {
      datum: world.datum_m,
      waterLevel: world.water_level,
      maxGrade: 0.075,
      metresPerUnitVertical: world.metres_per_unit_vertical,
      hub: hubOf(payload),
    },
    courses: {
      swim: payload.routes.swim ?? [],
      bike: payload.routes.bike ?? [],
      run: payload.routes.run ?? [],
    },
    ...(markers ?? markersFor(payload)),
    attribution: payload.attribution,
  };
}

/** The race village: where the swim ends and both other legs begin. */
function hubOf(payload) {
  const swim = payload.routes.swim ?? [];
  const bike = payload.routes.bike ?? [];
  const anchor = bike[0] ?? swim[swim.length - 1] ?? [0, 0];
  return [anchor[0], anchor[1]];
}

function subtitleFor(payload) {
  const place = payload.course.place.toUpperCase();
  const relief = Math.round(payload.world.relief_m);
  return `${place} · SURVEYED TERRAIN · ${payload.world.vertical_exaggeration}× VERTICAL · MAX ${relief} M`;
}

function km(metres) {
  return `${(metres / 1000).toFixed(1)} km`;
}

function statsFor(payload) {
  const legs = payload.legs ?? {};
  const total = Object.values(legs).reduce((sum, leg) => sum + (leg.distance_m ?? 0), 0);
  const gain = Object.values(legs).reduce((sum, leg) => sum + (leg.elevation_gain_m ?? 0), 0);
  const finish = (payload.barriers ?? []).find((b) => b.name === 'finish');
  const bikeCutoff = (payload.barriers ?? []).find((b) => b.name === 'bike_cutoff');
  const swimExit = (payload.barriers ?? []).find((b) => b.name === 'swim_exit');

  /* Cut-off limits, not target splits. The generated map's card shows a goal
     time, which for a real race would be a number nobody has solved yet — a
     plan produces that, and inventing one here is precisely the thing the
     whole product refuses to do. So the card shows the published limit, and
     says so. */
  return {
    All: {
      label: `FULL COURSE · ${payload.course.distance_type}`,
      dist: km(total),
      gain: String(Math.round(gain)),
      gainLabel: 'M GAIN',
      split: hm(finish?.limit_minutes_from_start),
      splitLabel: 'FINISH CUT-OFF',
    },
    Swim: {
      label: 'SWIM',
      dist: km(legs.swim?.distance_m ?? 0),
      gain: '—',
      gainLabel: 'OPEN WATER',
      split: hm(swimExit?.limit_minutes_from_start),
      splitLabel: 'SWIM CUT-OFF',
    },
    Bicycle: {
      label: 'BICYCLE',
      dist: km(legs.bike?.distance_m ?? 0),
      gain: String(Math.round(legs.bike?.elevation_gain_m ?? 0)),
      gainLabel: 'M GAIN',
      split: hm(bikeCutoff?.limit_minutes_from_start),
      splitLabel: 'BIKE CUT-OFF',
    },
    Run: {
      label: 'RUN',
      dist: km(legs.run?.distance_m ?? 0),
      gain: String(Math.round(legs.run?.elevation_gain_m ?? 0)),
      gainLabel: 'M GAIN',
      split: hm(finish?.limit_minutes_from_start),
      splitLabel: 'FINISH CUT-OFF',
    },
  };
}

function hm(minutes) {
  if (minutes == null) return '—';
  const total = Math.round(minutes);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const ROUTE_OF = { SWIM: 'Swim', BIKE: 'Bicycle', RUN: 'Run' };

/**
 * Pins from the bundle's own furniture, placed by distance along the leg.
 *
 * The engine positions a marker by fraction `t` along its drawn line, and a
 * published aid station is at a known kilometre — so `t` is that kilometre
 * over the leg's length. Nothing is placed by eye and nothing is invented: a
 * course with four aid stations gets four pins.
 */
function markersFor(payload) {
  const legs = payload.legs ?? {};
  const lengthKm = (leg) => (legs[leg.toLowerCase()]?.distance_m ?? 0) / 1000;

  const aid = [];
  for (const station of payload.aid_stations ?? []) {
    const length = lengthKm(station.leg);
    if (!length) continue;
    aid.push({
      route: ROUTE_OF[station.leg] ?? 'Bicycle',
      t: Math.min(0.995, Math.max(0.005, station.km / length)),
      kind: 'AID',
      label: station.name,
      detail: `${station.leg} KM ${station.km.toFixed(1)} · ${contents(station.contents)}`,
    });
  }
  for (const barrier of payload.barriers ?? []) {
    if (barrier.name === 'finish') continue;
    const length = lengthKm(barrier.leg);
    if (!length) continue;
    aid.push({
      route: ROUTE_OF[barrier.leg] ?? 'Bicycle',
      t: Math.min(0.995, Math.max(0.005, barrier.km / length)),
      kind: 'CUT-OFF',
      label: barrierLabel(barrier.name),
      detail: `CUT-OFF ${hm(barrier.limit_minutes_from_start)} · KM ${barrier.km.toFixed(1)}`,
    });
  }

  const finish = (payload.barriers ?? []).find((b) => b.name === 'finish');
  const swimExit = (payload.barriers ?? []).find((b) => b.name === 'swim_exit');
  return {
    aid,
    transition: {
      label: 'T1 / T2 · race village',
      detail: swimExit
        ? `SWIM EXIT ${hm(swimExit.limit_minutes_from_start)}`
        : 'SWIM EXIT · BIKE IN',
    },
    startFlag: { label: 'Swim start', detail: `KM 0.0 · ${payload.course.place}` },
    finishFlag: {
      label: 'Finish',
      detail: finish ? `CUT-OFF ${hm(finish.limit_minutes_from_start)}` : 'FINISH CHUTE',
    },
    finishBack: 14,
  };
}

function contents(tokens) {
  if (!tokens?.length) return 'CONTENTS NOT PUBLISHED';
  return tokens
    .slice(0, 3)
    .map((token) => token.replace(/_/g, ' ').toUpperCase())
    .join(', ');
}

function barrierLabel(name) {
  const words = name.replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
