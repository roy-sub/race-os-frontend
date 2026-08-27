type MarkProps = {
  width?: number;
  height?: number;
};

/** The RaceOS wordmark's dot-cluster logo — a nine-dot quincunx cross. */
export function Mark({ width = 27, height = 18 }: MarkProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 343 229" style={{ display: "block", flex: "none" }}>
      <g fill="#E4622F">
        <circle cx="75.5" cy="27.5" r="27.5" />
        <circle cx="267.5" cy="27.5" r="27.5" />
        <circle cx="27.5" cy="114.5" r="27.5" />
        <circle cx="123.5" cy="114.5" r="27.5" />
        <circle cx="219.5" cy="114.5" r="27.5" />
        <circle cx="315.5" cy="114.5" r="27.5" />
        <circle cx="75.5" cy="201.5" r="27.5" />
        <circle cx="267.5" cy="201.5" r="27.5" />
      </g>
    </svg>
  );
}
