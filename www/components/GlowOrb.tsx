import type { CSSProperties } from "react";

const BASE = {
  accent: "139,158,108",
  warning: "212,168,67",
  info: "74,127,165",
  red: "239,68,68",
} as const;

type Color = keyof typeof BASE;

export function GlowOrb({
  color = "accent",
  size,
  opacity = 0.18,
  animation,
  blur = 1,
  className = "",
  style,
}: {
  color?: Color;
  size: number;
  opacity?: number;
  animation?: string;
  blur?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`absolute pointer-events-none rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, rgba(${BASE[color]},${opacity}) 0%, transparent 70%)`,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        animation,
        ...style,
      }}
    />
  );
}
