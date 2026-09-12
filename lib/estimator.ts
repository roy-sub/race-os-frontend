/**
 * The guided estimator's questions, for all eight constraints.
 *
 * The shape of `answers` varies by key — the server types it `object` because
 * each estimator asks something different — so the questions live here, next
 * to the only screen that asks them, and the field names match what
 * `routers/constraints.py` reads. A rename on either side is a 422 naming the
 * field, not a silent wrong number.
 *
 * **An estimate is not a measurement, and the product never pretends it is.**
 * Every result comes back stamped `ESTIMATED` with a confidence and an
 * evidence note, and the plan carries that provenance to the finish line. This
 * exists so a first-timer can get a plan at all, not so anybody can skip
 * testing.
 */

export type Question = {
  name: string;
  label: string;
  /** A unit hint, shown beside the input rather than inside the label. */
  suffix?: string;
  kind: "number" | "boolean";
  min?: number;
  max?: number;
  step?: number;
};

export type Estimator = {
  /** What the two questions are for, in the athlete's terms. */
  intro: string;
  questions: Question[];
};

export const ESTIMATORS: Record<string, Estimator> = {
  run_threshold_pace: {
    intro: "A recent race you ran hard, of any distance from 5 km up.",
    questions: [
      { name: "race_km", label: "Distance", suffix: "km", kind: "number", min: 1, step: 0.1 },
      { name: "race_seconds", label: "Time", suffix: "seconds", kind: "number", min: 60, step: 1 },
    ],
  },
  bike_threshold_power: {
    intro:
      "Estimated from body mass and experience. The weakest of the eight — a 20-minute test is worth far more.",
    questions: [
      { name: "weight_kg", label: "Body mass", suffix: "kg", kind: "number", min: 30, max: 200, step: 0.1 },
    ],
  },
  swim_threshold_pace: {
    intro: "Two efforts from the same session, both swum hard.",
    questions: [
      { name: "t400_seconds", label: "400 m time", suffix: "seconds", kind: "number", min: 60, step: 1 },
      { name: "t200_seconds", label: "200 m time", suffix: "seconds", kind: "number", min: 30, step: 1 },
    ],
  },
  sweat_rate: {
    intro: "One weighed session. Weigh yourself before and after, and count what you drank.",
    questions: [
      { name: "weight_before_kg", label: "Mass before", suffix: "kg", kind: "number", min: 30, max: 200, step: 0.1 },
      { name: "weight_after_kg", label: "Mass after", suffix: "kg", kind: "number", min: 30, max: 200, step: 0.1 },
      { name: "fluid_ml", label: "Fluid drunk", suffix: "ml", kind: "number", min: 0, step: 10 },
      { name: "minutes", label: "Duration", suffix: "minutes", kind: "number", min: 10, step: 1 },
    ],
  },
  weight: {
    intro: "Your current racing mass.",
    questions: [
      { name: "weight_kg", label: "Body mass", suffix: "kg", kind: "number", min: 30, max: 200, step: 0.1 },
    ],
  },
  sodium_loss: {
    intro: "Whether you finish sessions with salt on your skin or stinging eyes.",
    questions: [{ name: "salty_sweater", label: "Salty sweater", kind: "boolean" }],
  },
  gut_carb_ceiling: {
    intro: "Whether you have deliberately practised eating at race intensity.",
    questions: [{ name: "trained_gut", label: "Trained gut", kind: "boolean" }],
  },
  caffeine_tolerance: {
    intro: "Habitual intake, which is what tolerance tracks.",
    questions: [
      { name: "daily_cups", label: "Coffees a day", kind: "number", min: 0, max: 20, step: 1 },
      { name: "weight_kg", label: "Body mass", suffix: "kg", kind: "number", min: 30, max: 200, step: 0.1 },
    ],
  },
};
