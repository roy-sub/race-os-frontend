type CountUpProps = {
  value: number;
  decimals?: number;
  suffix?: string;
};

/** Renders the "0" starting state; ScrollFx's observer animates it up to `value` on scroll-into-view. */
export function CountUp({ value, decimals = 0, suffix = "" }: CountUpProps) {
  const initial = decimals ? (0).toFixed(decimals) : "0";
  return (
    <>
      <span data-count={value} data-dec={decimals}>
        {initial}
      </span>
      {suffix}
    </>
  );
}
