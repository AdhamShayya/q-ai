import SVGIcon from "./SVGIcon";
import type { IconName } from "./SVGIcon";

export interface FeatureCardData {
  icon: IconName;
  iconBg: string;
  iconColor: string;
  textColor: string;
  accentColor: string;
  title: string;
  description: string;
}

export function FeatureCard(
  props: FeatureCardData & { inView: boolean; delay?: number },
) {
  const {
    icon,
    iconBg,
    iconColor,
    textColor,
    accentColor,
    title,
    description,
    inView,
    delay = 0,
  } = props;
  return (
    <div
      className={`card-lift bg-bg-card rounded-2xl p-7 flex flex-col gap-5 border border-border shadow-sm text-center items-center ${inView ? "animate-fade-in-up" : "opacity-0"}`}
      style={{
        borderTop: `3px solid ${accentColor}`,
        animationDelay: inView ? `${delay}ms` : "0ms",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        <SVGIcon name={icon} size={22} color={iconColor} strokeWidth={1.75} />
      </div>
      <div>
        <h3
          className={`font-semibold text-lg mb-2`}
          style={{ color: textColor }}
        >
          {title}
        </h3>
        <p className="leading-relaxed text-text-secondary">{description}</p>
      </div>
    </div>
  );
}
