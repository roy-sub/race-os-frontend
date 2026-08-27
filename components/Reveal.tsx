import type { CSSProperties, ElementType, ReactNode, ComponentPropsWithoutRef } from "react";

type RevealOwnProps<T extends ElementType> = {
  as?: T;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

type RevealProps<T extends ElementType> = RevealOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof RevealOwnProps<T>>;

/** Fade + rise on scroll into view (picked up by the global ScrollFx observer). */
export function Reveal<T extends ElementType = "div">({
  as,
  delay,
  className,
  style,
  children,
  ...rest
}: RevealProps<T>) {
  const Tag = (as || "div") as ElementType;
  return (
    <Tag
      data-reveal="out"
      className={className}
      style={{ ...style, ...(delay ? { transitionDelay: `${delay}s` } : {}) }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

type ZoomRevealProps = {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/** Scale-in wrapper, used for hero/CTA media blocks. */
export function ZoomReveal({ className, style, children }: ZoomRevealProps) {
  return (
    <div data-zoom="out" data-reveal="out" className={className} style={style}>
      {children}
    </div>
  );
}

type RevealLinesProps = {
  as?: ElementType;
  lines: ReactNode[];
  className?: string;
  style?: CSSProperties;
  lineDelay?: number;
};

/** Masked line-by-line headline reveal (each line rises out of a clipped mask). */
export function RevealLines({ as: Tag = "h2", lines, className, style, lineDelay = 0.1 }: RevealLinesProps) {
  return (
    <Tag data-lines="out" className={className} style={style}>
      {lines.map((line, i) => (
        <span key={i} style={{ display: "block", overflow: "hidden", paddingBottom: ".05em" }}>
          <span style={{ display: "block", transitionDelay: i ? `${lineDelay}s` : undefined }}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}
