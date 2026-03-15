import type { ReactNode } from "react";
import SVGIcon from "./SVGIcon";
import type { IconName } from "./SVGIcon";

const COLORS = {
  accent: {
    bg: "rgba(139,158,108,0.12)",
    text: "var(--color-accent-dark)",
    border: "rgba(139,158,108,0.2)",
  },
  warning: {
    bg: "rgba(212,168,67,0.12)",
    text: "#b8893a",
    border: "rgba(212,168,67,0.2)",
  },
  info: {
    bg: "rgba(74,127,165,0.12)",
    text: "#4a7fa5",
    border: "rgba(74,127,165,0.18)",
  },
} as const;

type Color = keyof typeof COLORS;

export function SectionBadge({
  children,
  icon,
  color = "accent",
  className = "",
}: {
  children: ReactNode;
  icon?: IconName;
  color?: Color;
  className?: string;
}) {
  const c = COLORS[color];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full ${className}`}
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {icon && <SVGIcon name={icon} size={12} color={c.text} strokeWidth={2} />}
      {children}
    </span>
  );
}
