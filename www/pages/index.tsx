import { Link } from "react-router";
import SVGIcon from "../components/SVGIcon";
import { useInView } from "../hooks/useInView";
import { useParallax } from "../hooks/useParallax";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { SectionBadge } from "../components/SectionBadge";
import { GlowOrb } from "../components/GlowOrb";
import { FeatureCard } from "../components/FeatureCard";
import {
  PARTICLES,
  PARTICLE_COLORS,
  GHOST_WORDS,
  GHOST_CONFIG,
  ORBIT_RINGS,
  MARQUEE_ITEMS,
  DNA_PILLARS,
  FEATURES,
  STEPS,
  DARK_STATS,
  SAMPLE_STEPS,
  TRUST_PILLS,
} from "../animations/home.data";

// --- Loader ------------------------------------------------------------------
export async function loader() {
  return null;
}

// --- Page ---------------------------------------------------------------------
export default function LandingPage() {
  const scrollY = useParallax();
  const ctaSection = useInView();
  const dnaSection = useInView();
  const stepsSection = useInView();
  const statsSection = useInView();
  const pressSection = useInView();
  const cardsSection = useInView();
  const sampleSection = useInView();
  const featuresSection = useInView();

  return (
    <div className="flex flex-col bg-bg">
      {/* -- HERO --------------------------------------------------------------- */}
      <section className="relative flex items-center justify-center overflow-hidden min-h-[88vh] md:min-h-screen">
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(26,35,50,0.08) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Ghost watermark words (parallax) */}
        {GHOST_WORDS.map((word, i) => {
          const cfg = GHOST_CONFIG[i]!;
          return (
            <div
              key={word}
              className="absolute pointer-events-none select-none"
              style={{
                fontSize: "clamp(44px,7.5vw,110px)",
                fontWeight: 900,
                fontFamily: "var(--font-serif)",
                color: "transparent",
                WebkitTextStroke: "1.5px rgba(26,35,50,0.048)",
                whiteSpace: "nowrap",
                left: cfg.left,
                top: cfg.top,
                zIndex: 1,
                transform: `translateY(${scrollY * cfg.pSpeed}px)`,
                animation: `floatY ${8 + i * 1.6}s ease-in-out ${i * 0.9}s infinite${cfg.reverse ? " reverse" : ""}`,
              }}
            >
              {word}
            </div>
          );
        })}

        {/* Orbital rings desktop only to avoid mobile overflow */}
        <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-2">
          {ORBIT_RINGS.map((ring, i) => {
            const dotSize = 8 - i * 1.5;
            const dotOff = -(4 - i);
            return (
              <div
                key={ring.size}
                className="absolute rounded-full"
                style={{
                  width: ring.size,
                  height: ring.size,
                  border: `1px solid ${ring.border}`,
                  animation: `${ring.cw ? "spinOrbitCW" : "spinOrbitCCW"} ${ring.dur}s linear infinite`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: dotSize,
                    height: dotSize,
                    borderRadius: "50%",
                    background: ring.dot,
                    opacity: 0.9,
                    boxShadow: `0 0 ${14 - i * 3}px ${ring.dot}`,
                    ...(ring.dotPos === "left" && {
                      top: "50%",
                      left: dotOff,
                      transform: "translateY(-50%)",
                    }),
                    ...(ring.dotPos === "top" && {
                      top: dotOff,
                      left: "50%",
                      transform: "translateX(-50%)",
                    }),
                    ...(ring.dotPos === "right" && {
                      top: "50%",
                      right: dotOff,
                      transform: "translateY(-50%)",
                    }),
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-3">
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                left: p.left,
                bottom: "-8px",
                background: PARTICLE_COLORS[p.colorIdx],
                animation: `particleRise ${p.duration} ${p.delay} ease-in-out infinite`,
                filter: "blur(0.4px)",
              }}
            />
          ))}
        </div>

        {/* Parallax gradient orbs */}
        <GlowOrb
          color="accent"
          size={750}
          opacity={0.18}
          blur={2}
          className="animate-orb-pulse"
          style={{
            top: -220,
            left: -220,
            transform: `translateY(${scrollY * 0.22}px)`,
            zIndex: 1,
          }}
        />
        <GlowOrb
          color="warning"
          size={520}
          opacity={0.14}
          style={{
            bottom: -140,
            right: -90,
            zIndex: 1,
            transform: `translateY(${scrollY * -0.16}px)`,
            animation: "floatY 12s ease-in-out 1s infinite reverse",
          }}
        />
        <GlowOrb
          color="info"
          size={320}
          opacity={0.13}
          style={{
            top: "30%",
            right: "8%",
            zIndex: 1,
            transform: `translateY(${scrollY * 0.12}px)`,
            animation: "floatY 9s ease-in-out 2s infinite",
          }}
        />

        {/* Content */}
        <div className="container relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center text-center py-20 md:py-36">
          <SectionBadge
            icon="sparkles"
            className="mb-8 animate-fade-in delay-75"
          >
            AI-Powered Study Partner
          </SectionBadge>

          <h1 className="font-serif leading-tight mb-6 text-[clamp(2.6rem,7vw,5rem)]">
            <span className="block">
              {"Learn Smarter,".split("").map((char, i) => (
                <span
                  key={i}
                  className="animate-letter-drop"
                  style={{ animationDelay: `${80 + i * 38}ms` }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </span>
            <span
              className="block gradient-text animate-letter-drop mt-[0.1em]"
              style={{ animationDelay: "600ms" }}
            >
              Not Harder.
            </span>
          </h1>

          <p
            className="animate-fade-in-up text-lg md:text-xl leading-relaxed mb-10 max-w-2xl text-text-secondary"
            style={{ animationDelay: "1120ms" }}
          >
            Q-Ai is your personal AI tutor that adapts to your unique learning
            style drawing answers exclusively from your course materials, not
            the entire internet.
          </p>

          <div
            className="animate-fade-in-up flex flex-wrap gap-4 justify-center"
            style={{ animationDelay: "1300ms" }}
          >
            <Link
              to="/sign-up"
              className="btn-glow inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-primary no-underline transition-all hover:opacity-90 hover:-translate-y-0.5"
            >
              Get Started Free
              <SVGIcon name="arrow-right" size={16} strokeWidth={2.5} />
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold border border-border text-text no-underline transition-all hover:bg-bg-card hover:-translate-y-0.5"
            >
              Explore Features
            </Link>
          </div>

          <div
            className="animate-fade-in flex flex-wrap gap-3 justify-center mt-7"
            style={{ animationDelay: "1500ms" }}
          >
            {TRUST_PILLS.map((t) => (
              <span
                key={t}
                className="text-xs font-medium px-3 py-1 rounded-full text-accent-dark bg-[rgba(139,158,108,0.1)] border border-[rgba(139,158,108,0.18)]"
              >
                {t}
              </span>
            ))}
          </div>

          <p
            className="animate-fade-in mt-5 text-sm text-text-muted"
            style={{ animationDelay: "1640ms" }}
          >
            No credit card required &nbsp;�&nbsp; Free plan available
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float z-10">
          <div className="w-9 h-9 rounded-full flex items-center justify-center border border-border bg-white/75 backdrop-blur-sm">
            <SVGIcon
              name="chevron-down"
              size={15}
              color="var(--color-text-muted)"
            />
          </div>
        </div>
      </section>

      {/* -- MARQUEE TICKER ----------------------------------------------------- */}
      <div className="py-4 overflow-hidden border-y border-border bg-bg-card">
        <div className="animate-marquee flex w-max">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center gap-1 px-8 shrink-0">
              <span className="ml-2 mr-1 opacity-30">•</span>
              <SVGIcon
                name={item.icon}
                size={14}
                color="var(--color-accent-dark)"
                strokeWidth={1.8}
              />
              <span className="text-sm font-medium whitespace-nowrap text-text-secondary">
                {item.text}
              </span>
              <span className="ml-2 mr-1 opacity-30">•</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* -- PERSONALIZATION ---------------------------------------------------- */}
      <section className="py-14 md:py-24 container">
        <div
          ref={dnaSection.ref}
          className={`text-center mb-14 ${dnaSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <SectionBadge className="mb-6">Personalized to the core</SectionBadge>
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            Every Answer Is Shaped By Two Things
          </h2>
          <p className="text-base max-w-xl mx-auto text-text-secondary">
            Q-Ai doesn't just look up answers it adapts <em>how</em> it teaches
            based on who you are and what you're studying.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          {DNA_PILLARS.map((card) => (
            <div
              key={card.title}
              className={`rounded-2xl p-8 flex flex-col gap-5 border border-border bg-bg-card shadow-sm ${dnaSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
              style={{
                borderTop: `3px solid ${card.accent}`,
                animationDelay: dnaSection.inView ? `${card.delay}ms` : "0ms",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: card.iconBg }}
              >
                <SVGIcon
                  name={card.icon}
                  size={22}
                  color={card.iconColor}
                  strokeWidth={1.75}
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
                <p className="leading-relaxed text-sm text-text-secondary">
                  {card.desc}
                </p>
              </div>
              <Link
                to="/sign-up"
                className="inline-flex items-center gap-2 text-sm font-semibold no-underline mt-auto"
                style={{ color: card.ctaColor }}
              >
                {card.cta}{" "}
                <SVGIcon name="arrow-right" size={14} strokeWidth={2.5} />
              </Link>
            </div>
          ))}
        </div>

        {/* Quiz CTA strip */}
        <div
          className={`rounded-2xl px-8 py-7 flex flex-col sm:flex-row items-center gap-5 max-w-5xl mx-auto bg-[rgba(139,158,108,0.08)] border border-dashed border-accent ${dnaSection.inView ? "animate-scale-in" : "opacity-0"}`}
          style={{ animationDelay: dnaSection.inView ? "350ms" : "0ms" }}
        >
          <div className="flex-1 text-center sm:text-left">
            <p className="font-semibold mb-1">
              Discover how you learn best in 2 minutes.
            </p>
            <p className="text-sm text-text-secondary">
              The Learning DNA quiz is the first thing you do after signing up.
              No right or wrong answers just your natural preferences.
            </p>
          </div>
          <Link
            to="/sign-up"
            className="btn-glow shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-accent no-underline transition-all hover:opacity-90 hover:-translate-y-0.5"
          >
            Start the Quiz{" "}
            <SVGIcon name="arrow-right" size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </section>
      {/* -- EDITORIAL: AI IN EDUCATION ----------------------------------------- */}
      <section ref={pressSection.ref} className="py-14 md:py-24 container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center max-w-6xl mx-auto">
          {/* Left: image */}
          <div
            className={`relative ${pressSection.inView ? "animate-slide-in-left" : "opacity-0"}`}
          >
            <div
              className="relative rounded-3xl overflow-hidden shadow-xl"
              style={{
                aspectRatio: "4/3",
                border: "1.5px solid var(--color-border)",
              }}
            >
              <img
                src="/images/news-ai.jpg"
                alt="AI is reshaping education"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(139,158,108,0.15) 0%, transparent 60%)",
                }}
              />
            </div>
          </div>

          {/* Right: copy */}
          <div
            className={`flex flex-col gap-6 ${pressSection.inView ? "animate-slide-in-right" : "opacity-0"}`}
            style={{ animationDelay: "120ms" }}
          >
            <SectionBadge color="warning" className="self-start">
              The conversation is changing
            </SectionBadge>
            <h2 className="font-serif text-3xl md:text-4xl leading-tight">
              AI is reshaping how students learn.
              <span className="gradient-text"> Q-Ai puts you in control.</span>
            </h2>
            <p className="leading-relaxed text-text-secondary">
              Every week, more students discover that generic AI tools give
              generic answers. Q-Ai is different it reasons exclusively from
              your uploaded materials, so every explanation is grounded in what
              your professor actually taught.
            </p>
            <div className="flex flex-col gap-3">
              {[
                {
                  icon: "shield" as const,
                  text: "Your materials, never shared or used for training",
                },
                {
                  icon: "dna" as const,
                  text: "Adapts to your unique cognitive style",
                },
                {
                  icon: "book" as const,
                  text: "Built for STEM, Law, Medicine and more",
                },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(139,158,108,0.12)" }}
                  >
                    <SVGIcon
                      name={item.icon}
                      size={15}
                      color="var(--color-accent-dark)"
                      strokeWidth={1.75}
                    />
                  </div>
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-border" />

      {/* -- HOW Q-AI HELPS ----------------------------------------------------- */}
      <section className="py-14 md:py-24 container">
        <div
          ref={featuresSection.ref}
          className={`text-center mb-16 ${featuresSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            How Q-Ai Helps You Learn
          </h2>
          <p className="text-base max-w-xl mx-auto text-text-secondary">
            Every feature is designed around one goal turning complex material
            into genuine understanding.
          </p>
        </div>

        <div
          ref={cardsSection.ref}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {FEATURES.map((item, i) => (
            <FeatureCard
              key={item.title}
              {...item}
              inView={cardsSection.inView}
              delay={i * 120}
            />
          ))}
        </div>

        {/* Sample explanation */}
        <div
          ref={sampleSection.ref}
          className={`bg-bg-card rounded-2xl p-8 md:p-10 max-w-3xl mx-auto border border-border shadow-md ${sampleSection.inView ? "animate-scale-in" : "opacity-0"}`}
          style={{ borderLeft: "4px solid var(--color-warning)" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center animate-float bg-[rgba(212,168,67,0.15)]">
              <SVGIcon
                name="sparkles"
                size={16}
                color="#b8893a"
                strokeWidth={1.75}
              />
            </div>
            <span className="font-semibold text-base">Sample Explanation</span>
          </div>
          <p className="leading-relaxed mb-5">
            That's a tough concept to grasp, but the way you're thinking about
            it is a great start. Let's tackle quantum mechanics together by
            breaking it down into three simple steps:
          </p>
          <ol className="space-y-3">
            {SAMPLE_STEPS.map((text, i) => (
              <li
                key={i}
                className={`flex items-start gap-3 ${sampleSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
                style={{
                  animationDelay: sampleSection.inView
                    ? `${150 + i * 120}ms`
                    : "0ms",
                }}
              >
                <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 text-accent-dark bg-[rgba(139,158,108,0.15)]">
                  {i + 1}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="h-px bg-border" />

      {/* -- HOW IT WORKS ------------------------------------------------------- */}
      <section className="py-14 md:py-24 container">
        <div
          ref={stepsSection.ref}
          className={`text-center mb-16 ${stepsSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <SectionBadge color="info" className="mb-6">
            Simple by design
          </SectionBadge>
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            Up and running in three steps
          </h2>
          <p className="text-base max-w-xl mx-auto text-text-secondary">
            No complicated setup. No learning curve. Just upload, tune, and
            start understanding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-border pointer-events-none" />
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className={`card-lift bg-bg-card rounded-2xl p-8 flex flex-col gap-5 relative border border-border shadow-sm ${stepsSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
              style={{
                borderTop: `3px solid ${step.accent}`,
                animationDelay: stepsSection.inView ? `${i * 130}ms` : "0ms",
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: step.iconBg }}
                >
                  <SVGIcon
                    name={step.icon}
                    size={22}
                    color={step.iconColor}
                    strokeWidth={1.75}
                  />
                </div>
                <span
                  className="font-bold text-2xl font-serif"
                  style={{ color: step.accent, opacity: 0.35 }}
                >
                  {step.number}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="leading-relaxed text-sm text-text-secondary">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-border" />

      {/* -- CTA ---------------------------------------------------------------- */}
      <section className="container py-14 md:py-24">
        <div
          ref={ctaSection.ref}
          className={`container rounded-3xl px-10 py-16 flex flex-col items-center text-center max-w-2xl mx-auto relative overflow-hidden bg-primary shadow-xl ${ctaSection.inView ? "animate-scale-in" : "opacity-0"}`}
        >
          <GlowOrb
            color="accent"
            size={400}
            opacity={0.25}
            blur={0}
            style={{ top: -120, left: -60 }}
            animation="floatY 9s ease-in-out infinite"
          />
          <GlowOrb
            color="warning"
            size={280}
            opacity={0.18}
            blur={0}
            style={{ bottom: -80, right: -60 }}
            animation="floatY 7s ease-in-out 1.5s infinite reverse"
          />

          <div className="relative z-10 flex flex-col items-center">
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-base mb-10 text-white/70">
              Let's start your personalized learning journey together. Upload
              your materials and experience the difference.
            </p>
            <Link
              to="/sign-up"
              className="btn-glow inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-accent no-underline transition-all hover:opacity-90 hover:-translate-y-0.5"
            >
              Get Started Free
              <SVGIcon name="arrow-right" size={16} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
