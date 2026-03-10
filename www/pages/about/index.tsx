import React from "react";
import { Link } from "react-router";
import SVGIcon from "../../components/SVGIcon";
import { useInView } from "../../hooks/useInView";

function AboutPage() {
  const whoSection = useInView();
  const ctaSection = useInView();
  const valuesSection = useInView();
  const missionSection = useInView();

  return (
    <div
      className="container flex flex-col items-center py-20 space-y-20"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Page hero */}
      <div className=" text-center overflow-hidden">
        <span
          className="animate-fade-in delay-75 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
          style={{
            background: "rgba(139,158,108,0.12)",
            color: "var(--color-accent-dark)",
          }}
        >
          About Us
        </span>
        <h1 className="animate-fade-in-up delay-150 font-serif text-4xl md:text-5xl mb-5">
          Built for Students,
          <br />
          By People Who Remember the Struggle
        </h1>
        <p
          className="animate-fade-in-up delay-300 text-lg leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Q-Ai was born from a simple frustration: why is it so hard to get a
          clear, personalized explanation of your own coursework?
        </p>
      </div>

      <div className="h-px" style={{ background: "var(--color-border)" }} />

      {/* Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div
          ref={missionSection.ref}
          className={missionSection.inView ? "animate-fade-in-up" : "opacity-0"}
        >
          <h2 className="font-serif text-3xl mb-5">Our Mission</h2>
          <p
            className="text-base leading-relaxed mb-4"
            style={{ color: "var(--color-text-secondary)" }}
          >
            We believe every student deserves a patient, knowledgeable tutor who
            speaks their language and understands their specific course material
            not a generic chatbot trained on the entire internet.
          </p>
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Q-Ai bridges the gap between dense lecture notes and genuine
            understanding, using your own uploaded materials as the single
            source of truth.
          </p>
        </div>
        <div ref={valuesSection.ref} className="flex flex-col gap-5">
          {[
            {
              icon: "",
              label: "Student-First Design",
              desc: "Every decision starts with one question: does this help a student understand?",
            },
            {
              icon: "",
              label: "Privacy by Default",
              desc: "Your materials are yours. They never leave your vault or train any external model.",
            },
            {
              icon: "",
              label: "Genuine Understanding",
              desc: "We guide you toward the answer  we don't just hand it over.",
            },
          ].map((v, i) => (
            <div
              key={v.label}
              className={`flex items-start gap-4 ${valuesSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
              style={{
                animationDelay: valuesSection.inView ? `${i * 120}ms` : "0ms",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0"
                style={{ background: "var(--color-bg-muted)" }}
              >
                {v.icon}
              </div>
              <div>
                <p className="font-semibold mb-0.5">{v.label}</p>
                <p
                  className="leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {v.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px" style={{ background: "var(--color-border)" }} />

      {/* Who we help */}
      <div
        ref={whoSection.ref}
        className={` items-center flex flex-col ${whoSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
      >
        <h2 className="mb-4">Who Q-Ai Is For</h2>
        <p
          className="text-base mb-12"
          style={{ color: "var(--color-text-secondary)" }}
        >
          If you've ever stared at a textbook chapter for an hour and still felt
          lost, Q-Ai is for you.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            icon: "",
            title: "STEM Students",
            desc: "Tackle derivations, proofs, and problem sets with step-by-step guided breakdowns.",
          },
          {
            icon: "",
            title: "Law Students",
            desc: "Digest dense case law and statutes through your own uploaded readings.",
          },
          {
            icon: "",
            title: "Medical Students",
            desc: "Master complex biology and pharmacology with analogy-driven explanations.",
          },
        ].map((item, i) => (
          <div
            key={item.title}
            className={`card-lift bg-white rounded-2xl p-7 flex flex-col gap-3 text-left ${whoSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
            style={{
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-sm)",
              animationDelay: whoSection.inView ? `${150 + i * 120}ms` : "0ms",
            }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
              style={{ background: "var(--color-bg-muted)" }}
            >
              {item.icon}
            </div>
            <h3 className="font-semibold text-base">{item.title}</h3>
            <p
              className="leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="h-px" style={{ background: "var(--color-border)" }} />

      {/* CTA */}
      <div
        ref={ctaSection.ref}
        className={`rounded-3xl px-10 py-14 flex flex-col items-center text-center  mx-auto ${ctaSection.inView ? "animate-scale-in" : "opacity-0"}`}
        style={{
          background: "var(--color-primary)",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        <h2 className="font-serif text-3xl text-white mb-4">
          Ready to learn differently?
        </h2>
        <p
          className="text-base mb-8"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          Join students who've found their study spark with Q-Ai.
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
          Get Started Free
          <SVGIcon name="arrow-right" size={16} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}

export default AboutPage;
