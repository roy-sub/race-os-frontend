# Race Photography — Generation Brief

Every race in the catalogue except **Kalmar 70.3** (already shot and in place).

**Fifteen images. One base render per race.** Generate the base once, then let
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

Both are then saved as **one file** at the path given for each race; the site
serves the same asset to both slots and crops with `object-fit: cover`. If you
would rather ship two files, the code already prefers `<slug>-hero.webp` for the
banner when it exists — but one file is the intended, simpler path.

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

## House style — applies to all fifteen

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

# 1. Adriatic Flat — IRONMAN 70.3 Emilia-Romagna

- **Path:** `public/assets/courses/italy-emilia-romagna-703.webp`
- **Action:** **Replace**
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

Cervia, Emilia-Romagna, Italy. Early morning on a flat Adriatic beach out of
season. Wide, pale, hard-packed sand running to a glassy grey-blue sea with
almost no swell. A long row of closed beach umbrellas and folded loungers
recedes into haze on the right. Behind the beach, the dark horizontal band of
an umbrella-pine forest. Two distant open-water swimmers in the mid-distance,
small, barely more than silhouettes and wake.

Flat light becoming warm as the sun clears the sea. The whole frame reads
HORIZONTAL and LOW — this is a fast, flat, sea-level course and the picture
should feel like it. No hills anywhere.

One faded terracotta-orange marker buoy sits just off-centre. The lower-left
third is open wet sand reflecting the sky — smooth, dark, empty.
```

---

# 2. The Long Romagna — IRONMAN Italy Emilia-Romagna

- **Path:** `public/assets/courses/italy-emilia-romagna-full.webp`
- **Action:** **Replace**
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

Inland Romagna, Italy — the farmland behind Cervia. Late afternoon, an hour
before sunset. A dead-straight secondary road runs from the lower centre of the
frame to a vanishing point on the horizon, flanked by a long avenue of poplars
casting hard parallel shadows across the tarmac. Flat cultivated fields either
side, wheat and vine rows, an irrigation canal glinting along one edge, a lone
stone farmhouse far off.

A single cyclist in the distance, low on the bars, tiny against the road —
unmistakably deep into a long day. Dust and pollen hanging in the low sun.

This is the full-distance companion to the 70.3: same region, but the mood is
DURATION — endless, warm, slightly emptied out. Heat haze on the far tarmac.

A weathered orange-terracotta roof on the distant farmhouse carries the accent.
The lower-left third is road surface in tree shadow — dark, even, textureless.
```

---

# 3. The Climb Above the Bay — IRONMAN 70.3 World Championship Nice

- **Path:** `public/assets/courses/nice-703-world-championship.webp`
- **Action:** **Replace**
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

Nice, Côte d'Azur, France. Shot from high on a Maritime Alps switchback road,
looking back and down over the Baie des Anges. Layered ridgelines of limestone
and maquis falling away in receding blue-grey planes to a vast flat
Mediterranean far below, the curve of the bay and the pale city just visible
through morning haze at the horizon.

The road enters bottom-right as a hairpin with a low stone guard wall and
climbs across the frame. One cyclist, small, out of the saddle on the gradient.

The feeling is ALTITUDE and CONSEQUENCE — this is the hardest bike course in
the catalogue and the image should make a viewer's legs tighten. Vertical
scale, thin clear air, the sea impossibly far below.

Sun low and behind the ridges, rimlighting the rock edges; the valley still in
blue shadow. A single orange-terracotta roof in the village below, or an orange
road-marker post on the hairpin, for the accent.

The lower-left third is shadowed hillside and scrub — dark, soft, no detail.
```

---

# 4. River City — IRONMAN 70.3 Belgrade

- **Path:** `public/assets/courses/belgrade-703.webp`
- **Action:** **Replace**
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

Belgrade, Serbia. Sunrise over the Sava at Ada Ciganlija, looking downstream
toward the confluence with the Danube. Broad, calm, slow river water filling
the lower half of the frame, mirror-still, with mist lifting off it. On the far
bank, the low silhouette of the city — a long bridge span, mid-rise blocks,
the faint mass of the old fortress promontory in haze. Willows and poplars
along the near shore.

Flat, urban, riverine. Two open-water swimmers mid-river, distant, small.

Early light is pink-grey turning warm; the water carries most of the colour.
The bridge's steel or a mooring buoy gives the terracotta-orange accent.

Keep the city small and set back — this reads as a big river with a city behind
it, not a cityscape. The lower-left third is open, unbroken water in shadow.
```

---

# 5. Brandenburg Water — IRONMAN 70.3 Erkner

- **Path:** `public/assets/courses/erkner-703.webp`
- **Action:** **Create** *(no asset exists)*
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

Erkner, Brandenburg, Germany — the lake country south-east of Berlin. Dawn on a
glassy inland lake (Flakensee), water perfectly still and dark, holding a
mirror reflection of a dense Scots-pine treeline. Thin ground mist drifting
across the surface. A short wooden jetty enters from the right, weathered
planks, nothing on it. Beyond the lake, flat forest to the horizon — no hills
at all.

Cool Northern European light, silvery and green-grey, with the first warmth
just touching the pine crowns. Very quiet, very still, slightly severe.

One swimmer entering the water from the jetty, distant and small, the only
movement in the frame; a single ring of ripple.

An orange buoy near the jetty, or an orange marker on a channel post, carries
the accent. The lower-left third is flat black water — mirror-smooth, empty.
```

---

# 6. Pembrokeshire — IRONMAN Wales

- **Path:** `public/assets/courses/ironman-wales.webp`
- **Action:** **Replace**
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

Tenby, Pembrokeshire, Wales. Storm-grey morning on the Atlantic coast. Tall
dark cliffs on the right, wet and stratified, dropping to a broad tidal beach.
Heavy cold sea, real swell, white water breaking along the sand. A stone
harbour wall and a scatter of pastel terraced houses on the headland in the far
mid-distance, small and weather-beaten. Sea fog sitting in the gap between
headlands.

This is the hardest, coldest race in the catalogue and the image must feel it:
wind, grey Atlantic, spray in the air, low cloud pressing down. Bleak and
beautiful, never pretty.

Break the palette rule only far enough to let a thin band of warm light open on
the horizon under the cloud — the whole frame's warmth comes from that one
slot. A faded orange lifebuoy or a single orange-hulled boat in the harbour
gives the accent.

One or two wetsuited figures at the tideline, tiny, walking into the surf.

The lower-left third is wet sand and receding foam under cliff shadow — dark,
smooth, low contrast.
```

---

# 7. Jurassic Coast — IRONMAN 70.3 Weymouth

- **Path:** `public/assets/courses/weymouth-703.webp`
- **Action:** **Create** *(no asset exists)*
- **Banner:** 21:9 (2560 × 1097) · **Thumbnail:** 4:3 (1200 × 900)

```
HOUSE STYLE + :

Weymouth, Dorset, England. Late afternoon on the Jurassic Coast. Shot from a
high grassy clifftop looking along the coastline: the immense shingle sweep of
Chesil Beach curving away into haze, pale ivory-and-grey stone cliffs stepping
down to a calm turquoise-grey Channel, and behind, soft rolling green Dorset
downland stitched with hedgerows and field boundaries.

Cooler and gentler than Wales — this is a rolling, exposed, honest course, not
a brutal one. English light: bright but diffused, high cloud, shafts of sun
moving across the fields.

A narrow lane threads the downland in the mid-distance with a single distant
cyclist on it, very small.

The accent comes from a rust-orange patch of lichen on the cliff stone or a
single terracotta rooftop in the village below.

The lower-left third is clifftop grass in shadow — dark green-grey, soft, no
sharp detail.
```

---

# 8. Maresme — IRONMAN Barcelona (Calella)

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

# 9. The Château — IRONMAN 70.3 Versailles

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

# 10. Atlantic Edge — IRONMAN 70.3 Cascais

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

# 11. Serra de Sintra — IRONMAN Portugal Cascais

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

# 12. Montes de Málaga — IRONMAN 70.3 Málaga

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

# 13. Istrian Stone — IRONMAN 70.3 Poreč

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

# 14. Navarino Bay — IRONMAN 70.3 Costa Navarino

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

# 15. Taurus Coast — IRONMAN 70.3 Türkiye

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

For each of the fifteen:

1. Generate base at **2560 × 1440**, house style block + race block, single render.
2. Reframe to **2560 × 1097** (banner) — confirm the bottom-left stays quiet.
3. Crop to **1200 × 900** (thumbnail) — confirm the identifying subject survives.
4. Export **`.webp`, quality 82**.
5. Save to `public/assets/courses/<slug>.webp`, exactly the filename listed.
6. Commit. Nothing else to change — the site finds the file by name.

**Nine replace** an existing photograph: `italy-emilia-romagna-703`,
`italy-emilia-romagna-full`, `nice-703-world-championship`, `belgrade-703`,
`ironman-wales`, `portugal-cascais-703`, `portugal-cascais-full`, `malaga-703`,
`porec-703`.

**Six create** a race that currently has no artwork at all: `erkner-703`,
`weymouth-703`, `calella-barcelona-full`, `versailles-703`,
`costa-navarino-703`, `turkiye-703`.

**Kalmar 70.3 is excluded** — `kalmar-703.webp` stays as it is.
