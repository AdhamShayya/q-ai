import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { userApi, personaApi } from "../../trpc";
import { GlowOrb } from "../../components/GlowOrb";
import SVGIcon from "../../components/SVGIcon";
import Button from "../../components/Button";

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader() {
  try {
    const user = await userApi.me.query();
    if (user == null) return Response.redirect("/sign-in");
    const persona = await personaApi.get.query().catch(() => null);
    if (persona != null) return Response.redirect("/dashboard");
    return null;
  } catch {
    return Response.redirect("/sign-in");
  }
}

// ── Feature card data ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "brain" as const,
    title: "Tailored Explanations",
    desc: "Every answer shaped around how your brain actually processes information.",
  },
  {
    icon: "sparkles" as const,
    title: "Your Learning Style",
    desc: "Visual, verbal, abstract or concrete — the AI speaks your language.",
  },
  {
    icon: "target" as const,
    title: "Smarter Reviews",
    desc: "Error corrections and summaries matched to what helps you most.",
  },
];

// ── Step dots ─────────────────────────────────────────────────────────────────
function StepDots({ active }: { active: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === active ? 20 : 8,
            height: 8,
            background:
              i === active ? "var(--color-accent)" : "rgba(139,158,108,0.25)",
          }}
        />
      ))}
    </div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard(props: {
  icon: (typeof FEATURES)[number]["icon"];
  title: string;
  desc: string;
  delay: number;
  visible: boolean;
}) {
  const { icon, title, desc, delay, visible } = props;
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-700"
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(139,158,108,0.13)" }}
      >
        <SVGIcon
          name={icon}
          size={18}
          color="var(--color-accent-dark)"
          strokeWidth={1.75}
        />
      </div>
      <div>
        <p
          className="text-sm font-semibold leading-snug"
          style={{ color: "var(--color-text)" }}
        >
          {title}
        </p>
        <p
          className="text-xs mt-1 leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function OnboardingPage() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="max-w-4xl mx-auto relative flex flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Main card */}
      <div
        className="w-full relative transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transitionDelay: "100ms",
        }}
      >
        {/* Pulsing ring behind icon */}
        <div className="flex justify-center mb-8">
          <div className="relative flex items-center justify-center">
            {/* Outer ring */}
            <div
              className="absolute rounded-full"
              style={{
                width: 96,
                height: 96,
                background: "rgba(139,158,108,0.1)",
                animation: "ping 2.4s cubic-bezier(0,0,0.2,1) infinite",
              }}
            />
            {/* Middle ring */}
            <div
              className="absolute rounded-full"
              style={{
                width: 76,
                height: 76,
                background: "rgba(139,158,108,0.15)",
                animation: "ping 2.4s cubic-bezier(0,0,0.2,1) infinite",
                animationDelay: "0.4s",
              }}
            />
            {/* Icon circle */}
            <div
              className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "rgba(139,158,108,0.2)" }}
            >
              <SVGIcon
                name="dna"
                size={28}
                color="var(--color-accent-dark)"
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-4">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full"
            style={{
              background: "rgba(139,158,108,0.12)",
              color: "var(--color-accent-dark)",
            }}
          >
            <SVGIcon
              name="sparkles"
              size={11}
              color="var(--color-accent-dark)"
            />
            One-Time Setup · 2 Minutes
          </span>
        </div>

        {/* Heading */}
        <h1
          className="font-serif text-center text-4xl md:text-5xl leading-tight mb-4"
          style={{ color: "var(--color-text)" }}
        >
          Before we dive in,
          <br />
          <span style={{ color: "var(--color-accent-dark)" }}>
            decode your brain.
          </span>
        </h1>

        <p
          className="text-center text-base leading-relaxed mb-10 max-w-md mx-auto"
          style={{ color: "var(--color-text-secondary)" }}
        >
          7 quick questions let Q-Ai understand exactly how you learn — so every
          explanation, review, and hint is crafted specifically for <em>you</em>
          .
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          {FEATURES.map((f, i) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              desc={f.desc}
              delay={200 + i * 100}
              visible={visible}
            />
          ))}
        </div>

        {/* CTA */}
        <div
          className="rounded-2xl p-6 flex flex-col items-center gap-4 transition-all duration-700"
          style={{
            background: "rgba(139,158,108,0.07)",
            border: "1px solid var(--color-border)",
            opacity: visible ? 1 : 0,
            transitionDelay: "550ms",
          }}
        >
          <p
            className="text-xs text-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            Takes under 2 minutes. You can retake it anytime from Settings.
          </p>
          <button
            type="button"
            onClick={() => navigate("/persona-quiz")}
            className="group relative w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%)",
              color: "white",
            }}
          >
            {/* Shimmer overlay */}
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
              }}
            />
            <SVGIcon name="dna" size={16} color="white" strokeWidth={2} />
            Decode My Learning DNA
            <SVGIcon
              name="arrow-right"
              size={16}
              color="white"
              strokeWidth={2}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>
        </div>

        {/* Step indicator */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <StepDots active={0} />
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Step 1 of 2 — Take the quiz
          </p>
        </div>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default OnboardingPage;
