import React, { useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router";

import Button from "../../components/Button";
import SVGIcon from "../../components/SVGIcon";
import { useToast } from "../../hooks/useToast";
import { userApi, personaApi } from "../../trpc";
import { useInView } from "../../hooks/useInView";
import FormField from "../../components/FormField";
import type { IUserPublic } from "@src/db/schemas/User.schema";
import type { ILearningPersonaSchema } from "@src/db/schemas/LearningPersona.schema";

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader() {
  const [user, persona] = await Promise.all([
    userApi.me.query(),
    personaApi.get.query().catch(() => null),
  ]);
  if (user == null) return Response.redirect("/sign-in");
  return { user, persona };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEARNING_STYLE_LABELS: Record<string, string> = {
  analogies: "Analogies & Examples",
  logic: "First-Principles Logic",
  visual: "Visual & Spatial",
  mixed: "Adaptive Mix",
};

const PROBLEM_SOLVING_LABELS: Record<string, string> = {
  guided: "Guided Questions (Socratic)",
  direct: "Direct Explanations",
};

const REVIEW_STYLE_LABELS: Record<string, string> = {
  detailed: "Deep-dive Detail",
  summary: "Concise Summaries",
};

// ── Section wrapper used consistently across all cards ────────────────────────

function SectionCard(props: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor?: string;
  title: string;
  children: React.ReactNode;
}) {
  const { icon, iconBg, title, children } = props;
  return (
    <div
      className="bg-bg-card rounded-xl border border-border p-6 md:p-8"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        <h2 className="font-serif text-xl text-text">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function SettingsPage() {
  const { user, persona } = useLoaderData<typeof loader>() as {
    user: IUserPublic;
    persona: ILearningPersonaSchema | null;
  };

  const toast = useToast();
  const navigate = useNavigate();
  const headerSection = useInView();

  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await userApi.updateUser.mutate({ id: user.id, name, email });
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "This will permanently delete your account and all data. This cannot be undone. Continue?",
    );
    if (confirmed === false) {
      return;
    }
    try {
      await userApi.deleteUser.mutate({ id: user.id });
      await userApi.signOut.mutate();
      navigate("/");
    } catch {
      toast.error("Failed to delete account");
    }
  }

  const isPremium = user.subscriptionTier === "premium";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="container mx-auto px-6 py-4 max-w-3xl space-y-8">
        {/* Header */}
        <div
          ref={headerSection.ref}
          className={headerSection.inView ? "animate-fade-in-up" : "opacity-0"}
        >
          <h1 className="font-serif text-4xl md:text-5xl text-text mb-2">
            Settings
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Manage your account, learning preferences, and subscription.
          </p>
        </div>

        {/* ── Account ───────────────────────────────────────────────────────── */}
        <SectionCard
          icon={<SVGIcon name="user" size={20} color="var(--color-info)" />}
          iconBg="rgba(139,158,108,0.13)"
          title="Account"
        >
          <form onSubmit={handleSaveAccount} className="space-y-5">
            <FormField
              label="Full Name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Button type="submit" variant="solid" size="md" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </SectionCard>

        {/* ── Learning DNA ──────────────────────────────────────────────────── */}
        <SectionCard
          icon={<SVGIcon name="dna" size={20} color="var(--color-info)" />}
          iconBg="rgba(139,158,108,0.13)"
          title="Learning DNA"
        >
          <p
            className="text-sm mb-5 leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Q-Ai uses your learning profile to adapt every explanation — the way
            it teaches you is shaped by <strong>how you think</strong>, not just
            what you ask.
          </p>

          {persona == null ? (
            <div
              className="rounded-xl border-2 border-dashed p-6 flex flex-col items-center text-center gap-4"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(139,158,108,0.12)" }}
              >
                <SVGIcon name="dna" size={22} color="var(--color-info)" />
              </div>
              <div>
                <p className="font-semibold text-text mb-1">
                  No learning profile yet
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Take the 2-minute quiz to unlock AI explanations tailored to
                  you.
                </p>
              </div>
              <Link to="/persona-quiz">
                <Button variant="solid" size="md">
                  Take the Learning DNA Quiz
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  label: "Learning Style",
                  value:
                    LEARNING_STYLE_LABELS[persona.learningStyle] ??
                    persona.learningStyle,
                },
                {
                  label: "Problem Solving",
                  value: persona.problemSolving
                    ? PROBLEM_SOLVING_LABELS[persona.problemSolving]
                    : "—",
                },
                {
                  label: "Review Preference",
                  value: persona.reviewStyle
                    ? REVIEW_STYLE_LABELS[persona.reviewStyle]
                    : "—",
                },
                {
                  label: "Info Intake",
                  value: persona.infoEntry?.answer ?? "—",
                },
                {
                  label: "Processing Method",
                  value: persona.processingMethod?.answer ?? "—",
                },
                {
                  label: "Logic Structure",
                  value: persona.logicStructure?.answer ?? "—",
                },
                {
                  label: "Output Preference",
                  value: persona.outputPreference?.answer ?? "—",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg px-4 py-3"
                  style={{
                    background: "rgba(139,158,108,0.07)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <span className="text-sm font-medium text-text">{label}</span>
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {value}
                  </span>
                </div>
              ))}
              <div className="pt-2">
                <Link
                  to="/persona-quiz"
                  className="text-sm font-medium no-underline"
                  style={{ color: "var(--color-info)" }}
                >
                  Retake quiz →
                </Link>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Subscription ──────────────────────────────────────────────────── */}
        <SectionCard
          icon={<SVGIcon name="zap" size={20} color="#b8893a" />}
          iconBg="rgba(212,168,67,0.13)"
          title="Subscription"
        >
          <div
            className="rounded-xl p-5 mb-5"
            style={{
              background: isPremium
                ? "rgba(212,168,67,0.07)"
                : "rgba(139,158,108,0.07)",
              border: `1px solid ${isPremium ? "rgba(212,168,67,0.3)" : "var(--color-border)"}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg text-text mb-0.5">
                  {isPremium ? "Premium Plan" : "Free Plan"}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {isPremium
                    ? "Unlimited vaults · Video processing · Voice study"
                    : "2 Course Vaults · 50 MB limit · Text only"}
                </p>
              </div>
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  background: isPremium
                    ? "rgba(212,168,67,0.15)"
                    : "rgba(139,158,108,0.15)",
                  color: isPremium ? "#b8893a" : "var(--color-info)",
                }}
              >
                {isPremium ? "Premium" : "Free"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-5">
              {(isPremium
                ? [
                    "Unlimited Vaults",
                    "Video-to-text processing",
                    "Voice Study mode",
                    "Exam Predictor",
                  ]
                : [
                    "2 Course Vaults",
                    "50 MB upload limit",
                    "Text-based learning",
                  ]
              ).map((feat) => (
                <div
                  key={feat}
                  className="flex items-center gap-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <SVGIcon name="check" size={14} color="var(--color-info)" />
                  {feat}
                </div>
              ))}
            </div>

            {!isPremium && (
              <Button variant="solid" size="md" fullWidth>
                Upgrade to Premium — $24.99/mo
              </Button>
            )}
          </div>
        </SectionCard>

        {/* ── Privacy & Security ────────────────────────────────────────────── */}
        <SectionCard
          icon={<SVGIcon name="shield" size={20} color="var(--color-info)" />}
          iconBg="rgba(139,158,108,0.13)"
          title="Privacy & Security"
        >
          <div className="space-y-3">
            <div
              className="flex items-center justify-between rounded-lg px-4 py-3"
              style={{
                background: "rgba(139,158,108,0.07)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div>
                <p className="text-sm font-medium text-text">Change Password</p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Update your account password
                </p>
              </div>
              <Button variant="outline-accent" size="sm">
                Change
              </Button>
            </div>

            <div
              className="flex items-center justify-between rounded-lg px-4 py-3"
              style={{
                background: "rgba(139,158,108,0.07)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div>
                <p className="text-sm font-medium text-text">
                  Download My Data
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Export all your vaults and materials
                </p>
              </div>
              <Button variant="outline-accent" size="sm">
                Download
              </Button>
            </div>

            <div
              className="flex items-center justify-between rounded-lg px-4 py-3"
              style={{
                background: "rgba(239,68,68,0.05)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "#b91c1c" }}>
                  Delete Account
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "rgba(185,28,28,0.7)" }}
                >
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteAccount}
                style={{ color: "#dc2626", borderColor: "rgba(220,38,38,0.4)" }}
              >
                Delete
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default SettingsPage;
