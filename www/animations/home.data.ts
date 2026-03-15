import type { FeatureCardData } from "../components/FeatureCard";

// ─── Particles ────────────────────────────────────────────────────────────────

export const PARTICLES = Array.from({ length: 32 }, (_, i) => {
  const h = (i * 2654435761) >>> 0;
  return {
    left: `${h % 97}%`,
    delay: `${(h >> 4) % 14}s`,
    duration: `${11 + ((h >> 8) % 10)}s`,
    size: 3 + ((h >> 12) % 4),
    colorIdx: i % 3,
  };
});

export const PARTICLE_COLORS = [
  "rgba(139,158,108,0.65)",
  "rgba(212,168,67,0.55)",
  "rgba(74,127,165,0.5)",
];

// ─── Ghost words ──────────────────────────────────────────────────────────────

export const GHOST_WORDS = ["UNDERSTAND", "FOCUS", "MASTER", "RETAIN", "EXCEL"];
export const GHOST_CONFIG = [
  { left: "-2%", top: "8%", pSpeed: 0.14, reverse: false },
  { left: "22%", top: "24%", pSpeed: 0.08, reverse: true },
  { left: "54%", top: "5%", pSpeed: 0.18, reverse: false },
  { left: "70%", top: "40%", pSpeed: 0.06, reverse: true },
  { left: "8%", top: "58%", pSpeed: 0.11, reverse: false },
];

// ─── Orbit rings ─────────────────────────────────────────────────────────────

export const ORBIT_RINGS = [
  {
    size: 640,
    cw: true,
    dur: 38,
    border: "rgba(139,158,108,0.11)",
    dot: "var(--color-accent)",
    dotPos: "left",
  },
  {
    size: 460,
    cw: false,
    dur: 25,
    border: "rgba(212,168,67,0.11)",
    dot: "#d4a843",
    dotPos: "top",
  },
  {
    size: 300,
    cw: true,
    dur: 15,
    border: "rgba(74,127,165,0.14)",
    dot: "#4a7fa5",
    dotPos: "right",
  },
];

// ─── Marquee ──────────────────────────────────────────────────────────────────

export const MARQUEE_ITEMS = [
  { icon: "shield" as const, text: "Answers only from YOUR materials" },
  { icon: "lock" as const, text: "Privacy-first by design" },
  { icon: "dna" as const, text: "Adapts to your learning style" },
  { icon: "book" as const, text: "STEM · Law · Medicine and more" },
  { icon: "sparkles" as const, text: "AI explanations in plain English" },
  { icon: "upload" as const, text: "Upload PDFs, slides and notes instantly" },
  { icon: "globe" as const, text: "60+ universities worldwide" },
  { icon: "zap" as const, text: "Instant step-by-step breakdowns" },
];

// ─── DNA Pillars ──────────────────────────────────────────────────────────────

export const DNA_PILLARS = [
  {
    icon: "dna" as const,
    iconBg: "rgba(139,158,108,0.12)",
    iconColor: "var(--color-accent-dark)",
    accent: "var(--color-accent)",
    delay: 100,
    title: "Your Learning DNA",
    desc: "A 2-minute quiz maps how your brain processes information — visual or verbal, big-picture or detail-first, Socratic or direct. Q-Ai adjusts its tone, analogies, and depth to match your exact cognitive style.",
    cta: "Take the Learning DNA Quiz",
    ctaColor: "var(--color-accent-dark)",
  },
  {
    icon: "book" as const,
    iconBg: "rgba(212,168,67,0.12)",
    iconColor: "#b8893a",
    accent: "var(--color-warning)",
    delay: 220,
    title: "Your Course Materials",
    desc: "Every answer is pulled exclusively from your uploaded documents — your professor's slides, textbooks, and notes. Q-Ai never guesses or invents; it teaches from your source of truth.",
    cta: "Upload Your First Vault",
    ctaColor: "#b8893a",
  },
];

// ─── Features ─────────────────────────────────────────────────────────────────

export const FEATURES: FeatureCardData[] = [
  {
    icon: "lightbulb",
    iconBg: "rgba(139,158,108,0.13)",
    iconColor: "var(--color-accent-dark)",
    accentColor: "var(--color-accent)",
    title: "Concept Breakdown",
    description:
      "Complex ideas distilled into digestible pieces so nothing feels overwhelming.",
  },
  {
    icon: "list",
    iconBg: "rgba(212,168,67,0.13)",
    iconColor: "#b8893a",
    accentColor: "var(--color-warning)",
    title: "Smart Summaries",
    description:
      "Key points highlighted from your own materials for efficient, focused review.",
  },
  {
    icon: "sparkles",
    iconBg: "rgba(74,127,165,0.13)",
    iconColor: "#4a7fa5",
    accentColor: "var(--color-info)",
    title: "Time-Saving",
    description:
      "More learning in less time — study smarter and walk into exams confident.",
  },
];

// ─── Steps ────────────────────────────────────────────────────────────────────

export const STEPS = [
  {
    number: "01",
    icon: "upload" as const,
    iconBg: "rgba(139,158,108,0.12)",
    iconColor: "var(--color-accent-dark)",
    accent: "var(--color-accent)",
    title: "Upload Your Materials",
    desc: "Drop in your lecture slides, textbook chapters, or study notes. Q-Ai indexes them instantly into your private vault.",
  },
  {
    number: "02",
    icon: "dna" as const,
    iconBg: "rgba(212,168,67,0.12)",
    iconColor: "#d4a843",
    accent: "var(--color-warning)",
    title: "Map Your Learning DNA",
    desc: "A 2-minute quiz captures how you think — visual or verbal, detail-first or big-picture — so Q-Ai adapts its teaching style to you.",
  },
  {
    number: "03",
    icon: "sparkles" as const,
    iconBg: "rgba(74,127,165,0.12)",
    iconColor: "#4a7fa5",
    accent: "var(--color-info)",
    title: "Ask, Learn, Understand",
    desc: "Chat with Q-Ai about anything from your materials. Get explanations, summaries, and guided breakdowns — personalized to you.",
  },
];

// ─── Dark stats ───────────────────────────────────────────────────────────────

export const DARK_STATS = [
  { value: 12400, suffix: "+", label: "Students Helped" },
  { value: 60, suffix: "+", label: "Universities" },
  { value: 97, suffix: "%", label: "Satisfaction" },
  { value: 248000, suffix: "+", label: "Docs Analyzed" },
];

// ─── Sample steps ─────────────────────────────────────────────────────────────

export const SAMPLE_STEPS = [
  'Wave-particle duality isn\'t as confusing when we think of light as having different "moods"',
  "The uncertainty principle is like trying to measure a soap bubble without popping it",
  "Quantum superposition makes more sense if we imagine a spinning coin before it lands",
];

// ─── Trust pills ──────────────────────────────────────────────────────────────

export const TRUST_PILLS = [
  "12,400+ students",
  "97% satisfaction",
  "Zero data sharing",
];

// ─── Nav links ────────────────────────────────────────────────────────────────

export const NAV_LINKS = [
  { to: "/features", label: "Features" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/sign-in", label: "Sign In" },
];
