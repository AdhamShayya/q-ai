import React from "react";
import { Link } from "react-router";
import { userApi } from "../trpc";
import SVGIcon from "../components/SVGIcon";
import { useInView } from "../hooks/useInView";

export async function loader() {
  const user = await userApi.me.query();
  if (user != null) {
    return Response.redirect("/dashboard");
  }
  return null;
}

const highlights = [
  {
    icon: "lightbulb" as const,
    iconBg: "rgba(139,158,108,0.13)",
    iconColor: "var(--color-accent-dark)",
    accentColor: "var(--color-accent)",
    title: "Concept Breakdown",
    description:
      "Complex ideas distilled into digestible pieces so nothing feels overwhelming.",
  },
  {
    icon: "list" as const,
    iconBg: "rgba(212,168,67,0.13)",
    iconColor: "#b8893a",
    accentColor: "var(--color-warning)",
    title: "Smart Summaries",
    description:
      "Key points highlighted from your own materials for efficient, focused review.",
  },
  {
    icon: "sparkles" as const,
    iconBg: "rgba(74,127,165,0.13)",
    iconColor: "#4a7fa5",
    accentColor: "var(--color-info)",
    title: "Time-Saving",
    description:
      "More learning in less time — study smarter and walk into exams confident.",
  },
];

function LandingPage() {
  const featuresSection = useInView();
  const cardsSection = useInView();
  const sampleSection = useInView();
  const ctaSection = useInView();

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "var(--color-bg)" }}
    >
      {/*  Hero  */}
      <section className="container py-24 md:py-36 overflow-hidden">
        <div className=" mx-auto px-6 flex flex-col items-center text-center max-w-3xl">
          {/* Badge */}
          <span
            className="animate-fade-in delay-75 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-8"
            style={{
              background: "rgba(139,158,108,0.12)",
              color: "var(--color-accent-dark)",
              letterSpacing: "0.1em",
            }}
          >
            AI-Powered Study Partner
          </span>

          <h1 className="animate-fade-in-up delay-150 font-serif text-5xl md:text-6xl leading-tight mb-6">
            Learn Smarter,
            <br />
            <span className="gradient-text">Not Harder.</span>
          </h1>

          <p className="animate-fade-in-up delay-300 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl">
            Q-Ai is your personal AI tutor that adapts to your unique learning
            style drawing answers exclusively from your course materials, not
            the entire internet.
          </p>

          <div className="animate-fade-in-up delay-450 flex flex-wrap gap-4 justify-center">
            <Link
              to="/sign-up"
              className="btn-glow inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 no-underline"
              style={{
                background: "var(--color-primary)",
              }}
            >
              Get Started Free
              <SVGIcon name="arrow-right" size={16} strokeWidth={2.5} />
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-all duration-200 hover:bg-white hover:-translate-y-0.5 no-underline"
            >
              Explore Features
            </Link>
          </div>

          <p
            className="animate-fade-in delay-600 mt-10 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            No credit card required Free plan available
          </p>
        </div>
      </section>

      <div>
        <div className="h-px" style={{ background: "var(--color-border)" }} />
      </div>

      {/*  How Q-Ai Helps  */}
      <section className="py-24 container">
        <div>
          {/* Section header */}
          <div
            ref={featuresSection.ref}
            className={`text-center mb-16 transition-none ${featuresSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
          >
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              How Q-Ai Helps You Learn
            </h2>
            <p className="text-base max-w-xl mx-auto">
              Every feature is designed around one goal turning complex material
              into genuine understanding.
            </p>
          </div>

          {/* Cards */}
          <div
            ref={cardsSection.ref}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            {highlights.map((item, i) => (
              <div
                key={item.title}
                className={`card-lift bg-white rounded-2xl p-7 flex flex-col gap-5 ${cardsSection.inView ? `animate-fade-in-up` : "opacity-0"}`}
                style={{
                  border: "1px solid var(--color-border)",
                  borderTop: `3px solid ${item.accentColor}`,
                  boxShadow: "var(--shadow-sm)",
                  animationDelay: cardsSection.inView ? `${i * 120}ms` : "0ms",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: item.iconBg }}
                >
                  <SVGIcon
                    name={item.icon}
                    size={22}
                    color={item.iconColor}
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p
                    className="leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Sample Explanation */}
          <div
            ref={sampleSection.ref}
            className={`bg-white rounded-2xl p-8 md:p-10 max-w-3xl mx-auto ${sampleSection.inView ? "animate-scale-in" : "opacity-0"}`}
            style={{
              border: "1px solid var(--color-border)",
              borderLeft: "4px solid var(--color-warning)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center animate-float"
                style={{ background: "rgba(212,168,67,0.15)" }}
              >
                <SVGIcon
                  name="sparkles"
                  size={16}
                  color="#b8893a"
                  strokeWidth={1.75}
                />
              </div>
              <span className="font-semibold text-base">
                Sample Explanation
              </span>
            </div>
            <p className="leading-relaxed mb-5">
              That's a tough concept to grasp, but the way you're thinking about
              it is a great start. Let's tackle quantum mechanics together by
              breaking it down into three simple steps:
            </p>
            <ol className="space-y-3">
              {[
                'Wave-particle duality isn\'t as confusing when we think of light as having different "moods"',
                "The uncertainty principle is like trying to measure a soap bubble without popping it",
                "Quantum superposition makes more sense if we imagine a spinning coin before it lands",
              ].map((text, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-3 ${sampleSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
                  style={{
                    color: "var(--color-text)",
                    animationDelay: sampleSection.inView
                      ? `${150 + i * 120}ms`
                      : "0ms",
                  }}
                >
                  <span
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{
                      background: "rgba(139,158,108,0.15)",
                      color: "var(--color-accent-dark)",
                    }}
                  >
                    {i + 1}
                  </span>
                  {text}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <div>
        <div className="h-px" style={{ background: "var(--color-border)" }} />
      </div>

      {/*  CTA Banner  */}
      <section className="py-24">
        <div>
          <div
            ref={ctaSection.ref}
            className={`rounded-3xl px-10 py-16 flex flex-col items-center text-center max-w-2xl mx-auto ${ctaSection.inView ? "animate-scale-in" : "opacity-0"}`}
            style={{
              background: "var(--color-primary)",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p
              className="text-base mb-10"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Let's start your personalized learning journey together. Upload
              your materials and experience the difference.
            </p>
            <Link
              to="/sign-up"
              className="btn-glow inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
              style={{
                background: "var(--color-accent)",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Get Started
              <SVGIcon name="arrow-right" size={16} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/*  Footer  */}
      <footer
        className="py-8 mt-auto"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-bold font-serif text-sm">
              Q
            </div>
            <span className="font-semibold text-sm">Q-Ai</span>
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {new Date().getFullYear()} Q-Ai. Building smarter learners.
          </p>
          <div className="flex items-center gap-5">
            <Link
              to="/features"
              className="text-xs hover:underline"
              style={{
                color: "var(--color-text-secondary)",
                textDecoration: "none",
              }}
            >
              Features
            </Link>
            <Link
              to="/about"
              className="text-xs hover:underline"
              style={{
                color: "var(--color-text-secondary)",
                textDecoration: "none",
              }}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-xs hover:underline"
              style={{
                color: "var(--color-text-secondary)",
                textDecoration: "none",
              }}
            >
              Contact
            </Link>
            <Link
              to="/sign-in"
              className="text-xs hover:underline"
              style={{
                color: "var(--color-text-secondary)",
                textDecoration: "none",
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
