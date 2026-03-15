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

// ─── Values ───────────────────────────────────────────────────────────────────

export const values = [
  {
    icon: "heart" as const,
    iconBg: "rgba(239,68,68,0.1)",
    iconColor: "#ef4444",
    borderColor: "#ef4444",
    glowColor: "rgba(239,68,68,0.07)",
    title: "Student-First Design",
    desc: "Every decision starts with one question: does this help a student understand? No feature ships unless it serves genuine learning.",
  },
  {
    icon: "shield" as const,
    iconBg: "rgba(139,158,108,0.12)",
    iconColor: "var(--color-accent-dark)",
    borderColor: "var(--color-accent)",
    glowColor: "rgba(139,158,108,0.06)",
    title: "Privacy by Default",
    desc: "Your materials are yours alone. They never leave your vault, never train external models, and are never shared — period.",
  },
  {
    icon: "brain" as const,
    iconBg: "rgba(74,127,165,0.12)",
    iconColor: "#4a7fa5",
    borderColor: "#4a7fa5",
    glowColor: "rgba(74,127,165,0.06)",
    title: "Genuine Understanding",
    desc: "We guide you toward the answer — we don't just hand it over. True learning means you can explain it back yourself.",
  },
];

// ─── Audiences ────────────────────────────────────────────────────────────────

export const audiences = [
  {
    icon: "cpu" as const,
    accentColor: "#4a7fa5",
    borderColor: "rgba(74,127,165,0.3)",
    bgGradient:
      "linear-gradient(140deg, rgba(74,127,165,0.1) 0%, rgba(74,127,165,0.02) 100%)",
    iconBg: "rgba(74,127,165,0.15)",
    label: "STEM Students",
    headline: "Master the unsolvable problems",
    desc: "Tackle derivations, proofs, and complex problem sets with step-by-step guided breakdowns drawn from your own lecture notes.",
    tags: ["Physics", "Calculus", "Chemistry", "CS"],
  },
  {
    icon: "book" as const,
    accentColor: "#d4a843",
    borderColor: "rgba(212,168,67,0.3)",
    bgGradient:
      "linear-gradient(140deg, rgba(212,168,67,0.1) 0%, rgba(212,168,67,0.02) 100%)",
    iconBg: "rgba(212,168,67,0.15)",
    label: "Law Students",
    headline: "Cut through legal complexity",
    desc: "Digest dense case law, statutes, and legal theory through your uploaded materials — not a generic summary from the web.",
    tags: ["Case Law", "Contracts", "Torts", "Constitutional"],
  },
  {
    icon: "heart" as const,
    accentColor: "#ef4444",
    borderColor: "rgba(239,68,68,0.25)",
    bgGradient:
      "linear-gradient(140deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.01) 100%)",
    iconBg: "rgba(239,68,68,0.12)",
    label: "Medical Students",
    headline: "Make biology click",
    desc: "Master anatomy, pharmacology, and pathophysiology with analogy-driven explanations tailored to your curriculum.",
    tags: ["Anatomy", "Pharmacology", "Pathology", "Biochem"],
  },
];
