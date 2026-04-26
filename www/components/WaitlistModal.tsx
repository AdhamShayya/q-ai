import { useState, useEffect, useRef } from "react";
import { waitlistApi } from "../trpc";
import { useThemeStore } from "../store/theme";

// ── Floating particle ─────────────────────────────────────────────────────────

function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div className="absolute rounded-full pointer-events-none" style={style} />
  );
}

// ── Sparkle icon (inline SVG) ─────────────────────────────────────────────────

function SparkleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="inline-block"
      aria-hidden
    >
      <path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        fill="currentColor"
      />
      <path
        d="M19 14L19.75 17.25L23 18L19.75 18.75L19 22L18.25 18.75L15 18L18.25 17.25L19 14Z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}

// ── CheckCircle icon ──────────────────────────────────────────────────────────

function CheckCircleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#8b9e6c" opacity="0.15" />
      <circle cx="12" cy="12" r="11" stroke="#8b9e6c" strokeWidth="1.5" />
      <path
        d="M7.5 12L10.5 15L16.5 9"
        stroke="#8b9e6c"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Animated logo mark ────────────────────────────────────────────────────────

function LogoMark() {
  const { isDark } = useThemeStore();

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      <div className="relative flex items-center justify-center w-10 h-10 rounded-xl">
        <img
          src={isDark ? "/images/logo-dark.svg" : "/images/logo-light.svg"}
          alt="Q-Ai Logo"
          className="w-8 h-8"
        />
      </div>
      <span
        className="text-xl font-bold tracking-tight"
        style={{ color: "#1a2332", fontFamily: "var(--font-serif)" }}
      >
        Q-AI
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const PARTICLES = [
  {
    size: 6,
    top: "12%",
    left: "8%",
    color: "#8b9e6c",
    opacity: 0.5,
    delay: "0s",
    duration: "6s",
  },
  {
    size: 4,
    top: "22%",
    left: "88%",
    color: "#8b9e6c",
    opacity: 0.35,
    delay: "1s",
    duration: "7s",
  },
  {
    size: 8,
    top: "70%",
    left: "5%",
    color: "#1a2332",
    opacity: 0.2,
    delay: "2s",
    duration: "8s",
  },
  {
    size: 5,
    top: "80%",
    left: "90%",
    color: "#8b9e6c",
    opacity: 0.4,
    delay: "0.5s",
    duration: "5s",
  },
  {
    size: 3,
    top: "45%",
    left: "92%",
    color: "#8b9e6c",
    opacity: 0.3,
    delay: "3s",
    duration: "9s",
  },
  {
    size: 7,
    top: "55%",
    left: "3%",
    color: "#1a2332",
    opacity: 0.15,
    delay: "1.5s",
    duration: "7s",
  },
  {
    size: 4,
    top: "90%",
    left: "50%",
    color: "#8b9e6c",
    opacity: 0.25,
    delay: "2.5s",
    duration: "6s",
  },
  {
    size: 5,
    top: "8%",
    left: "55%",
    color: "#8b9e6c",
    opacity: 0.3,
    delay: "4s",
    duration: "8s",
  },
];

export default function WaitlistModal() {
  // Only block the UI in production builds
  if (!import.meta.env.PROD) {
    return null;
  }

  const [dismissed, setDismissed] = useState(false);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Slight delay so the enter animation plays
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (status === "idle") {
      inputRef.current?.focus();
    }
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const result = await waitlistApi.join.mutate({ email: email.trim() });
      if (result.alreadyExists) {
        // Still treat as success — they're already on the list
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      {/* ── Keyframe styles injected once ── */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px #8b9e6c; opacity: 1; }
          50% { box-shadow: 0 0 18px #8b9e6c, 0 0 30px rgba(139,158,108,0.4); opacity: 0.85; }
        }
        @keyframes float-up {
          0% { transform: translateY(0px); opacity: 0.6; }
          50% { opacity: 0.9; }
          100% { transform: translateY(-22px); opacity: 0.3; }
        }
        @keyframes orb-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(24px, -16px) scale(1.06); }
          66% { transform: translate(-12px, 18px) scale(0.96); }
        }
        @keyframes badge-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes success-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes confetti-fall {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(60px)  rotate(360deg); opacity: 0; }
        }
        @keyframes checkmark-draw {
          from { stroke-dashoffset: 40; }
          to   { stroke-dashoffset: 0; }
        }
        .waitlist-overlay-bg {
          background: radial-gradient(ellipse at 30% 20%, rgba(139,158,108,0.12) 0%, transparent 60%),
                      radial-gradient(ellipse at 75% 80%, rgba(26,35,50,0.15) 0%, transparent 55%),
                      #f5f4ef;
        }
      `}</style>

      {/* ── Overlay ── */}
      <div
        className="fixed inset-0 z-9999 flex items-center justify-center"
        style={{
          backdropFilter: "blur(2px)",
          background: "rgba(26, 35, 50, 0.72)",
        }}
      >
        {/* Background gradient orbs */}
        <div
          className="absolute w-130 h-130 rounded-full pointer-events-none"
          style={{
            top: "5%",
            left: "-8%",
            background:
              "radial-gradient(circle, rgba(139,158,108,0.18) 0%, transparent 70%)",
            animation: "orb-drift 14s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-100 h-100 rounded-full pointer-events-none"
          style={{
            bottom: "5%",
            right: "-6%",
            background:
              "radial-gradient(circle, rgba(139,158,108,0.12) 0%, transparent 70%)",
            animation: "orb-drift 18s ease-in-out infinite reverse",
          }}
        />

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <Particle
            key={i}
            style={{
              width: p.size,
              height: p.size,
              top: p.top,
              left: p.left,
              background: p.color,
              opacity: p.opacity,
              animation: `float-up ${p.duration} ease-in-out ${p.delay} infinite alternate`,
            }}
          />
        ))}

        {/* ── Card ── */}
        <div
          className="relative mx-4 w-full max-w-120 rounded-2xl overflow-hidden"
          style={{
            background: "#ffffff",
            boxShadow:
              "0 32px 80px rgba(26,35,50,0.28), 0 0 0 1px rgba(139,158,108,0.18)",
            animation: mounted
              ? "fade-in-up 0.55s cubic-bezier(0.22,1,0.36,1) both"
              : "none",
          }}
        >
          {/* Top accent bar */}
          <div
            className="h-1 w-full"
            style={{
              background:
                "linear-gradient(90deg, #8b9e6c 0%, #b5c99a 50%, #8b9e6c 100%)",
              backgroundSize: "200% 100%",
              animation: "badge-shimmer 3s linear infinite",
            }}
          />

          {/* Card content */}
          <div className="px-10 pt-10 pb-10">
            {status !== "success" ? (
              <>
                <LogoMark />

                {/* Badge */}
                <div className="flex justify-center mb-5">
                  <span
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
                    style={{
                      background: "rgba(139,158,108,0.1)",
                      color: "#6c7d50",
                      border: "1px solid rgba(139,158,108,0.3)",
                    }}
                  >
                    <SparkleIcon />
                    Private Beta · Coming Soon
                  </span>
                </div>

                {/* Headline */}
                <h1
                  className="text-center mb-3 leading-tight"
                  style={{
                    fontSize: "clamp(26px, 5vw, 34px)",
                    fontFamily: "var(--font-serif)",
                    fontWeight: 700,
                    color: "#1a2332",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Study smarter,
                  <br />
                  <span style={{ color: "#8b9e6c" }}>not harder.</span>
                </h1>

                {/* Subheadline */}
                <p
                  className="text-center mb-8 max-w-85 mx-auto"
                  style={{
                    fontSize: "15px",
                    color: "#5c6370",
                    lineHeight: 1.65,
                  }}
                >
                  Q-AI is an AI-powered study companion that transforms your
                  documents into flashcards, quizzes & personalised study plans.
                  Be the first to experience it.
                </p>

                {/* Divider */}
                <div
                  className="flex items-center gap-3 mb-6"
                  style={{ opacity: 0.35 }}
                >
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-text-muted font-medium uppercase tracking-widest">
                    Join the waitlist
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate>
                  <div className="flex gap-2.5">
                    <div className="relative flex-1">
                      <input
                        ref={inputRef}
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (status === "error") setStatus("idle");
                        }}
                        placeholder="your@email.com"
                        required
                        autoComplete="email"
                        disabled={status === "loading"}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        style={{
                          border: `1.5px solid ${status === "error" ? "#c0392b" : "rgba(26,35,50,0.14)"}`,
                          background: "#f9f8f5",
                          color: "#1a2332",
                          fontFamily: "var(--font-sans)",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#8b9e6c";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(139,158,108,0.15)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor =
                            status === "error"
                              ? "#c0392b"
                              : "rgba(26,35,50,0.14)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={status === "loading" || !email.trim()}
                      className="shrink-0 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background:
                          "linear-gradient(135deg, #1a2332 0%, #253045 100%)",
                        color: "#ffffff",
                        fontFamily: "var(--font-sans)",
                        boxShadow: "0 4px 14px rgba(26,35,50,0.25)",
                        minWidth: "110px",
                      }}
                      onMouseEnter={(e) => {
                        if (status !== "loading")
                          e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow =
                          "0 6px 20px rgba(26,35,50,0.32)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 14px rgba(26,35,50,0.25)";
                      }}
                    >
                      {status === "loading" ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="white"
                              strokeWidth="3"
                              opacity="0.25"
                            />
                            <path
                              d="M12 2A10 10 0 0 1 22 12"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          </svg>
                          Joining…
                        </span>
                      ) : (
                        "Get Early Access"
                      )}
                    </button>
                  </div>

                  {/* Error message */}
                  {status === "error" && (
                    <p
                      className="mt-2.5 text-xs text-center"
                      style={{ color: "#c0392b" }}
                    >
                      {errorMsg}
                    </p>
                  )}
                </form>

                {/* Footer note */}
                <p
                  className="mt-5 text-center text-xs"
                  style={{ color: "#9ca3af" }}
                >
                  No spam, ever. We'll only reach out when we're ready to
                  launch.&nbsp;🔒
                </p>

                {/* Social proof pills */}
                <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
                  {["AI-Powered", "Personalised", "Free to Start"].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: "rgba(139,158,108,0.08)",
                          color: "#6c7d50",
                          border: "1px solid rgba(139,158,108,0.2)",
                        }}
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              </>
            ) : (
              /* ── Success state ── */
              <div
                className="flex flex-col items-center py-4 text-center"
                style={{
                  animation: "fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
                }}
              >
                {/* Confetti dots */}
                <div className="relative mb-6">
                  {[
                    {
                      top: "-20px",
                      left: "calc(50% - 40px)",
                      color: "#8b9e6c",
                      delay: "0s",
                    },
                    {
                      top: "-16px",
                      left: "calc(50% + 24px)",
                      color: "#d4a843",
                      delay: "0.1s",
                    },
                    {
                      top: "-24px",
                      left: "calc(50% - 8px)",
                      color: "#1a2332",
                      delay: "0.05s",
                    },
                    {
                      top: "-18px",
                      left: "calc(50% + 52px)",
                      color: "#8b9e6c",
                      delay: "0.15s",
                    },
                    {
                      top: "-14px",
                      left: "calc(50% - 60px)",
                      color: "#d4a843",
                      delay: "0.2s",
                    },
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        background: c.color,
                        top: c.top,
                        left: c.left,
                        animation: `confetti-fall 1.2s ease-out ${c.delay} forwards`,
                      }}
                    />
                  ))}
                  <div
                    style={{
                      animation:
                        "success-pop 0.5s cubic-bezier(0.22,1,0.36,1) both",
                    }}
                  >
                    <CheckCircleIcon />
                  </div>
                </div>

                <h2
                  className="mb-2"
                  style={{
                    fontSize: "26px",
                    fontFamily: "var(--font-serif)",
                    fontWeight: 700,
                    color: "#1a2332",
                    letterSpacing: "-0.02em",
                  }}
                >
                  You're on the list! 🎉
                </h2>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#5c6370",
                    lineHeight: 1.65,
                    maxWidth: "300px",
                  }}
                >
                  We'll send you an exclusive invite as soon as Q-AI opens its
                  doors. Stay tuned — something incredible is coming.
                </p>

                <div
                  className="mt-6 px-5 py-2.5 rounded-full text-sm font-semibold"
                  style={{
                    background: "rgba(139,158,108,0.1)",
                    color: "#6c7d50",
                    border: "1px solid rgba(139,158,108,0.25)",
                  }}
                >
                  Welcome to the future of studying ✨
                </div>
              </div>
            )}
          </div>

          {/* Bottom dot-pattern accent */}
          <div
            className="h-10 w-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(139,158,108,0.12) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
        </div>
      </div>
    </>
  );
}
