import { Link } from "react-router";
import SVGIcon from "../../components/SVGIcon";
import { useInView } from "../../hooks/useInView";
import { GlowOrb } from "../../components/GlowOrb";
import { SectionBadge } from "../../components/SectionBadge";
import { AnimatedCounter } from "../../components/AnimatedCounter";
import { stats, values, audiences } from "../../animations/about.data";

// -- Page ----------------------------------------------------
function AboutPage() {
  const heroSection = useInView();
  const statsSection = useInView();
  const missionSection = useInView();
  const valuesSection = useInView();
  const whoSection = useInView();
  const manifestoSection = useInView();
  const ctaSection = useInView();

  return (
    <div className="bg-bg overflow-hidden">
      {/* HERO */}
      <section
        ref={heroSection.ref}
        className="relative pt-4 pb-10 flex flex-col items-center text-center overflow-hidden"
      >
        <GlowOrb
          color="accent"
          size={700}
          opacity={0.28}
          blur={2}
          className="animate-orb-pulse"
          style={{ top: "-250px", left: "-200px" }}
        />
        <GlowOrb
          color="accent"
          size={400}
          opacity={0.38}
          blur={2}
          className="animate-orb-pulse"
          style={{ top: "-250px", left: "-200px" }}
        />
        <GlowOrb
          color="accent"
          size={700}
          opacity={0.28}
          blur={2}
          className="animate-orb-pulse"
          style={{ top: "-150px", left: "-200px" }}
        />
        <GlowOrb
          color="warning"
          size={450}
          opacity={0.44}
          style={{ bottom: "-120px", right: "-80px" }}
          animation="floatY 11s ease-in-out 1.5s infinite reverse"
        />
        <GlowOrb
          color="info"
          size={280}
          opacity={0.34}
          style={{ top: "35%", right: "8%" }}
          animation="floatY 9s ease-in-out 3s infinite"
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--color-border) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="container relative z-10 max-w-4xl mx-auto px-6 py-24">
          <SectionBadge
            icon="sparkles"
            className={`mb-8 ${heroSection.inView ? "animate-fade-in" : "opacity-0"}`}
          >
            Our Story
          </SectionBadge>
          <h1 className="animate-fade-in-up delay-150 font-serif text-4xl md:text-5xl mb-5">
            Built for Students,
            <br />
            <span className="gradient-text">
              {" "}
              By People Who Remember the
            </span>{" "}
            Struggle
          </h1>
          <p
            className={`text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10 ${heroSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
            style={{
              color: "var(--color-text-secondary)",
              animationDelay: "220ms",
            }}
          >
            Q-Ai was born from a simple frustration: why is it so hard to get a
            clear, personalized explanation of your own coursework? We built the
            tutor we wish we had.
          </p>
          <div
            className={`flex flex-wrap gap-3 justify-center ${heroSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "340ms" }}
          >
            <Link
              to="/sign-up"
              className="btn-glow inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-primary no-underline transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
            >
              Start Learning Free
              <SVGIcon name="rocket" size={16} strokeWidth={2} />
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold  text-text no-underline transition-all duration-200 hover:bg-bg-card hover:-translate-y-0.5"
            >
              See Features
              <SVGIcon name="arrow-right" size={15} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
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

      {/* MISSION */}
      <section className="py-16 md:py-28">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div
              ref={missionSection.ref}
              className={
                missionSection.inView ? "animate-slide-in-left" : "opacity-0"
              }
            >
              <div className="w-12 h-1 rounded-full mb-8 bg-accent" />
              <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-6">
                Our Mission
              </h2>
              <p className="text-lg leading-relaxed mb-6 text-text-secondary">
                We believe every student deserves a patient, knowledgeable tutor
                who speaks their language and understands their specific course
                material not a generic chatbot trained on the entire internet.
              </p>
              <p className="text-base leading-relaxed text-text-secondary">
                Q-Ai bridges the gap between dense lecture notes and genuine
                understanding, using your own uploaded materials as the single
                source of truth.
              </p>
            </div>
            <div
              className={`flex flex-col gap-4 ${missionSection.inView ? "animate-slide-in-right" : "opacity-0"}`}
              style={{ animationDelay: "120ms" }}
            >
              {/* Editorial image */}
              <div
                className="relative rounded-2xl overflow-hidden shadow-xl mb-2"
                style={{
                  aspectRatio: "16/9",
                  border: "1.5px solid rgba(26,35,50,0.1)",
                }}
              >
                <img
                  src="/images/ai-human.jpg"
                  alt="AI and human connection"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(10,15,25,0.35) 0%, transparent 60%)",
                  }}
                />
                <div
                  className="absolute bottom-4 left-4 right-4 px-3 py-2 rounded-lg flex items-center gap-2"
                  style={{
                    background: "rgba(10,15,25,0.6)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <SVGIcon
                    name="heart"
                    size={14}
                    color="#ef4444"
                    strokeWidth={1.75}
                  />
                  <span className="text-xs font-semibold text-white/90">
                    Building the connection between AI and learners
                  </span>
                </div>
              </div>

              {[
                {
                  icon: "target" as const,
                  iconBg: "rgba(212,168,67,0.12)",
                  iconColor: "#d4a843",
                  title: "Hyper-personalized to you",
                  desc: "Your learning DNA + your course materials = answers that make sense to you, not just anyone.",
                },
                {
                  icon: "brain" as const,
                  iconBg: "rgba(74,127,165,0.12)",
                  iconColor: "#4a7fa5",
                  title: "Built on your source of truth",
                  desc: "Q-Ai only draws from what you uploaded. No hallucinations. No generic Wikipedia summaries.",
                },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className="card-lift flex items-start gap-4 p-5 rounded-2xl border border-border bg-bg-card shadow-sm"
                  style={{
                    animationDelay: missionSection.inView
                      ? `${160 + i * 100}ms`
                      : "0ms",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: item.iconBg }}
                  >
                    <SVGIcon
                      name={item.icon}
                      size={18}
                      color={item.iconColor}
                      strokeWidth={1.75}
                    />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">{item.title}</p>
                    <p className="text-sm leading-relaxed text-text-secondary">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-border" />

      {/* VALUES */}
      <section className="py-16 md:py-28">
        <div className="container">
          <div
            ref={valuesSection.ref}
            className={`text-center mb-16 ${valuesSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
          >
            <SectionBadge className="mb-6" color="info">
              What drives us
            </SectionBadge>
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              Built on Three Beliefs
            </h2>
            <p className="text-base max-w-xl mx-auto text-text-secondary">
              Every line of code, every design choice, every AI prompt all
              guided by these three principles.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div
                key={v.title}
                className={`card-lift relative rounded-2xl p-8 flex flex-col gap-5 ${valuesSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
                style={{
                  border: "1.5px solid var(--color-border)",
                  borderTop: `3px solid ${v.borderColor}`,
                  background: `linear-gradient(160deg, ${v.glowColor}, var(--color-bg-card) 60%)`,
                  boxShadow: "var(--shadow-sm)",
                  animationDelay: valuesSection.inView ? `${i * 130}ms` : "0ms",
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: v.iconBg }}
                >
                  <SVGIcon
                    name={v.icon}
                    size={24}
                    color={v.iconColor}
                    strokeWidth={1.7}
                  />
                </div>
                <div>
                  <h3
                    className="font-semibold text-lg mb-2.5"
                    style={{ color: v.textColor }}
                  >
                    {v.title}
                  </h3>
                  <p className="leading-relaxed text-sm text-text-secondary">
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-border" />

      {/* WHO WE HELP */}
      <section className="py-16 md:py-28">
        <div className="container">
          <div
            ref={whoSection.ref}
            className={`text-center mb-16 ${whoSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
          >
            <SectionBadge color="warning" className="mb-6">
              For students everywhere
            </SectionBadge>
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              Who Q-Ai Is For
            </h2>
            <p className="text-base max-w-xl mx-auto text-text-secondary">
              If you have ever stared at a textbook for hours and still felt
              lost Q-Ai was built for you.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {audiences.map((a, i) => (
              <div
                key={a.label}
                className={`card-lift rounded-2xl p-8 flex flex-col gap-5 ${whoSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
                style={{
                  background: a.bgGradient,
                  border: `1.5px solid ${a.borderColor}`,
                  boxShadow: "var(--shadow-sm)",
                  color: a.textColor,
                  animationDelay: whoSection.inView ? `${i * 130}ms` : "0ms",
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: a.iconBg,
                    border: `1px solid ${a.borderColor}`,
                  }}
                >
                  <SVGIcon
                    name={a.icon}
                    size={22}
                    color={a.textColor}
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <span
                    className="text-xs font-bold tracking-widest uppercase mb-2 block"
                    style={{ color: a.textColor }}
                  >
                    {a.label}
                  </span>
                  <h3
                    className="font-semibold text-lg mb-2"
                    style={{ color: a.textColor }}
                  >
                    {a.headline}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {a.desc}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto pt-2">
                  {a.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        background: a.iconBg,
                        color: a.accentColor,
                        border: `1px solid ${a.borderColor}`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO DARK */}
      <section
        ref={manifestoSection.ref}
        className="py-16 md:py-28 relative overflow-hidden"
      >
        <GlowOrb
          color="accent"
          size={1000}
          opacity={0.2}
          blur={0}
          style={{ top: "-200px", right: "-100px" }}
          animation="floatY 10s ease-in-out infinite"
        />
        <GlowOrb
          color="accent"
          size={1000}
          opacity={0.12}
          blur={0}
          style={{ bottom: "-100px", left: "5%" }}
          animation="floatY 8s ease-in-out 2s infinite reverse"
        />
        <div className="container relative z-10 max-w-3xl mx-auto text-center px-6">
          <div
            className={`mb-8 ${manifestoSection.inView ? "animate-fade-in" : "opacity-0"}`}
          >
            <SVGIcon
              name="quote"
              size={44}
              color="rgba(139,158,108,0.55)"
              strokeWidth={1.4}
            />
          </div>
          <p
            className={`font-serif text-3xl md:text-4xl leading-tight text-primary mb-8 ${manifestoSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "100ms" }}
          >
            We do not just build AI. We build the{" "}
            <span className="gradient-text">
              confidence students need to walk into any
            </span>{" "}
            exam and own it.
          </p>
          <p
            className={`text-base leading-relaxed mb-10 text-primary ${manifestoSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "200ms" }}
          >
            Every student deserves to understand their material deeply not just
            scramble to memorize it the night before. That is why Q-Ai exists.
          </p>
          <div
            className={`${manifestoSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "300ms" }}
          >
            <Link
              to="/sign-up"
              className="btn-glow inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-primary no-underline transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
            >
              Join Q-Ai Today
              <SVGIcon name="arrow-right" size={16} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section ref={ctaSection.ref} className="py-16 md:py-28">
        <div className="container max-w-4xl mx-auto px-6">
          <div
            className={`rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden border border-border bg-bg-card shadow-xl ${ctaSection.inView ? "animate-scale-in" : "opacity-0"}`}
          >
            <GlowOrb
              color="accent"
              size={300}
              opacity={0.12}
              blur={0}
              style={{ top: "-80px", right: "-60px" }}
            />
            <div className="flex-1 text-center md:text-left relative z-10">
              <h2 className="font-serif text-3xl md:text-4xl mb-3">
                Ready to learn differently?
              </h2>
              <p className="text-base leading-relaxed text-text-secondary">
                Join thousands of students who have found their study spark with
                Q-Ai. Upload your first document it takes 30 seconds.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0 relative z-10 w-full md:w-auto">
              <Link
                to="/sign-up"
                className="btn-glow inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-primary no-underline transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
              >
                Get Started Free
                <SVGIcon name="rocket" size={16} strokeWidth={2} />
              </Link>
              <Link
                to="/persona-quiz"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold border border-border text-text no-underline transition-all duration-200 hover:bg-bg-card hover:-translate-y-0.5"
              >
                <SVGIcon name="dna" size={15} strokeWidth={2} />
                Take the Learning Quiz
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
