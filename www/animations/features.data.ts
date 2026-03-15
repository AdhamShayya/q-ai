// ─── Particles ────────────────────────────────────────────────────────────────

export const PARTICLES = Array.from({ length: 28 }, (_, i) => {
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

export const GHOST_WORDS = ["LEARN", "MASTER", "FOCUS", "RETAIN", "EXCEL"];
export const GHOST_CONFIG = [
  { left: "-2%", top: "8%", pSpeed: 0.14, reverse: false },
  { left: "25%", top: "20%", pSpeed: 0.08, reverse: true },
  { left: "56%", top: "5%", pSpeed: 0.18, reverse: false },
  { left: "72%", top: "38%", pSpeed: 0.06, reverse: true },
  { left: "8%", top: "55%", pSpeed: 0.11, reverse: false },
];

// ─── Stats ────────────────────────────────────────────────────────────────────

export const stats = [
  {
    icon: "users-group" as const,
    iconBg: "rgba(139,158,108,0.14)",
    iconColor: "var(--color-accent-dark)",
    value: 12400,
    suffix: "+",
    label: "Students Helped",
  },
  {
    icon: "graduation-cap" as const,
    iconBg: "rgba(74,127,165,0.14)",
    iconColor: "#4a7fa5",
    value: 60,
    suffix: "+",
    label: "Universities",
  },
  {
    icon: "star" as const,
    iconBg: "rgba(212,168,67,0.14)",
    iconColor: "#d4a843",
    value: 97,
    suffix: "%",
    label: "Satisfaction Rate",
  },
  {
    icon: "file" as const,
    iconBg: "rgba(139,158,108,0.14)",
    iconColor: "var(--color-accent-dark)",
    value: 248000,
    suffix: "+",
    label: "Documents Analyzed",
  },
];

// ─── Pillars ──────────────────────────────────────────────────────────────────

export const pillars = [
  {
    icon: "shield" as const,
    accentColor: "var(--color-accent-dark)",
    borderColor: "rgba(139,158,108,0.3)",
    bgGradient:
      "linear-gradient(140deg, rgba(139,158,108,0.1) 0%, rgba(139,158,108,0.02) 100%)",
    iconBg: "rgba(139,158,108,0.15)",
    number: "01",
    title: "The Knowledge Vault",
    description:
      "A RAG-driven system where the AI's intelligence is tethered strictly to your uploaded materials. It doesn't just give general facts — it gives your professor's facts.",
    bullets: [
      "Upload PDFs, documents, and lecture videos",
      "Private, secure storage per course",
      "Video transcription for searchable content",
    ],
  },
  {
    icon: "dna" as const,
    accentColor: "#d4a843",
    borderColor: "rgba(212,168,67,0.3)",
    bgGradient:
      "linear-gradient(140deg, rgba(212,168,67,0.1) 0%, rgba(212,168,67,0.02) 100%)",
    iconBg: "rgba(212,168,67,0.15)",
    number: "02",
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
    icon: "mic" as const,
    accentColor: "#4a7fa5",
    borderColor: "rgba(74,127,165,0.3)",
    bgGradient:
      "linear-gradient(140deg, rgba(74,127,165,0.1) 0%, rgba(74,127,165,0.02) 100%)",
    iconBg: "rgba(74,127,165,0.15)",
    number: "03",
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

// ─── Standouts ────────────────────────────────────────────────────────────────

export const standouts = [
  {
    icon: "lightbulb" as const,
    accentColor: "var(--color-accent-dark)",
    iconBg: "rgba(139,158,108,0.12)",
    borderColor: "rgba(139,158,108,0.25)",
    title: "Specialization Over Generalization",
    description:
      "Focused on your specific course materials, not the entire internet. This means more accurate, relevant answers.",
  },
  {
    icon: "sparkles" as const,
    accentColor: "#d4a843",
    iconBg: "rgba(212,168,67,0.12)",
    borderColor: "rgba(212,168,67,0.25)",
    title: "Empathetic Expert Persona",
    description:
      "Think of Q-Ai as a patient older sibling — supportive, understanding, and always there when you need help studying.",
  },
  {
    icon: "shield" as const,
    accentColor: "#4a7fa5",
    iconBg: "rgba(74,127,165,0.12)",
    borderColor: "rgba(74,127,165,0.25)",
    title: "Privacy First",
    description:
      "Your Study Vault is secure and private. Your materials stay yours, and are never used for training other models.",
  },
  {
    icon: "book" as const,
    accentColor: "var(--color-accent-dark)",
    iconBg: "rgba(139,158,108,0.12)",
    borderColor: "rgba(139,158,108,0.25)",
    title: "Built for College Students",
    description:
      "Designed specifically for stressed students tackling hard subjects like STEM, Law, and Medicine.",
  },
];

// ─── Core features ────────────────────────────────────────────────────────────

export const coreFeatures = [
  {
    icon: "analogy-cycle" as const,
    accentColor: "var(--color-accent-dark)",
    iconBg: "rgba(139,158,108,0.12)",
    borderColor: "rgba(139,158,108,0.25)",
    bgGradient:
      "linear-gradient(140deg, rgba(139,158,108,0.07) 0%, transparent 70%)",
    title: "Personalized Learning",
    description:
      'Every explanation is tailored to your learning style and perspective. Experience the "Magic Moment" when complex concepts finally click through personalized analogies and step-by-step guidance.',
  },
  {
    icon: "mic" as const,
    accentColor: "#d4a843",
    iconBg: "rgba(212,168,67,0.12)",
    borderColor: "rgba(212,168,67,0.25)",
    bgGradient:
      "linear-gradient(140deg, rgba(212,168,67,0.07) 0%, transparent 70%)",
    title: "Interactive Call Explanation",
    description:
      "Have real-time conversations with your course material. Ask questions, get clarifications, and work through problems — just like a tutor sitting next to you.",
  },
  {
    icon: "file" as const,
    accentColor: "#4a7fa5",
    iconBg: "rgba(74,127,165,0.12)",
    borderColor: "rgba(74,127,165,0.25)",
    bgGradient:
      "linear-gradient(140deg, rgba(74,127,165,0.07) 0%, transparent 70%)",
    title: "Customized Answers Based on Material",
    description:
      "Answers are derived directly from your uploaded materials, ensuring accuracy and relevance. The AI references your professor's specific terminology and context, not generic internet knowledge.",
  },
  {
    icon: "check" as const,
    accentColor: "var(--color-accent-dark)",
    iconBg: "rgba(139,158,108,0.12)",
    borderColor: "rgba(139,158,108,0.25)",
    bgGradient:
      "linear-gradient(140deg, rgba(139,158,108,0.07) 0%, transparent 70%)",
    title: "Academic Integrity First",
    description:
      "We're a tutor, not a homework solver. Q-Ai encourages deep understanding through scaffolding and Socratic questioning, guiding you to the answer rather than just providing it.",
  },
];
