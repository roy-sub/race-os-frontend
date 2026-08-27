// Shared Plan (token-accessed, read-only) page data, ported 1:1 from the prototype.

export const LEGS = [
  { name: "SWIM", dist: "3.8 KM", target: "1:44", unit: "/100m", split: "1:06", note: "Non-wetsuit", color: "#4F7C93", tint: "rgba(79,124,147,.13)" },
  { name: "BIKE", dist: "180.2 KM", target: "208", unit: "w", split: "6:05", note: "0.71 IF", color: "#E4622F", tint: "rgba(228,98,47,.13)" },
  { name: "RUN", dist: "42.2 KM", target: "6:12", unit: "/km", split: "4:21", note: "Heat adjusted", color: "#64707A", tint: "rgba(100,112,122,.13)" },
];

export const GATES = [
  { name: "SWIM EXIT", margin: "+1:14", eta: "1:06", limit: "2:20" },
  { name: "BIKE KM 120", margin: "+2:19", eta: "6:11", limit: "8:30" },
  { name: "BIKE CUT-OFF", margin: "+1:21", eta: "7:19", limit: "10:30" },
  { name: "FINISH LINE", margin: "+4:15", eta: "11:45", limit: "16:00" },
];

export const FUEL = [
  { k: "CARBOHYDRATE", v: "78", u: "g/hr" },
  { k: "FLUID", v: "760", u: "ml/hr" },
  { k: "SODIUM", v: "950", u: "mg/hr" },
  { k: "CAFFEINE", v: "400", u: "mg total" },
];
