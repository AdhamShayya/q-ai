import React, { useState, useEffect, useCallback } from "react";
import { useLoaderData, Link } from "react-router";

import { userApi, vaultApi, flashcardApi } from "../../trpc";
import type { IVaultSchema } from "@src/db/schemas/Vault.schema";
import type { Serialised } from "../../shared";

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader() {
  const user = await userApi.me.query();
  if (user == null) return Response.redirect("/sign-in");
  const vaults = await vaultApi.listByUser.query({ userId: user.id });
  return { userId: user.id, vaults };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COUNT_OPTIONS = [5, 10, 15, 20] as const;
type CardCount = (typeof COUNT_OPTIONS)[number];

// ── Review session persistence ────────────────────────────────────────────────
// Stored in localStorage so progress survives navigation / tab refresh.

interface ReviewSession {
  vaultId: string;
  idx: number; // current card index in the due list
  completed: number; // cards rated this session
  correct: number; // ratings >= 3
}

function sessionKey(vaultId: string) {
  return `qai_review_session_${vaultId}`;
}

function loadSession(vaultId: string): ReviewSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(vaultId));
    return raw ? (JSON.parse(raw) as ReviewSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: ReviewSession) {
  localStorage.setItem(sessionKey(session.vaultId), JSON.stringify(session));
}

function clearSession(vaultId: string) {
  localStorage.removeItem(sessionKey(vaultId));
}

// ── Stats persistence ─────────────────────────────────────────────────────────

interface SessionStat {
  date: string; // ISO date
  completed: number;
  correct: number;
}

function statsKey(vaultId: string) {
  return `qai_review_stats_${vaultId}`;
}

function appendStat(vaultId: string, completed: number, correct: number) {
  if (completed === 0) return;
  try {
    const raw = localStorage.getItem(statsKey(vaultId));
    const list: SessionStat[] = raw ? JSON.parse(raw) : [];
    list.push({ date: new Date().toISOString(), completed, correct });
    // Keep last 30 sessions max
    localStorage.setItem(statsKey(vaultId), JSON.stringify(list.slice(-30)));
  } catch {
    // non-critical
  }
}

// ── Rating button labels ──────────────────────────────────────────────────────

const RATINGS = [
  { value: 0, label: "Blackout", desc: "Complete blank", color: "#ef4444" },
  { value: 1, label: "Wrong", desc: "Totally incorrect", color: "#f97316" },
  { value: 2, label: "Hard", desc: "Wrong but familiar", color: "#eab308" },
  { value: 3, label: "Okay", desc: "Correct with effort", color: "#84cc16" },
  {
    value: 4,
    label: "Good",
    desc: "Correct with hesitation",
    color: "#22c55e",
  },
  { value: 5, label: "Easy", desc: "Perfect recall", color: "#10b981" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface FlashcardEntry {
  card: {
    id: string;
    front: string;
    back: string;
    sourceContext: string | null;
    vaultId: string;
    userId: string;
    createdAt: string | null;
    updatedAt: string | null;
  };
  review: {
    easeFactor: number;
    interval: number;
    repetitions: number;
    nextReviewAt: string;
    lastReviewedAt: string | null;
  } | null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FlashCard(props: { entry: FlashcardEntry }) {
  const { entry } = props;
  const [flipped, setFlipped] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const isDue =
    entry.review == null || new Date(entry.review.nextReviewAt) <= new Date();

  return (
    <div
      className="relative cursor-pointer select-none rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: "var(--color-surface)",
        border: `1.5px solid ${isDue ? "color-mix(in srgb, var(--ai-accent) 45%, transparent)" : "var(--color-border)"}`,
        minHeight: 160,
      }}
      onClick={() => setFlipped((f) => !f)}
    >
      {isDue && (
        <span
          className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
          style={{ background: "var(--ai-accent)", color: "#fff" }}
        >
          Due
        </span>
      )}
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {flipped ? "Answer" : "Question"}
      </p>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--color-text)" }}
      >
        {flipped ? entry.card.back : entry.card.front}
      </p>
      {!flipped && entry.card.sourceContext && (
        <div onClick={(e) => e.stopPropagation()}>
          {hintShown ? (
            <p
              className="text-[11px] px-2 py-1 rounded-lg"
              style={{
                background:
                  "color-mix(in srgb, var(--ai-accent) 10%, transparent)",
                color: "var(--ai-accent)",
              }}
            >
              💡 {entry.card.sourceContext}
            </p>
          ) : (
            <button
              className="text-[11px] font-medium"
              onClick={() => setHintShown(true)}
            >
              Show hint
            </button>
          )}
        </div>
      )}
      <p
        className="text-[11px] mt-auto"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {flipped ? "Click to see question" : "Click to reveal answer"}
      </p>
    </div>
  );
}

// ── Review Mode ───────────────────────────────────────────────────────────────

function ReviewMode({
  entries,
  vaultId,
  userId,
  onDone,
}: {
  entries: FlashcardEntry[];
  vaultId: string;
  userId: string;
  onDone: (completed: number, correct: number) => void;
}) {
  const due = entries.filter(
    (e) => e.review == null || new Date(e.review.nextReviewAt) <= new Date(),
  );

  // Restore previous session progress if it exists
  const saved = loadSession(vaultId);
  const [idx, setIdx] = useState(() => Math.min(saved?.idx ?? 0, due.length));
  const [completed, setCompleted] = useState(saved?.completed ?? 0);
  const [correct, setCorrect] = useState(saved?.correct ?? 0);
  const [flipped, setFlipped] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Persist progress whenever idx / completed / correct change
  useEffect(() => {
    if (idx < due.length) {
      saveSession({ vaultId, idx, completed, correct });
    }
  }, [idx, completed, correct, vaultId, due.length]);

  // Save stats + clear session then hand control back to parent
  const finish = useCallback(
    (finalCompleted: number, finalCorrect: number) => {
      appendStat(vaultId, finalCompleted, finalCorrect);
      clearSession(vaultId);
      onDone(finalCompleted, finalCorrect);
    },
    [vaultId, onDone],
  );

  if (due.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{
            background: "color-mix(in srgb, var(--ai-accent) 15%, transparent)",
          }}
        >
          🎉
        </div>
        <h3
          className="text-lg font-bold"
          style={{ color: "var(--color-text)" }}
        >
          All caught up!
        </h3>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          No cards due for review right now. Come back later!
        </p>
        <button
          onClick={() => finish(0, 0)}
          className="px-5 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "var(--ai-accent)", color: "#fff" }}
        >
          Back to cards
        </button>
      </div>
    );
  }

  if (idx >= due.length) {
    // Session just completed — flush stats
    appendStat(vaultId, completed, correct);
    clearSession(vaultId);
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: "color-mix(in srgb, #22c55e 15%, transparent)" }}
        >
          ✅
        </div>
        <h3
          className="text-lg font-bold"
          style={{ color: "var(--color-text)" }}
        >
          Session complete!
        </h3>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          You reviewed {completed} card{completed !== 1 ? "s" : ""} —{" "}
          <span style={{ color: "#22c55e" }}>{correct} correct</span>.
        </p>
        <button
          onClick={() => onDone(completed, correct)}
          className="px-5 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "var(--ai-accent)", color: "#fff" }}
        >
          Back to cards
        </button>
      </div>
    );
  }

  const current = due[idx]!;

  async function handleRate(rating: number) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await flashcardApi.review.mutate({
        flashcardId: current.card.id,
        userId,
        rating,
      });
      const newCompleted = completed + 1;
      const newCorrect = correct + (rating >= 3 ? 1 : 0);
      setCompleted(newCompleted);
      setCorrect(newCorrect);
      setIdx((i) => i + 1);
      setFlipped(false);
      setHintShown(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      {/* Progress bar */}
      <div
        className="flex items-center justify-between text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <span>
          Card {idx + 1} of {due.length}
        </span>
        <span>{Math.round((idx / due.length) * 100)}% done</span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--color-border)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(idx / due.length) * 100}%`,
            background: "var(--ai-accent)",
          }}
        />
      </div>

      {/* Card face */}
      <div
        className="rounded-2xl p-8 min-h-55 flex flex-col gap-4"
        style={{
          background: "var(--color-surface)",
          border: "1.5px solid var(--color-border)",
        }}
      >
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {flipped ? "Answer" : "Question"}
        </p>
        <p
          className="text-base leading-relaxed flex-1"
          style={{ color: "var(--color-text)" }}
        >
          {flipped ? current.card.back : current.card.front}
        </p>
        {!flipped && (
          <div className="flex items-center gap-3 flex-wrap">
            {current.card.sourceContext != null &&
              (hintShown ? (
                <p
                  className="text-sm px-3 py-1.5 rounded-xl flex-1"
                  style={{
                    background:
                      "color-mix(in srgb, var(--ai-accent) 10%, transparent)",
                    color: "var(--ai-accent)",
                  }}
                >
                  💡 {current.card.sourceContext}
                </p>
              ) : (
                <button
                  onClick={() => setHintShown(true)}
                  className="text-sm font-medium px-3 py-1.5 rounded-xl transition-all"
                  style={{
                    background:
                      "color-mix(in srgb, var(--ai-accent) 10%, transparent)",
                    color: "var(--ai-accent)",
                  }}
                >
                  💡 Show hint
                </button>
              ))}
            <button
              onClick={() => setFlipped(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background:
                  "color-mix(in srgb, var(--ai-accent) 15%, transparent)",
                color: "var(--ai-accent)",
              }}
            >
              Reveal answer →
            </button>
          </div>
        )}
      </div>

      {/* Rating buttons */}
      {flipped && (
        <div className="flex flex-col gap-2">
          <p
            className="text-xs font-semibold uppercase tracking-wide text-center"
            style={{ color: "var(--color-text-secondary)" }}
          >
            How well did you recall this?
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {RATINGS.map((r) => (
              <button
                key={r.value}
                disabled={submitting}
                onClick={() => handleRate(r.value)}
                className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl text-[11px] font-semibold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `${r.color}22`,
                  border: `1.5px solid ${r.color}44`,
                  color: r.color,
                }}
              >
                <span className="text-base font-bold">{r.value}</span>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exit — saves progress + stats */}
      <button
        onClick={() => finish(completed, correct)}
        className="text-xs self-center mt-1 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: "var(--color-text-secondary)" }}
      >
        ← Exit review (progress saved)
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const { userId, vaults } = useLoaderData<typeof loader>() as {
    userId: string;
    vaults: Serialised<IVaultSchema>[];
  };

  const [selectedVaultId, setSelectedVaultId] = useState(vaults[0]?.id ?? "");
  const [entries, setEntries] = useState<FlashcardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cardCount, setCardCount] = useState<CardCount>(10);
  const [reviewMode, setReviewMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [lastSessionStats, setLastSessionStats] = useState<{
    completed: number;
    correct: number;
  } | null>(null);

  const dueCount = entries.filter(
    (e) => e.review == null || new Date(e.review.nextReviewAt) <= new Date(),
  ).length;

  // Detect a saved-in-progress session for the selected vault
  const pendingSession = selectedVaultId ? loadSession(selectedVaultId) : null;

  useEffect(() => {
    if (selectedVaultId === "") return;
    setLoading(true);
    flashcardApi.list
      .query({ vaultId: selectedVaultId, userId })
      .then((data) => setEntries(data as FlashcardEntry[]))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [selectedVaultId]);

  async function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    try {
      await flashcardApi.generate.mutate({
        vaultId: selectedVaultId,
        userId,
        count: cardCount,
      });
      const fresh = await flashcardApi.list.query({
        vaultId: selectedVaultId,
        userId,
      });
      setEntries(fresh as FlashcardEntry[]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate flashcards";
      alert(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteAll() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
      return;
    }
    await flashcardApi.deleteAll.mutate({ vaultId: selectedVaultId, userId });
    setEntries([]);
    setDeleteConfirm(false);
  }

  if (reviewMode) {
    return (
      <main className="min-h-[80vh] px-4 py-10 max-w-3xl mx-auto">
        <ReviewMode
          entries={entries}
          vaultId={selectedVaultId}
          userId={userId}
          onDone={async (completed, correct) => {
            setReviewMode(false);
            if (completed > 0) setLastSessionStats({ completed, correct });
            const fresh = await flashcardApi.list.query({
              vaultId: selectedVaultId,
              userId,
            });
            setEntries(fresh as FlashcardEntry[]);
          }}
        />
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] px-4 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{
                background:
                  "color-mix(in srgb, var(--ai-accent) 15%, transparent)",
              }}
            >
              🃏
            </div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              Flashcards
            </h1>
          </div>
          <p
            className="text-sm ml-13"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Spaced repetition powered by SM-2 algorithm
          </p>
        </div>

        {/* Vault pill strip — replaces dropdown */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl"
          style={{
            background: "var(--color-surface)",
            border: "1.5px solid var(--color-border)",
          }}
        >
          {vaults.map((v) => {
            const isActive = v.id === selectedVaultId;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVaultId(v.id)}
                className="relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{
                  background: isActive ? "var(--ai-accent)" : "transparent",
                  color: isActive ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                {v.name}
              </button>
            );
          })}
        </div>

        {/* Mobile: compact select */}
        <select
          value={selectedVaultId}
          onChange={(e) => setSelectedVaultId(e.target.value)}
          className="sm:hidden px-3 py-2 rounded-xl text-sm font-medium outline-none"
          style={{
            background: "var(--color-surface)",
            border: "1.5px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          {vaults.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats bar */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total cards", value: entries.length },
            { label: "Due today", value: dueCount },
            {
              label: "Mastered",
              value: entries.filter((e) => (e.review?.repetitions ?? 0) >= 3)
                .length,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-4 text-center"
              style={{
                background: "var(--color-surface)",
                border: "1.5px solid var(--color-border)",
              }}
            >
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--ai-accent)" }}
              >
                {stat.value}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Last session stats toast */}
      {lastSessionStats && (
        <div
          className="flex items-center justify-between gap-4 rounded-2xl px-5 py-3 mb-5 text-sm"
          style={{
            background: "color-mix(in srgb, #22c55e 10%, transparent)",
            border: "1.5px solid color-mix(in srgb, #22c55e 30%, transparent)",
          }}
        >
          <span style={{ color: "var(--color-text)" }}>
            Last session: reviewed <strong>{lastSessionStats.completed}</strong>{" "}
            card{lastSessionStats.completed !== 1 ? "s" : ""},{" "}
            <strong style={{ color: "#22c55e" }}>
              {lastSessionStats.correct} correct
            </strong>
          </span>
          <button
            onClick={() => setLastSessionStats(null)}
            className="text-xs opacity-50 hover:opacity-100"
            style={{ color: "var(--color-text-secondary)" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Pending session banner */}
      {pendingSession && pendingSession.idx > 0 && !reviewMode && (
        <div
          className="flex items-center justify-between gap-4 rounded-2xl px-5 py-3 mb-5 text-sm"
          style={{
            background: "color-mix(in srgb, var(--ai-accent) 10%, transparent)",
            border:
              "1.5px solid color-mix(in srgb, var(--ai-accent) 30%, transparent)",
          }}
        >
          <span style={{ color: "var(--color-text)" }}>
            You left off at card <strong>{pendingSession.idx + 1}</strong> —
            resume where you stopped?
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setReviewMode(true)}
              className="px-3 py-1 rounded-lg text-xs font-semibold"
              style={{ background: "var(--ai-accent)", color: "#fff" }}
            >
              Resume
            </button>
            <button
              onClick={() => clearSession(selectedVaultId)}
              className="px-3 py-1 rounded-lg text-xs opacity-60 hover:opacity-100"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex gap-3 mb-8 flex-wrap items-center justify-between">
        {/* Count selector */}
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ border: "1.5px solid var(--color-border)" }}
        >
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setCardCount(n)}
              className="px-3 py-2 text-xs font-semibold transition-colors"
              style={{
                background:
                  cardCount === n ? "var(--ai-accent)" : "var(--color-surface)",
                color: cardCount === n ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || selectedVaultId === ""}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "var(--ai-accent)",
            color: "#fff",
            opacity: generating ? 0.6 : 1,
          }}
        >
          {generating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Generating…
            </>
          ) : (
            <>✨ Generate {cardCount} cards</>
          )}
        </button>

        {dueCount > 0 && (
          <button
            onClick={() => setReviewMode(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "color-mix(in srgb, #22c55e 15%, transparent)",
              border:
                "1.5px solid color-mix(in srgb, #22c55e 35%, transparent)",
              color: "#22c55e",
            }}
          >
            ▶ Review {dueCount} due card{dueCount !== 1 ? "s" : ""}
          </button>
        )}

        {entries.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ml-auto"
            style={{
              background: deleteConfirm ? "#ef444422" : "var(--color-surface)",
              border: `1.5px solid ${deleteConfirm ? "#ef4444" : "var(--color-border)"}`,
              color: deleteConfirm ? "#ef4444" : "var(--color-text-secondary)",
            }}
          >
            {deleteConfirm ? "Tap again to confirm delete" : "Clear all"}
          </button>
        )}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl animate-pulse"
              style={{ background: "var(--color-surface)" }}
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{
              background:
                "color-mix(in srgb, var(--ai-accent) 12%, transparent)",
            }}
          >
            🃏
          </div>
          <h3
            className="text-lg font-bold"
            style={{ color: "var(--color-text)" }}
          >
            No flashcards yet
          </h3>
          <p
            className="text-sm max-w-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Click "Generate from vault" to extract Q&A cards from your study
            materials automatically.
          </p>
          <Link
            to="/dashboard"
            className="text-xs mt-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            ← No documents? Upload them first
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <FlashCard key={entry.card.id} entry={entry} />
          ))}
        </div>
      )}
    </main>
  );
}
