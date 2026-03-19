import React, { useState } from "react";
import { useNavigate, useLoaderData } from "react-router";

import Button from "../../components/Button";
import SVGIcon from "../../components/SVGIcon";
import { useToast } from "../../hooks/useToast";
import { userApi, personaApi } from "../../trpc";
import { useInView } from "../../hooks/useInView";

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader() {
  try {
    const user = await userApi.me.query();
    if (user == null) return Response.redirect("/sign-in");
    const persona = await personaApi.get.query().catch(() => null);
    return { persona };
  } catch {
    return Response.redirect("/sign-in");
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type QuizAnswers = {
  info_entry?: string;
  processing_method?: string;
  logic_structure?: string;
  output_preference?: string;
  social_environment?: string;
  abstraction_level?: string;
  error_correction?: string;
};

type Question = {
  key: keyof QuizAnswers;
  title: string;
  options: {
    value: string;
    label: string;
    sub: string;
    icon: Parameters<typeof SVGIcon>[0]["name"];
  }[];
};

// ── Questions data ─────────────────────────────────────────────────────────────
const QUESTIONS: Question[] = [
  {
    key: "info_entry",
    title:
      "When you encounter a complex new concept for the first time, do you prefer to:",
    options: [
      {
        value: "visual",
        label: "See it in a diagram",
        sub: "Visual representation and spatial logic",
        icon: "lightbulb",
      },
      {
        value: "auditory",
        label: "Hear it explained in a story",
        sub: "Narrative and linguistic structure",
        icon: "mic",
      },
      {
        value: "text",
        label: "Read a detailed description",
        sub: "Written explanations and documentation",
        icon: "book",
      },
    ],
  },
  {
    key: "processing_method",
    title: "When you are trying to solve a difficult problem, do you:",
    options: [
      {
        value: "verbal",
        label: "Talk it out in your head",
        sub: "Verbal-linguistic thinking",
        icon: "message-square",
      },
      {
        value: "visual",
        label: "Visualize the moving parts",
        sub: "Visual-spatial thinking",
        icon: "analogy-cycle",
      },
    ],
  },
  {
    key: "logic_structure",
    title: "Do you prefer to understand the:",
    options: [
      {
        value: "global",
        label: "Big Picture first",
        sub: "The goal and purpose before details",
        icon: "globe",
      },
      {
        value: "sequential",
        label: "Small building blocks first",
        sub: "Learn pieces and see how they connect",
        icon: "list",
      },
    ],
  },
  {
    key: "output_preference",
    title: "To prove you have mastered a topic, would you rather:",
    options: [
      {
        value: "essay",
        label: "Write a long-form explanation",
        sub: "Written expression and organization",
        icon: "file",
      },
      {
        value: "model",
        label: "Build or diagram a model",
        sub: "Hands-on creation and visualization",
        icon: "analogy-cycle",
      },
      {
        value: "presentation",
        label: "Teach it to someone else",
        sub: "Verbal recall and simplification",
        icon: "sparkles",
      },
    ],
  },
  {
    key: "social_environment",
    title: 'Your best "Aha!" moments happen when you are:',
    options: [
      {
        value: "social",
        label: "Discussing with someone",
        sub: "Collaborative and conversational",
        icon: "message-square",
      },
      {
        value: "solitary",
        label: "Alone with time to think",
        sub: "Deep independent focus",
        icon: "lock",
      },
    ],
  },
  {
    key: "abstraction_level",
    title: "Are you more interested in:",
    options: [
      {
        value: "abstract",
        label: "The theory behind things",
        sub: "Why principles work and why they matter",
        icon: "sparkles",
      },
      {
        value: "concrete",
        label: "Practical real-world use",
        sub: "How to apply knowledge immediately",
        icon: "check",
      },
    ],
  },
  {
    key: "error_correction",
    title: "When you get something wrong, what helps most:",
    options: [
      {
        value: "example",
        label: "A worked example side-by-side",
        sub: "See the right approach in action",
        icon: "book",
      },
      {
        value: "explanation",
        label: "A clear explanation of why",
        sub: "Understand the concept behind the error",
        icon: "lightbulb",
      },
      {
        value: "retry",
        label: "Try again with a hint",
        sub: "Self-correction with a nudge",
        icon: "rotate-ccw",
      },
    ],
  },
];

// ── Mapping logic ─────────────────────────────────────────────────────────────
function mapToPersona(answers: Required<QuizAnswers>) {
  let learningStyle: "analogies" | "logic" | "visual" | "mixed" = "mixed";
  if (
    answers.info_entry === "visual" ||
    answers.processing_method === "visual"
  ) {
    learningStyle = "visual";
  } else if (answers.info_entry === "auditory") {
    learningStyle = "analogies";
  } else if (
    answers.info_entry === "text" ||
    answers.processing_method === "verbal"
  ) {
    learningStyle =
      answers.logic_structure === "global" ? "analogies" : "logic";
  }

  const problemSolving: "guided" | "direct" =
    answers.error_correction === "explanation" ? "direct" : "guided";

  const reviewStyle: "detailed" | "summary" =
    answers.abstraction_level === "abstract" ? "detailed" : "summary";

  return { learningStyle, problemSolving, reviewStyle };
}

// ── Option card ───────────────────────────────────────────────────────────────

function OptionCard({
  option,
  selected,
  onClick,
}: {
  option: Question["options"][number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl p-4 border-2 transition-all duration-200 flex items-center gap-4 group"
      style={{
        borderColor: selected ? "var(--color-info)" : "var(--color-border)",
        background: selected
          ? "rgba(139,158,108,0.09)"
          : "var(--color-bg-card)",
        outline: "none",
      }}
    >
      <div
        className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center transition-colors"
        style={{
          background: selected
            ? "rgba(139,158,108,0.2)"
            : "rgba(139,158,108,0.07)",
        }}
      >
        <SVGIcon
          name={option.icon}
          size={18}
          color={selected ? "var(--color-info)" : "var(--color-text-muted)"}
          strokeWidth={1.75}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text leading-snug">
          {option.label}
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          {option.sub}
        </p>
      </div>
      <div
        className="w-4 h-4 rounded-full border-2 shrink-0 transition-colors"
        style={{
          borderColor: selected ? "var(--color-info)" : "var(--color-border)",
          background: selected ? "var(--color-info)" : "transparent",
        }}
      />
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function PersonaQuizPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const heroSection = useInView();
  const { persona } = (useLoaderData() ?? {}) as {
    persona:
      | import("@src/db/schemas/LearningPersona.schema").ILearningPersonaSchema
      | null;
  };

  const initialAnswers: QuizAnswers =
    persona?.preferencesJson != null
      ? (persona.preferencesJson as QuizAnswers)
      : {};

  const [answers, setAnswers] = useState<QuizAnswers>(initialAnswers);
  const [submitting, setSubmitting] = useState(false);

  const totalQuestions = QUESTIONS.length;
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k as keyof QuizAnswers] != null,
  ).length;
  const progressPct = (answeredCount / totalQuestions) * 100;

  function pick(key: keyof QuizAnswers, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const unanswered = QUESTIONS.filter((q) => answers[q.key] == null);
    if (unanswered.length > 0) {
      toast.error(`Please answer all ${totalQuestions} questions.`);
      return;
    }

    setSubmitting(true);
    try {
      const { learningStyle, problemSolving, reviewStyle } = mapToPersona(
        answers as Required<QuizAnswers>,
      );

      function qa(questionKey: string) {
        const q = QUESTIONS.find((q) => q.key === questionKey)!;
        const val = answers[questionKey as keyof QuizAnswers]!;
        const opt = q.options.find((o) => o.value === val)!;
        return { question: q.title, answer: opt.label };
      }

      await personaApi.upsert.mutate({
        learningStyle,
        problemSolving,
        reviewStyle,
        infoEntry: qa("info_entry"),
        processingMethod: qa("processing_method"),
        logicStructure: qa("logic_structure"),
        outputPreference: qa("output_preference"),
        socialEnvironment: qa("social_environment"),
        abstractionLevel: qa("abstraction_level"),
        errorCorrection: qa("error_correction"),
        preferencesJson: answers,
      });

      toast.success(
        persona != null
          ? "Learning DNA updated!"
          : "Learning DNA saved! Your AI tutor is now personalized.",
      );
      navigate(persona != null ? "/settings" : "/dashboard");
    } catch {
      toast.error("Failed to save your Learning DNA. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="container mx-auto px-6 py-12 max-w-2xl space-y-10">
        {/* Hero */}
        <div
          ref={heroSection.ref}
          className={`text-center ${heroSection.inView ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(139,158,108,0.12)" }}
          >
            <SVGIcon
              name="dna"
              size={28}
              color="var(--color-info)"
              strokeWidth={1.5}
            />
          </div>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5"
            style={{
              background: "rgba(139,158,108,0.12)",
              color: "var(--color-info)",
            }}
          >
            {persona != null ? "Edit Your Profile" : "2-Minute Quiz"}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-text mb-4 leading-tight">
            {persona != null
              ? "Update Your Learning DNA"
              : "Decode Your Learning DNA"}
          </h1>
          <p
            className="text-base leading-relaxed max-w-lg mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {persona != null
              ? "Change any of your answers below — your AI tutor will adapt immediately."
              : `${totalQuestions} questions that let Q-Ai understand how your brain processes information — so every explanation feels like it was written just for you.`}
          </p>
        </div>

        {/* Progress bar */}
        <div>
          <div
            className="flex justify-between text-xs mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span>
              {answeredCount} of {totalQuestions} answered
            </span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--color-border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: "var(--color-info)",
              }}
            />
          </div>
        </div>

        {/* Quiz form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          {QUESTIONS.map((question, qi) => (
            <div key={question.key} className="space-y-4">
              <div className="flex items-start gap-3">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0 mt-0.5"
                  style={{
                    background: answers[question.key]
                      ? "rgba(139,158,108,0.15)"
                      : "var(--color-border)",
                    color: answers[question.key]
                      ? "var(--color-info)"
                      : "var(--color-text-muted)",
                  }}
                >
                  {qi + 1}
                </span>
                <h3 className="font-serif text-lg text-text leading-snug">
                  {question.title}
                </h3>
              </div>

              <div className="space-y-2.5 ml-9">
                {question.options.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    option={opt}
                    selected={answers[question.key] === opt.value}
                    onClick={() => pick(question.key, opt.value)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Submit */}
          <div
            className="rounded-xl p-6 text-center"
            style={{
              background: "rgba(139,158,108,0.07)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p
              className="text-sm mb-4"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Your profile will be used to shape every AI response — the
              phrasing, depth, and style of each explanation. You can retake
              this anytime from Settings.
            </p>
            <Button
              type="submit"
              variant="solid"
              size="md"
              disabled={submitting || answeredCount < totalQuestions}
              fullWidth
            >
              {submitting
                ? "Saving…"
                : persona != null
                  ? "Update My Learning DNA"
                  : "Save My Learning DNA"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PersonaQuizPage;
