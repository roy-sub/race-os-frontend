// Currency-aware pricing data, ported 1:1 from the prototype's Component class.

export type Currency = "GBP" | "USD" | "EUR";

export const CURRENCY_SYMBOL: Record<Currency, string> = { GBP: "£", USD: "$", EUR: "€" };
export const PRICE_19: Record<Currency, number> = { GBP: 15, USD: 19, EUR: 18 };
export const PRICE_59: Record<Currency, number> = { GBP: 47, USD: 59, EUR: 55 };
export const PRICE_99: Record<Currency, number> = { GBP: 79, USD: 99, EUR: 92 };
export const ENTRY_COST: Record<Currency, string> = { GBP: "£520 to £680", USD: "$650 to $850", EUR: "€610 to €800" };
export const SUIT_COST: Record<Currency, string> = { GBP: "£240", USD: "$300", EUR: "€280" };

type MatrixRow = { isGroup: true; label: string } | { isGroup: false; label: string; values: string[] };

const YES = "#C6461B";
const NO = "#C9C0AD";
const TXT = "#3D3A31";

const GROUPS: [string, [string, string, string, string, string][]][] = [
  [
    "RECON",
    [
      ["Every course, full recon", "✓", "✓", "✓", "✓"],
      ["Cut-off calculator", "✓", "✓", "✓", "✓"],
      ["Conditions history", "✓", "✓", "✓", "✓"],
    ],
  ],
  [
    "THE PLAN",
    [
      ["Solve a plan", "—", "Per race", "Unlimited", "Unlimited"],
      ["Pacing, fuelling, five bags", "—", "✓", "✓", "✓"],
      ["Race card, PDF and print", "—", "✓", "✓", "✓"],
      ["Device and calendar export", "—", "✓", "✓", "✓"],
      ["Drift re-solve", "—", "✓", "✓", "✓"],
      ["Race Mode, offline", "—", "✓", "✓", "✓"],
    ],
  ],
  [
    "AFTER THE RACE",
    [
      ["Post-race analysis", "—", "—", "✓", "✓"],
      ["Constraint calibration", "—", "—", "✓", "✓"],
      ["Season history", "—", "—", "✓", "✓"],
    ],
  ],
  [
    "COACHING",
    [
      ["Athletes managed", "—", "—", "1", "15"],
      ["Race-week board", "—", "—", "—", "✓"],
      ["White-label export", "—", "—", "—", "✓"],
    ],
  ],
];

function keyColor(v: string) {
  return v === "—" ? NO : v === "✓" ? YES : TXT;
}

export function matrixRows() {
  const out: (MatrixRow & { colors?: string[] })[] = [];
  GROUPS.forEach(([title, rows]) => {
    out.push({ isGroup: true, label: title });
    rows.forEach((r) => {
      const values = r.slice(1);
      out.push({ isGroup: false, label: r[0], values, colors: values.map(keyColor) });
    });
  });
  return out;
}
