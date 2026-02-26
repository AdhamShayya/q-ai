import React from "react";

type IconName =
  | "upload"
  | "sparkles"
  | "book"
  | "key"
  | "list"
  | "globe"
  | "lightbulb"
  | "analogy-cycle"
  | "file"
  | "mic"
  | "send"
  | "folder";

interface SVGIconProps {
  name: IconName;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

function IconPaths({ name }: { name: IconName }) {
  switch (name) {
    case "upload":
      return (
        <>
          <polyline points="16 16 12 12 8 16" />
          <line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </>
      );
    case "sparkles":
      return (
        <>
          <path d="M12 3l1.2 3.6L16.8 8l-3.6 1.2L12 12.8l-1.2-3.6L7.2 8l3.6-1.2L12 3z" />
          <path d="M19 14l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6.6-1.8z" />
          <path d="M5 16l.4 1.2 1.2.4-1.2.4-.4 1.2-.4-1.2-1.2-.4 1.2-.4.4-1.2z" />
        </>
      );
    case "book":
      return (
        <>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </>
      );
    case "key":
      return (
        <>
          <circle cx="7.5" cy="15.5" r="5.5" />
          <path d="M21 2l-9.6 9.6" />
          <path d="M15.5 7.5l3 3L22 7l-3-3" />
        </>
      );
    case "list":
      return (
        <>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </>
      );
    case "globe":
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </>
      );
    case "lightbulb":
      return (
        <>
          <line x1="9" y1="18" x2="15" y2="18" />
          <line x1="10" y1="22" x2="14" y2="22" />
          <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
        </>
      );
    case "analogy-cycle":
      return (
        <>
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </>
      );
    case "file":
      return (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </>
      );
    case "mic":
      return (
        <>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      );
    case "send":
      return (
        <>
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </>
      );
    case "folder":
      return (
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      );
    default:
      return null;
  }
}

function SVGIcon({ name, size, style, className }: SVGIconProps) {
  const [defaultSize, strokeWidth] = ((): [number, number] => {
    switch (name) {
      case "upload":
        return [40, 1.5];
      case "sparkles":
        return [44, 1.4];
      case "book":
        return [16, 1.8];
      case "key":
        return [16, 1.8];
      case "list":
        return [16, 1.8];
      case "globe":
        return [16, 1.8];
      case "lightbulb":
        return [14, 1.8];
      case "analogy-cycle":
        return [14, 1.8];
      case "file":
        return [14, 1.8];
      case "mic":
        return [18, 1.8];
      case "send":
        return [16, 2];
      case "folder":
        return [15, 1.8];
    }
  })();

  const s = size ?? defaultSize;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
    >
      <IconPaths name={name} />
    </svg>
  );
}

export default SVGIcon;
