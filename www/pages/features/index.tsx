import { Link } from "react-router";
import SVGIcon from "../../components/SVGIcon";
import { useInView } from "../../hooks/useInView";
import { GlowOrb } from "../../components/GlowOrb";
import { useParallax } from "../../hooks/useParallax";
import { SectionBadge } from "../../components/SectionBadge";
import { AnimatedCounter } from "../../components/AnimatedCounter";
import {
  PARTICLES,
  PARTICLE_COLORS,
  GHOST_WORDS,
  GHOST_CONFIG,
  stats,
  pillars,
  standouts,
  coreFeatures,
} from "../../animations/features.data";

// -- Page ---------------------------------------------------------------------
function FeaturesPage() {
  const scrollY = useParallax();
  const coreCards = useInView();
  const ctaSection = useInView();
  const coreHeader = useInView();
  const heroSection = useInView();
  const statsSection = useInView();
  const pillarsCards = useInView();
  const pillarsHeader = useInView();
  const standoutCards = useInView();
  const standoutHeader = useInView();

  return (
    <div className="flex flex-col bg-bg overflow-hidden">
      {/* -- HERO ---------------------------------------------------------------- */}
      <section
        ref={heroSection.ref}
        className="relative flex flex-col justify-center overflow-hidden py-16"
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--color-border) 1px, transparent 1px)",
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

        {/* Floating particles */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ zIndex: 3 }}
        >
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

        {/* Glow orbs */}
        <GlowOrb
          color="accent"
          size={700}
          opacity={0.22}
          blur={2}
          className="animate-orb-pulse"
          style={{
            top: -250,
            left: -200,
            zIndex: 1,
            transform: `translateY(${scrollY * 0.2}px)`,
          }}
        />
        <GlowOrb
          color="warning"
          size={480}
          opacity={0.16}
          style={{
            bottom: -120,
            right: -80,
            zIndex: 1,
            transform: `translateY(${scrollY * -0.14}px)`,
            animation: "floatY 12s ease-in-out 1s infinite reverse",
          }}
        />
        <GlowOrb
          color="info"
          size={300}
          opacity={0.14}
          style={{
            top: "30%",
            right: "8%",
            zIndex: 1,
            transform: `translateY(${scrollY * 0.1}px)`,
            animation: "floatY 9s ease-in-out 2s infinite",
          }}
        />

        {/* Content */}
        <div className="container relative z-10 px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Left: copy */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <SectionBadge
                icon="sparkles"
                color="info"
                className={`mb-8 ${heroSection.inView ? "animate-fade-in delay-75" : "opacity-0"}`}
              >
                Platform Features
              </SectionBadge>

              <h1
                className={`font-serif text-5xl md:text-6xl leading-tight mb-6 ${heroSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
                style={{ animationDelay: "100ms" }}
              >
                Everything You{" "}
                <span className="gradient-text"> Need to Master </span> Your
                Coursework
              </h1>

              <p
                className={`text-lg md:text-xl leading-relaxed mb-10 text-text-secondary ${heroSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
                style={{ animationDelay: "220ms" }}
              >
                Q-Ai is built from the ground up for students who want to truly
                understand their material not just pass the test.
              </p>

              <div
                className={`flex flex-wrap gap-4 justify-center md:justify-start ${heroSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
                style={{ animationDelay: "340ms" }}
              >
                <Link
                  to="/sign-up"
                  className="btn-glow inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-primary no-underline transition-all hover:opacity-90 hover:-translate-y-0.5"
                >
                  Get Started Free
                  <SVGIcon name="arrow-right" size={16} strokeWidth={2.5} />
                </Link>
                <Link
                  to="/persona-quiz"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold border border-border text-text no-underline transition-all hover:bg-bg-card hover:-translate-y-0.5"
                >
                  <SVGIcon name="dna" size={15} strokeWidth={2} />
                  Take the Learning Quiz
                </Link>
              </div>
            </div>

            {/* Right: image */}
            <div
              className={`relative hidden md:block ${heroSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: "200ms" }}
            >
              {/* Glow behind image */}
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 360,
                  height: 360,
                  background:
                    "radial-gradient(circle, rgba(74,127,165,0.28) 0%, transparent 70%)",
                  right: -60,
                  top: "50%",
                  transform: "translateY(-50%)",
                  filter: "blur(24px)",
                  zIndex: 0,
                }}
              />
              <div
                className="relative rounded-3xl overflow-hidden shadow-2xl"
                style={{
                  border: "1.5px solid rgba(74,127,165,0.25)",
                  aspectRatio: "1",
                }}
              >
                <img
                  src="/images/ai-network.jpg"
                  alt="AI neural network connecting knowledge"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(10,15,25,0.45) 0%, transparent 55%)",
                  }}
                />
                {/* badge overlay */}
                <div
                  className="absolute bottom-5 left-5 right-5 flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: "rgba(10,15,25,0.65)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(74,127,165,0.3)",
                  }}
                >
                  <SVGIcon
                    name="sparkles"
                    size={16}
                    color="#4a7fa5"
                    strokeWidth={1.75}
                  />
                  <span className="text-xs font-semibold text-white/90">
                    AI intelligence tethered to your materials
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- STATS BAR ----------------------------------------------------------- */}
      <section
        ref={statsSection.ref}
        className="py-14 border-y border-border bg-bg-card"
      >
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`flex flex-col items-center text-center gap-3 ${statsSection.inView ? "animate-counter-pop" : "opacity-0"}`}
                style={{
                  animationDelay: statsSection.inView ? `${i * 110}ms` : "0ms",
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: s.iconBg }}
                >
                  <SVGIcon
                    name={s.icon}
                    size={20}
                    color={s.iconColor}
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <p
                    className="font-bold text-3xl md:text-4xl font-serif mb-0.5 text-primary"
                    style={{ letterSpacing: "-0.03em" }}
                  >
                    <AnimatedCounter
                      target={s.value}
                      suffix={s.suffix}
                      inView={statsSection.inView}
                    />
                  </p>
                  <p className="text-sm font-medium text-text-secondary">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- THREE PILLARS ------------------------------------------------------- */}
      <section className="py-16 md:py-28">
        <div className="container">
          <div
            ref={pillarsHeader.ref}
            className={`text-center mb-16 ${pillarsHeader.inView ? "animate-fade-in-up" : "opacity-0"}`}
          >
            <SectionBadge className="mb-6" color="info">
              Core Architecture
            </SectionBadge>
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              The Three Pillars
            </h2>
            <p className="text-base max-w-2xl mx-auto text-text-secondary">
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
                className={`card-lift rounded-2xl p-8 flex flex-col gap-5 ${pillarsCards.inView ? "animate-fade-in-up" : "opacity-0"}`}
                style={{
                  background: pillar.bgGradient,
                  border: `1.5px solid ${pillar.borderColor}`,
                  boxShadow: "var(--shadow-sm)",
                  animationDelay: pillarsCards.inView ? `${i * 120}ms` : "0ms",
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: pillar.iconBg,
                      border: `1px solid ${pillar.borderColor}`,
                    }}
                  >
                    <SVGIcon
                      name={pillar.icon}
                      size={22}
                      color={pillar.accentColor}
                      strokeWidth={1.75}
                    />
                  </div>
                  <span
                    className="font-serif text-4xl font-bold"
                    style={{ color: pillar.accentColor, opacity: 0.2 }}
                  >
                    {pillar.number}
                  </span>
                </div>
                <div>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {pillar.description}
                  </p>
                </div>
                <ul className="space-y-2 mt-auto">
                  {pillar.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: pillar.iconBg }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: pillar.accentColor }}
                        />
                      </div>
                      <span className="text-text-secondary">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-border" />

      {/* -- WHY Q-AI STANDS OUT ------------------------------------------------- */}
      <section className="py-16 md:py-28">
        <div className="container">
          <div
            ref={standoutHeader.ref}
            className={`text-center mb-16 ${standoutHeader.inView ? "animate-fade-in-up" : "opacity-0"}`}
          >
            <SectionBadge color="warning" className="mb-6">
              Differentiation
            </SectionBadge>
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              Why Q-Ai Stands Out
            </h2>
            <p className="text-base max-w-2xl mx-auto text-text-secondary">
              While ChatGPT is a library, Q-Ai is a private tutor sitting at the
              desk next to you
            </p>
          </div>

          <div
            ref={standoutCards.ref}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {standouts.map((item, i) => (
              <div
                key={item.title}
                className={`card-lift flex  items-center gap-5 p-6 rounded-2xl bg-bg-card ${standoutCards.inView ? "animate-fade-in-up" : "opacity-0"}`}
                style={{
                  border: `1.5px solid ${item.borderColor}`,
                  borderTop: `3px solid ${item.accentColor}`,
                  boxShadow: "var(--shadow-sm)",
                  animationDelay: standoutCards.inView ? `${i * 100}ms` : "0ms",
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: item.iconBg }}
                >
                  <SVGIcon
                    name={item.icon}
                    size={20}
                    color={item.accentColor}
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <h4
                    className="font-semibold text-base mb-2"
                    style={{ color: item.textColor }}
                  >
                    {item.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-border" />

      {/* -- CORE FEATURES ------------------------------------------------------- */}
      <section className="py-16 md:py-28">
        <div className="container">
          <div
            ref={coreHeader.ref}
            className={`text-center mb-16 ${coreHeader.inView ? "animate-fade-in-up" : "opacity-0"}`}
          >
            <SectionBadge color="info" className="mb-6">
              Under the Hood
            </SectionBadge>
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              Core Features
            </h2>
            <p className="text-base max-w-2xl mx-auto text-text-secondary">
              The essential features that make personalized learning possible
            </p>
          </div>

          <div
            ref={coreCards.ref}
            className="grid grid-cols-1 md:grid-cols-2 gap-7"
          >
            {coreFeatures.map((feature, i) => (
              <div
                key={feature.title}
                className={`card-lift rounded-2xl p-8 flex max-md:flex-col items-center gap-5 ${coreCards.inView ? "animate-fade-in-up" : "opacity-0"}`}
                style={{
                  background: feature.bgGradient,
                  border: `1.5px solid ${feature.borderColor}`,
                  boxShadow: "var(--shadow-sm)",
                  animationDelay: coreCards.inView ? `${i * 100}ms` : "0ms",
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: feature.iconBg }}
                >
                  <SVGIcon
                    name={feature.icon}
                    size={20}
                    color={feature.accentColor}
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <h4
                    className="font-semibold text-base mb-2"
                    style={{ color: feature.textColor }}
                  >
                    {feature.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- DARK MANIFESTO / CTA ------------------------------------------------ */}
      <section
        ref={ctaSection.ref}
        className="py-16 md:py-28 relative overflow-hidden"
      >
        <GlowOrb
          color="info"
          size={2000}
          opacity={0.2}
          blur={0}
          style={{ top: "-500px", right: "-90px" }}
          animation="floatY 10s ease-in-out infinite"
        />

        <div className="container relative z-10 max-w-3xl mx-auto text-center px-6">
          <div
            className={`flex items-center justify-center mb-8 ${ctaSection.inView ? "animate-fade-in" : "opacity-0"}`}
          >
            <SVGIcon
              name="sparkles"
              size={44}
              color="rgba(139,158,108,0.55)"
              strokeWidth={1.4}
            />
          </div>
          <h2
            className={`font-serif text-4xl md:text-5xl text-info leading-tight mb-6 ${ctaSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "100ms" }}
          >
            Start learning smarter. Today.
          </h2>
          <p
            className={`text-base leading-relaxed mb-10 ${ctaSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "200ms" }}
          >
            Upload your course materials, take the 30-second learning quiz, and
            experience the difference of a tutor that knows your material as
            well as you do.
          </p>
          <div
            className={`flex flex-wrap gap-4 justify-center ${ctaSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "300ms" }}
          >
            <Link
              to="/sign-up"
              className="btn-glow inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white no-underline transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "var(--color-info)" }}
            >
              Get Started Free
              <SVGIcon name="rocket" size={16} strokeWidth={2} />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold no-underline transition-all duration-200 hover:-translate-y-0.5 text-(--color-primary)"
              style={{
                borderColor: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              Learn About Us
              <SVGIcon name="arrow-right" size={16} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FeaturesPage;
