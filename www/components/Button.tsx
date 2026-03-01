import React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * solid → primary bg, white text (default SCSS button)
 * outline → transparent bg, border, text-secondary
 * outline-accent → transparent bg, border, accent-colored text
 * ghost → no bg, no border, muted text (icon-only buttons)
 * muted → muted bg, border, text-secondary (Browse Vault etc.)
 */
export type ButtonVariant =
  | "solid"
  | "outline"
  | "outline-accent"
  | "ghost"
  | "muted";

export type ButtonSize = "sm" | "md" | "icon" | "none";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ── Style maps ────────────────────────────────────────────────────────────────

const VARIANT: Record<ButtonVariant, string> = {
  solid:
    "bg-primary text-text-inverse border-transparent hover:bg-primary-hover",
  outline:
    "bg-transparent text-text-secondary border-border hover:bg-bg-hover hover:border-border-focus hover:shadow-none",
  "outline-accent":
    "bg-transparent text-accent border-border hover:border-border-focus hover:shadow-none",
  ghost:
    "bg-transparent text-text-muted border-transparent hover:bg-transparent hover:text-text-secondary hover:shadow-none",
  muted:
    "bg-bg-muted text-text-secondary border-border hover:border-border-focus hover:shadow-none",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "py-1.5 px-3.5",
  md: "py-2.5 px-6",
  icon: "w-8 h-8 p-0 rounded-full",
  none: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

function Button({
  variant = "solid",
  size = "sm",
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const classes = [
    VARIANT[variant],
    SIZE[size],
    fullWidth ? "w-full justify-center" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}

export default Button;
