# Race Photography — Generation Brief

Every race in the 2026 catalogue except **Kalmar 70.3** (already shot and in
place). The seven September races this brief used to cover — Emilia-Romagna at
both distances, Nice, Belgrade, Erkner, Wales and Weymouth — have been run and
are out of the catalogue, so their prompts are gone with them.

**Nothing here is blocking.** Every active race already has both images: they
are cropped and sized from the ten-photograph library the removed races left
behind, so a race can share a frame with another race that looks like it. This
brief is what replaces a shared frame with a photograph of the race itself.

**Eight images. One base render per race.** Generate the base once, then let
Higgsfield GPT 2.5 (or equivalent) reframe it to the two delivery ratios. The
prompts below are written so that a single frame survives both crops — subject
in the centre, air at the edges, a deliberately quiet bottom-left.

---

## How these images are used

| | Where it appears | Rendered size | Aspect ratio |
|---|---|---|---|
| **Banner** | Course page hero, full-bleed behind the race title | `66vh`, min 520px tall, full window width | **21:9** (≈2.33) |
| **Thumbnail** | Races index, left of each row | 172 × 132 px | **4:3** (≈1.30) |

**Base render: 2560 × 1440 (16:9).** This sits between the two targets, so the
tool extends outward to 21:9 and crops inward to 4:3 — neither direction has to
invent much. Deliver:

- Banner — `2560 × 1097` (21:9)
- Thumbnail — `1200 × 900` (4:3)

**Ship two files, not one.** `<slug>.webp` is the thumbnail and
`<slug>-hero.webp` the banner, and `lib/courseMedia.ts` looks for both by name.
One file served to both slots meant the races index downloaded up to 939 KB of
2336-pixel photograph to paint a 132-pixel-tall card. A hero still falls back to
the thumbnail if it is missing, so a single file works — it is just wasteful.

**Format: `.webp`, quality 82.** Drop the finished `.webp` straight into
`public/assets/courses/`. Nothing else needs changing — the filename *is* the
wiring.

---

## The two safe zones (this is the part that matters)

Every hero on the site lays large type over the bottom-left of the image beneath
a dark gradient. Every thumbnail is a centre crop. So each prompt asks for:

1. **Centre safe zone** — the subject and the one thing that identifies the
   place must live inside the middle 60% of the frame. That rectangle is all the
   4:3 thumbnail will keep.
2. **Bottom-left quiet zone** — the lower-left third stays dark, smooth and
   low-detail (open water, shadowed road, sand, unlit hillside). No horizon
   line, no faces, no texture competing with white type.

---

## House style — applies to all eight

Paste this into the tool once and keep it constant across the set. Consistency
between the fifteen frames is worth more than any single frame being spectacular.

```
HOUSE STYLE (constant across the series):
Cinematic editorial endurance-sport photography. Shot on full-frame, 35mm or
85mm prime, wide aperture, natural light only. Golden hour — either the first
40 minutes after sunrise or the last hour before sunset. Long shadows, warm
low-angle sun, soft atmospheric haze in the distance.

Grade: muted warm-neutral. Desaturated greens and blues, warmth held in the
highlights, deep neutral shadows that stay open rather than crushed. A single
warm terracotta-orange accent (#E4622F) should occur naturally somewhere in the
frame — a buoy, a jersey, a roof tile, a road marker — small, never dominant.
Paper-white highlights (#F1EEE8), near-black neutral shadows (#15140F), muted
stone-grey midtones (#6B6459).

The athlete, where present, is SMALL in the landscape — one or two figures at
most, distant, anonymous, never the hero of the frame. The place is the subject.
No faces readable. Motion is implied by light and line, not by blur.

Absolutely no: logos, sponsor boards, brand marks, race banners, bib numbers,
visible text or signage of any kind, watermarks, crowds, finish arches,
medals, HDR look, heavy vignette, lens flare, oversaturation, teal-and-orange
blockbuster grade, AI-glossy skin, stock-photo smiles.

Composition: subject inside the central 60% of the frame. The lower-left third
of the image is deliberately quiet — dark, smooth, low-detail — reserved for
overlaid typography. Generous negative space. Horizon off-centre.
```

---

# 1. Maresme — IRONMAN Barcelona (Calella)

- **Path:** `public/assets/courses/calella-barcelona-full.webp`
- **Action:** **Create** *(no asset exists)*
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

Calella, Maresme coast, Catalonia, Spain. Sunrise over a flat Mediterranean.
A long, straight coastal road runs parallel to the shore across the frame, palm
trees at regular intervals casting long shadows onto the tarmac, the railway
line running between road and beach on its low stone embankment. Calm sea to
the left, coarse golden sand, a headland fading into haze far down the coast.

Dead flat and fast — the whole composition is horizontal bands: sea, sand,
rail, road, palms. This is a course famous for having no hills and the picture
should say so instantly.

Sun coming up directly out of the sea, throwing a hard specular path across the
water and backlighting the palms.

A cyclist on the road in the mid-distance, small, in silhouette against the sun
path. An orange-terracotta roofline on the low buildings carries the accent.

The lower-left third is road surface and palm shadow — dark, even, quiet.
```

---

# 2. The Château — IRONMAN 70.3 Versailles

- **Path:** `public/assets/courses/versailles-703.webp`
- **Action:** **Create** *(no asset exists)*
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

Versailles, France. Early morning in the gardens of the château. Shot low along
the Grand Canal: still water running dead-straight to the vanishing point,
flanked by clipped formal hedges, geometric parterres and a symmetrical avenue
of pollarded limes. Pale gravel allées. The château's long classical façade in
the far distance, small, softened by mist, catching the first sun on its stone.
Statuary in silhouette along the walk.

Formal, ordered, and utterly unlike every other race in the set — this frame's
identity is GEOMETRY and SYMMETRY. Strong one-point perspective down the canal.

Cold blue morning mist on the water with warm sun just beginning to strike the
upper stonework and the tops of the limes.

Two runners on the gravel path beside the canal, distant and very small,
dwarfed by the scale of the garden.

An orange-terracotta urn or a rust-toned autumn lime crown carries the accent.

The lower-left third is gravel and hedge shadow — dark, matte, low detail.
```

---

# 3. Atlantic Edge — IRONMAN 70.3 Cascais

- **Path:** `public/assets/courses/portugal-cascais-703.webp`
- **Action:** **Replace**
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

Cascais, Portugal. Golden hour on the Atlantic coast toward Guincho. A wide
open bay with real ocean swell rolling in, dark rock shelves at the waterline,
pale windblown dune sand, and behind it the green-grey Sintra massif rising in
soft layered silhouette against a hazy sky. A coast road traces the shoreline
in the mid-distance.

Windy, oceanic, open. Spray lifting off the wave tops in the offshore breeze.
Warm evening light hitting the water and the dune grass; the hills already
going blue.

Two cyclists on the coast road, distant and small, side by side.

The accent comes from the deep terracotta of a low tiled roof or a rust-red
channel marker on the rocks.

The lower-left third is dark wet rock and receding water — heavy, smooth,
featureless.
```

---

# 4. Serra de Sintra — IRONMAN Portugal Cascais

- **Path:** `public/assets/courses/portugal-cascais-full.webp`
- **Action:** **Replace**
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

The Serra de Sintra above Cascais, Portugal — the full-distance companion
frame. Shot from a climbing road high in the hills, looking out west over
dense dark Atlantic woodland toward Cabo da Roca and a huge open ocean horizon.
Low cloud spilling over the ridge and pouring down through the trees. The road
switches back below, narrow and damp, edged with moss and granite.

Harder, wilder and cooler than the 70.3 frame: where that one is coastal and
warm, this is elevated, misted and remote. Same coastline, more severe day.

Sun breaking through cloud in defined shafts onto the sea far below — the only
strong warmth in an otherwise green-grey frame.

A single cyclist climbing on the switchback below, very small, in the shade.

An orange-terracotta roof on a lone quinta in the trees carries the accent.

The lower-left third is dark woodland and road shadow — deep, soft, no detail.
```

---

# 5. Montes de Málaga — IRONMAN 70.3 Málaga

- **Path:** `public/assets/courses/malaga-703.webp`
- **Action:** **Replace**
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

Above Málaga, Andalusia, Spain. Late afternoon in the Montes de Málaga, looking
south down a dry ridge road to the Mediterranean and the coastal city far below
in golden haze. Sun-bleached limestone, terraced olive and almond groves in
ordered rows across the slopes, umbrella pines, parched ochre earth. The road
descends through the frame in long sweeping bends.

Hot, dry, and steep — a hard bike course. Heat shimmer over the tarmac, dust in
the air, hard contrast between lit slope and shadowed valley.

One cyclist descending in the mid-distance, small, tucked low.

Andalusian earth supplies the accent naturally: burnt terracotta soil between
the olive rows, or a tiled roof on a white cortijo.

The lower-left third is shadowed hillside below the road — dark ochre, smooth,
uncluttered.
```

---

# 6. Istrian Stone — IRONMAN 70.3 Poreč

- **Path:** `public/assets/courses/porec-703.webp`
- **Action:** **Replace**
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

Poreč, Istria, Croatia. Morning on the Adriatic. Low pale karst limestone shelf
running into flat, exceptionally clear turquoise-green water — you can see the
rock through it near the shore. Dark cypresses and silver olive terraces on the
gentle slope behind, a dry stone wall, a small stone campanile in the distance.
Scattered pines leaning over the water.

Important: the terrain here is LOW and GENTLE — a coastal plain topping out
around 170 m. No mountains, no gorges, no alpine anything. Soft rolling
Istrian hinterland only.

Clear Mediterranean morning light, high clarity, minimal haze. The water is the
brightest thing in the frame.

Two swimmers just off the rocks, small, in flat calm water.

The accent comes from terracotta pantiles on the distant roofs.

The lower-left third is shaded limestone shelf and dark shallow water — even,
smooth, quiet.
```

---

# 7. Navarino Bay — IRONMAN 70.3 Costa Navarino

- **Path:** `public/assets/courses/costa-navarino-703.webp`
- **Action:** **Create** *(no asset exists)*
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

Messinia, Peloponnese, Greece. Golden hour over Navarino Bay. A long crescent
of pale sand curving around impossibly clear Ionian water that grades from
white-turquoise in the shallows to deep blue offshore. A steep headland
crowned with scrub and ruined stone closes one side of the bay. Behind the
beach, ancient silver-leaved olive groves on terraced red earth climbing toward
dry Messinian hills.

Warm, classical, luminous — the most purely beautiful frame in the set. Very
low sun raking across the water and lighting the olive leaves silver-gold.
Cicada-dry air.

Two runners on the hard sand at the tideline, distant, small, long shadows
behind them.

The accent is the red-ochre earth beneath the olives, or a terracotta roof on a
single stone building in the groves.

The lower-left third is wet sand in headland shadow — dark, reflective, empty.
```

---

# 8. Taurus Coast — IRONMAN 70.3 Türkiye

- **Path:** `public/assets/courses/turkiye-703.webp`
- **Action:** **Create** *(no asset exists)*
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

Belek, Antalya, Türkiye. Sunrise on the Mediterranean coast. Flat, calm,
glassy sea filling the left of the frame; a broad beach of dark coarse sand
and smooth pebbles; a dense band of umbrella pine and eucalyptus behind the
shore. On the horizon inland, the long serrated wall of the Taurus mountains,
blue-grey and snow-touched at the tops, floating above morning haze.

The contrast is the point: a dead-flat, fast coastal course with enormous
mountains standing behind it, untouched by the race. Foreground flat,
background vertical.

First sun coming over the Taurus, warm light spilling down onto the water; the
beach still in cool shadow.

One swimmer entering the flat water, small, a single wake line.

The accent comes from a terracotta roof among the pines or an orange marker
buoy set just offshore.

The lower-left third is dark wet sand and still shallows — smooth, low contrast.
```

---

## Delivery checklist

For each of the eight:

1. Generate base at **2560 × 1440**, house style block + race block, single render.
2. Reframe to **2560 × 1097** (banner) — confirm the bottom-left stays quiet.
3. Crop to **1200 × 900** (thumbnail) — confirm the identifying subject survives.
4. Export **`.webp`, quality 82**.
5. Save the banner to `public/assets/courses/<slug>-hero.webp` and the
   thumbnail to `public/assets/courses/<slug>.webp`, exactly those filenames.
6. Commit. Nothing else to change — the site finds the files by name, and
   `scripts/asset-manifest.mjs` picks them up on the next build.

**All eight replace a shared frame.** Nothing is missing today, so there is no
rush and no gap on the site while this is shot. What each one replaces:

| Race | Banner today | Thumbnail today |
|---|---|---|
| `calella-barcelona-full` | Nice finish chute | Adriatic seafront run |
| `versailles-703` | inland swim start | open-water swimmer |
| `portugal-cascais-703` | hairpin panorama | golden-hour coast road |
| `portugal-cascais-full` | golden-hour coast road | hairpin panorama |
| `malaga-703` | limestone cliffs | rock arch |
| `porec-703` | Adriatic seafront run | open-water swimmer |
| `costa-navarino-703` | rock arch | Nice finish chute |
| `turkiye-703` | flat coast road | Adriatic swim exit |

Three frames each serve two races — the swimmer, the arch and the chute — which
is the sharing this brief exists to end.

**Kalmar 70.3 is excluded.** It is the signed-out showcase and its art stays as
it is: `kalmar-703.webp` and `kalmar-703-hero.webp`.
