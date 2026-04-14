import React, { useState, useEffect } from "react";
import { useLoaderData } from "react-router";

import type { Serialised } from "../../shared";
import { userApi, vaultApi, studyPlannerApi } from "../../trpc";
import type { IVaultSchema } from "@src/db/schemas/Vault.schema";

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader() {
  const user = await userApi.me.query();
  if (user == null) return Response.redirect("/sign-in");
  const vaults = await vaultApi.listByUser.query({ userId: user.id });
  return { userId: user.id, vaults };
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface StudyTopic {
  documentName: string;
  documentId: string;
  estimatedMinutes: number;
  type: "reading" | "practice" | "review";
  priority: "high" | "medium" | "low";
}

interface StudyDay {
  date: string;
  dayNumber: number;
  totalMinutes: number;
  topics: StudyTopic[];
  note?: string;
}

interface StudyPlanData {
  days: StudyDay[];
  totalDays: number;
  totalStudyHours: number;
  examDate: string;
  vaultName: string;
  learningStyle: string;
  summary: string;
}

interface StudyPlan {
  id: string;
  planJson: StudyPlanData;
  examDate: string;
  dailyHours: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HOUR_OPTIONS = [1, 2, 3, 4, 5, 6, 8] as const;
type HourOption = (typeof HOUR_OPTIONS)[number];

const TYPE_CONFIG: Record<
  string,
  { icon: string; label: string; color: string }
> = {
  reading: { icon: "📖", label: "Reading", color: "#6366f1" },
  practice: { icon: "✏️", label: "Practice", color: "#f59e0b" },
  review: { icon: "🔄", label: "Review", color: "#22c55e" },
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const STYLE_LABEL: Record<string, string> = {
  visual: "Visual",
  logic: "Logical",
  analogies: "Analogical",
  mixed: "Mixed",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Aggregate per-document total minutes across all plan days */
function buildDocSummary(
  days: StudyDay[],
): { id: string; name: string; minutes: number; isReview: boolean }[] {
  const map = new Map<
    string,
    { id: string; name: string; minutes: number; isReview: boolean }
  >();
  for (const day of days) {
    for (const topic of day.topics) {
      const prev = map.get(topic.documentId);
      if (prev) {
        prev.minutes += topic.estimatedMinutes;
      } else {
        map.set(topic.documentId, {
          id: topic.documentId,
          name: topic.documentName,
          minutes: topic.estimatedMinutes,
          isReview: topic.type === "review",
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => b.minutes - a.minutes);
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

function isPast(dateStr: string): boolean {
  const d = new Date(dateStr);
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return d < n;
}

// ── Day card ──────────────────────────────────────────────────────────────────

function DayCard({
  day,
  defaultOpen,
}: {
  day: StudyDay;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const today = isToday(day.date);
  const past = isPast(day.date);
  const isReview = day.topics.every((t) => t.type === "review");

  const displayDate = new Date(day.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--color-surface)",
        border: `1.5px solid ${
          today ? "var(--ai-accent)" : "var(--color-border)"
        }`,
        opacity: past && !today ? 0.5 : 1,
        boxShadow: today
          ? "0 0 0 3px color-mix(in srgb, var(--ai-accent) 12%, transparent)"
          : "none",
      }}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left bg-primary/70 rounded-none"
      >
        {/* Day number */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            background: today
              ? "var(--ai-accent)"
              : isReview
                ? "color-mix(in srgb, #6366f1 18%, transparent)"
                : "color-mix(in srgb, var(--color-text) 8%, transparent)",
            color: "#fff",
          }}
        >
          {day.dayNumber}
        </div>

        {/* Date + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{displayDate}</span>
            {today && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "var(--ai-accent)", color: "#fff" }}
              >
                TODAY
              </span>
            )}
            {isReview && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: "color-mix(in srgb, #6366f1 15%, transparent)",
                }}
              >
                Review
              </span>
            )}
          </div>
          {day.note && (
            <p
              className="text-xs mt-0.5 truncate"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {day.note}
            </p>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px]">
            {day.topics.length} topic{day.topics.length !== 1 ? "s" : ""}
          </span>
          <span className="text-sm font-bold">{fmt(day.totalMinutes)}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="transition-transform duration-200"
            style={{
              transform: open ? "rotate(180deg)" : "none",
            }}
          >
            <path
              d="M2.5 5L7 9.5L11.5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* Expanded topics */}
      {open && (
        <div
          className="flex flex-col gap-1.5 px-4 pb-4 pt-2 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          {day.topics.map((topic, i) => {
            const cfg = TYPE_CONFIG[topic.type] ?? TYPE_CONFIG["reading"]!;
            const pct = Math.round(
              (topic.estimatedMinutes / day.totalMinutes) * 100,
            );
            return (
              <div
                key={i}
                className="flex flex-col gap-1.5 py-2 px-3 rounded-xl"
                style={{
                  background:
                    "color-mix(in srgb, var(--color-text) 4%, transparent)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm shrink-0">{cfg.icon}</span>
                  <p
                    className="text-xs flex-1 truncate font-medium"
                    style={{ color: "var(--color-text)" }}
                    title={topic.documentName}
                  >
                    {topic.documentName}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: PRIORITY_COLOR[topic.priority] ?? "#999",
                      }}
                    />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {fmt(topic.estimatedMinutes)}
                    </span>
                  </div>
                </div>
                {/* Proportional time bar */}
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: "var(--color-border)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: cfg.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudyPlannerPage() {
  const { userId, vaults } = useLoaderData<typeof loader>() as {
    userId: string;
    vaults: Serialised<IVaultSchema>[];
  };

  const [selectedVaultId, setSelectedVaultId] = useState(vaults[0]?.id ?? "");
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState<HourOption>(2);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0]!;
  })();

  useEffect(() => {
    if (selectedVaultId === "") return;
    setLoadingExisting(true);
    studyPlannerApi.get
      .query({ vaultId: selectedVaultId, userId })
      .then((existing) => {
        if (existing == null) {
          setPlan(null);
        } else {
          const p = existing as StudyPlan;
          setPlan(p);
          setDailyHours((p.dailyHours as HourOption) ?? 2);
          setExamDate(new Date(p.examDate).toISOString().split("T")[0] ?? "");
        }
      })
      .catch(() => setPlan(null))
      .finally(() => setLoadingExisting(false));
  }, [selectedVaultId]);

  async function handleGenerate() {
    if (generating || examDate === "" || selectedVaultId === "") return;
    setGenerating(true);
    try {
      const result = await studyPlannerApi.create.mutate({
        vaultId: selectedVaultId,
        userId,
        examDate,
        dailyHours,
      });
      setPlan(result as StudyPlan);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
      return;
    }
    await studyPlannerApi.delete.mutate({ vaultId: selectedVaultId, userId });
    setPlan(null);
    setExamDate("");
    setDeleteConfirm(false);
  }

  const planData = plan?.planJson ?? null;
  const todayIndex = planData?.days.findIndex((d) => isToday(d.date)) ?? -1;
  const daysLeft = planData ? daysUntil(planData.examDate) : null;
  const docSummary = planData ? buildDocSummary(planData.days) : [];
  const totalDocMins = docSummary.reduce((s, d) => s + d.minutes, 0);
  const canGenerate = examDate !== "" && selectedVaultId !== "" && !generating;

  return (
    <main className="min-h-[80vh] px-4 py-10 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{
            background: "color-mix(in srgb, var(--ai-accent) 15%, transparent)",
          }}
        >
          📅
        </div>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            AI Study Planner
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Personalised day-by-day schedule — time per document scales with its
            size &amp; content.
          </p>
        </div>
      </div>

      {/* ── Config card ── */}
      <div
        className="rounded-2xl p-6 mb-8"
        style={{
          background: "var(--color-surface)",
          border: "1.5px solid var(--color-border)",
        }}
      >
        {/* Vault pills */}
        {vaults.length > 0 && (
          <div className="mb-5">
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Vault
            </p>
            <div className="flex flex-wrap gap-2">
              {vaults.map((v) => {
                const active = v.id === selectedVaultId;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVaultId(v.id)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: active
                        ? "var(--ai-accent)"
                        : "color-mix(in srgb, var(--color-text) 6%, transparent)",
                      color: active ? "#fff" : "var(--color-text-secondary)",
                      border: `1.5px solid ${
                        active ? "var(--ai-accent)" : "var(--color-border)"
                      }`,
                    }}
                  >
                    {v.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Exam date */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Exam date
            </label>
            <input
              type="date"
              min={minDate}
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm outline-none w-full"
              style={{
                background:
                  "color-mix(in srgb, var(--color-text) 4%, transparent)",
                border: `1.5px solid ${
                  examDate ? "var(--ai-accent)" : "var(--color-border)"
                }`,
                color: "var(--color-text)",
              }}
            />
          </div>

          {/* Daily hours — segment buttons */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Daily study time
            </label>
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ border: "1.5px solid var(--color-border)" }}
            >
              {HOUR_OPTIONS.map((h) => (
                <button
                  key={h}
                  onClick={() => setDailyHours(h)}
                  className="flex-1 py-2.5 text-xs font-semibold transition-colors"
                  style={{
                    background:
                      dailyHours === h ? "var(--ai-accent)" : "transparent",
                    color:
                      dailyHours === h ? "#fff" : "var(--color-text-secondary)",
                  }}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex gap-3 mt-5 pt-5 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "var(--ai-accent)",
              color: "#fff",
              opacity: canGenerate ? 1 : 0.5,
            }}
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Building…
              </>
            ) : (
              <>{plan ? "Regenerate plan" : "Build my plan"}</>
            )}
          </button>
          {plan && (
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: deleteConfirm ? "#ef444422" : "transparent",
                border: `1.5px solid ${
                  deleteConfirm ? "#ef4444" : "var(--color-border)"
                }`,
                color: deleteConfirm
                  ? "#ef4444"
                  : "var(--color-text-secondary)",
              }}
            >
              {deleteConfirm ? "Confirm clear" : "Clear plan"}
            </button>
          )}
        </div>
      </div>

      {/* ── Loading ── */}
      {loadingExisting && (
        <div className="flex justify-center py-14">
          <span className="w-7 h-7 border-2 border-border border-t-(--ai-accent) rounded-full animate-spin" />
        </div>
      )}

      {/* ── Plan view ── */}
      {!loadingExisting && planData != null && (
        <div className="flex flex-col gap-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Days left",
                value: Math.max(0, daysLeft ?? 0),
                sub: "until exam",
              },
              {
                label: "Study hours",
                value: `${planData.totalStudyHours}h`,
                sub: "total",
              },
              {
                label: "Study days",
                value: planData.days.length,
                sub: "scheduled",
              },
              {
                label: "Style",
                value:
                  STYLE_LABEL[planData.learningStyle] ?? planData.learningStyle,
                sub: "learning profile",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-4 flex flex-col gap-1"
                style={{
                  background: "var(--color-surface)",
                  border: "1.5px solid var(--color-border)",
                }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {s.label}
                </p>
                <p
                  className="text-xl font-bold leading-none"
                  style={{ color: "var(--ai-accent)" }}
                >
                  {s.value}
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {s.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Summary callout */}
          <div
            className="rounded-2xl px-5 py-4 text-sm leading-relaxed"
            style={{
              background:
                "color-mix(in srgb, var(--ai-accent) 8%, transparent)",
              border:
                "1.5px solid color-mix(in srgb, var(--ai-accent) 22%, transparent)",
              color: "var(--color-text)",
            }}
          >
            {planData.summary}
          </div>

          {/* Document time allocation */}
          {docSummary.length > 0 && (
            <div
              className="rounded-2xl p-5"
              style={{
                background: "var(--color-surface)",
                border: "1.5px solid var(--color-border)",
              }}
            >
              <p
                className="text-xs font-bold uppercase tracking-wide mb-4"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Document time allocation
              </p>
              <div className="flex flex-col gap-3">
                {docSummary.map((doc) => {
                  const pct =
                    totalDocMins > 0
                      ? Math.round((doc.minutes / totalDocMins) * 100)
                      : 0;
                  return (
                    <div key={doc.id} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-3">
                        <p
                          className="text-xs font-medium truncate"
                          style={{ color: "var(--color-text)" }}
                          title={doc.name}
                        >
                          {doc.name}
                        </p>
                        <span
                          className="text-xs font-semibold shrink-0"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {fmt(doc.minutes)} · {pct}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--color-border)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: doc.isReview
                              ? "#6366f1"
                              : "var(--ai-accent)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day-by-day schedule */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wide mb-3"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Day-by-day schedule
            </p>
            <div className="flex flex-col gap-2">
              {planData.days.map((day, i) => (
                <DayCard
                  key={day.date}
                  day={day}
                  defaultOpen={i === todayIndex}
                />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div
            className="flex items-center gap-4 flex-wrap text-[11px] pb-4"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
              <span key={type} className="flex items-center gap-1.5">
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
              </span>
            ))}
            <span className="ml-auto flex items-center gap-3">
              {Object.entries(PRIORITY_COLOR).map(([p, c]) => (
                <span key={p} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: c }}
                  />
                  <span className="capitalize">{p}</span>
                </span>
              ))}
            </span>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loadingExisting && planData == null && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{
              background:
                "color-mix(in srgb, var(--ai-accent) 12%, transparent)",
            }}
          >
            📅
          </div>
          <p
            className="text-base font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            No study plan yet
          </p>
          <p
            className="text-sm max-w-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Set your exam date and daily hours above, then click "Build my plan"
            to generate a personalised schedule.
          </p>
        </div>
      )}
    </main>
  );
}
