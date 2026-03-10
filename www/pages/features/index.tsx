import React from "react";
import { Link } from "react-router";
import SVGIcon from "../../components/SVGIcon";
import { useInView } from "../../hooks/useInView";

//  Data

const pillars = [
  {
    icon: "check" as const,
    title: "The Knowledge Vault",
    description:
      "A RAG-driven system where the AI's intelligence is tethered strictly to your uploaded materials. It doesn't just give general factsit gives your professor's facts.",
    bullets: [
      "Upload PDFs, documents, and lecture videos",
      "Private, secure storage per course",
      "Video transcription for searchable content",
    ],
  },
  {
    icon: "check" as const,
    title: "Cognitive Personalization",
    description:
      'Unlike general AIs, Q-Ai adapts its teaching style. Whether you learn best through analogies, first-principles logic, or summarized "cheat sheets," we match your persona.',
    bullets: [
      "30-second learning style quiz",
      "Adaptive explanations and analogies",
      "Scaffolding and Socratic questioning",
    ],
  },
  {
    icon: "check" as const,
    title: 'The "On-The-Go" Tutor',
    description:
      'A mobile-optimized experience featuring "Voice Study" mode, allowing you to have a verbal dialogue with your course material while commuting or walking between classes.',
    bullets: [
      "Interactive voice calls with your material",
      "Mobile-optimized interface",
      "Study on the move",
    ],
  },
];

const standouts = [
  {
    icon: "lightbulb" as const,
    title: "Specialization Over Generalization",
    description:
      "Focused on your specific course materials, not the entire internet. This means more accurate, relevant answers.",
  },
  {
    icon: "sparkles" as const,
    title: "Empathetic Expert Persona",
    description:
      "Think of Q-Ai as a patient older sibling — supportive, understanding, and always there when you need help studying.",
  },
  {
    icon: "shield" as const,
    title: "Privacy First",
    description:
      "Your Study Vault is secure and private. Your materials stay yours, and are never used for training other models.",
  },
  {
    icon: "book" as const,
    title: "Built for College Students",
    description:
      "Designed specifically for stressed students tackling hard subjects like STEM, Law, and Medicine.",
  },
];

const coreFeatures = [
  {
    icon: "analogy-cycle" as const,
    iconBg: "rgba(139,158,108,0.12)",
    iconColor: "var(--color-accent-dark)",
    title: "Personalized Learning",
    description:
      'Every explanation is tailored to your learning style and perspective. Experience the "Magic Moment" when complex concepts finally click through personalized analogies and step-by-step guidance.',
  },
  {
    icon: "mic" as const,
    iconBg: "rgba(212,168,67,0.12)",
    iconColor: "var(--color-accent-dark)",
    title: "Interactive Call Explanation",
    description:
      "Have real-time conversations with your course material. Ask questions, get clarifications, and work through problems — just like a tutor sitting next to you.",
  },
  {
    icon: "file" as const,
    iconBg: "rgba(139,158,108,0.12)",
    iconColor: "var(--color-accent-dark)",
    title: "Customized Answers Based on Material",
    description:
      "Answers are derived directly from your uploaded materials, ensuring accuracy and relevance. The AI references your professor's specific terminology and context, not generic internet knowledge.",
  },
  {
    icon: "check" as const,
    iconBg: "rgba(212,168,67,0.12)",
    iconColor: "var(--color-accent-dark)",
    title: "Academic Integrity First",
    description:
      "We're a tutor, not a homework solver. Q-Ai encourages deep understanding through scaffolding and Socratic questioning, guiding you to the answer rather than just providing it.",
  },
];

//  Page

function FeaturesPage() {
  const pillarsHeader = useInView();
  const pillarsCards = useInView();
  const standoutHeader = useInView();
  const standoutCard = useInView();
  const coreHeader = useInView();
  const coreCards = useInView();
  const ctaSection = useInView();

  return (
    <div
      className="flex flex-col container"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Page hero */}
      <div className="flex flex-col py-20 text-center overflow-hidden items-center">
        <p
          className="animate-fade-in delay-75 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
          style={{
            background: "rgba(139,158,108,0.12)",
            color: "var(--color-accent-dark)",
          }}
        >
          Features
        </p>
        <h1 className="animate-fade-in-up delay-150 font-serif text-4xl md:text-5xl mb-5">
          Everything You Need to Master Your Coursework
        </h1>
        <p className="animate-fade-in-up delay-300 text-lg leading-relaxed">
          Q-Ai is built from the ground up for students who want to truly
          understand their material not just pass the test.
        </p>
      </div>

      <div className="h-px" style={{ background: "var(--color-border)" }} />

      {/*  The Three Pillars  */}
      <section className="py-24">
        <div
          ref={pillarsHeader.ref}
          className={`text-center mb-16 ${pillarsHeader.inView ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            The Three Pillars
          </h2>
          <p className="text-base max-w-2xl mx-auto">
            Our core solution designed to bridge the gap between complex
            materials and your unique mental model
          </p>
        </div>

        <div
          ref={pillarsCards.ref}
          className="grid grid-cols-1 md:grid-cols-3 gap-7"
        >
          {pillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className={`card-lift bg-white rounded-2xl p-8 flex flex-col gap-5 ${pillarsCards.inView ? "animate-fade-in-up" : "opacity-0"}`}
              style={{
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-sm)",
                animationDelay: pillarsCards.inView ? `${i * 120}ms` : "0ms",
              }}
            >
              <h3 className="font-semibold text-xl mb-2">{pillar.title}</h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {pillar.description}
              </p>
              <ul className="space-y-2 mt-auto">
                {pillar.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm">
                    <SVGIcon
                      name={pillar.icon}
                      size={22}
                      className="shrink-0"
                    />
                    <span className="mt-0.5 font-bold shrink-0"></span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px" style={{ background: "var(--color-border)" }} />

      {/*  Why Q-Ai Stands Out  */}
      <section className="py-24">
        <div
          ref={standoutHeader.ref}
          className={`text-center mb-16 ${standoutHeader.inView ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            Why Q-Ai Stands Out
          </h2>
          <p className="text-base max-w-2xl mx-auto">
            While ChatGPT is a library, Q-Ai is a private tutor sitting at the
            desk next to you
          </p>
        </div>

        <div
          ref={standoutCard.ref}
          className={`bg-white rounded-3xl p-10 md:p-14 max-w-4xl mx-auto ${standoutCard.inView ? "animate-scale-in" : "opacity-0"}`}
          style={{
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
            {standouts.map((item, i) => (
              <div
                key={item.title}
                className={`flex items-start gap-4 ${standoutCard.inView ? "animate-fade-in-up" : "opacity-0"}`}
                style={{
                  animationDelay: standoutCard.inView
                    ? `${100 + i * 100}ms`
                    : "0ms",
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "var(--color-bg-muted)" }}
                >
                  <SVGIcon
                    name={item.icon}
                    size={18}
                    color="var(--color-accent-dark)"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-base mb-1.5">
                    {item.title}
                  </h4>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px" style={{ background: "var(--color-border)" }} />

      {/*  Core Features  */}
      <section className="py-24">
        <div
          ref={coreHeader.ref}
          className={`text-center mb-16 ${coreHeader.inView ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            Core Features
          </h2>
          <p
            className="text-base max-w-2xl mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            The essential features that make personalized learning possible
          </p>
        </div>

        <div
          ref={coreCards.ref}
          className="grid grid-cols-1 md:grid-cols-2 gap-7 max-w-4xl mx-auto"
        >
          {coreFeatures.map((feature, i) => (
            <div
              key={feature.title}
              className={`card-lift bg-white rounded-2xl p-8 flex items-start gap-5 ${coreCards.inView ? "animate-fade-in-up" : "opacity-0"}`}
              style={{
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-sm)",
                animationDelay: coreCards.inView ? `${i * 100}ms` : "0ms",
              }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ background: feature.iconBg }}
              >
                <SVGIcon
                  name={feature.icon}
                  size={19}
                  color={feature.iconColor}
                  strokeWidth={1.75}
                />
              </div>
              <div>
                <h4 className="font-semibold text-base mb-2">
                  {feature.title}
                </h4>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px" style={{ background: "var(--color-border)" }} />

      {/*  CTA  */}
      <section className="py-24">
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
            Let's start your personalized learning journey together. Upload your
            materials and experience the difference.
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
      </section>
    </div>
  );
}

export default FeaturesPage;
