import React, { useState, useMemo } from "react";
import { useLoaderData } from "react-router";
import { userApi, adminApi } from "../../trpc";
import type {
  IAdminStats,
  IUserWithStats,
} from "@src/controllers/admin.controller";

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader() {
  const user = await userApi.me.query();
  if (user == null) return Response.redirect("/sign-in");

  const [stats, users] = await Promise.all([
    adminApi.stats.query(),
    adminApi.usersWithStats.query(),
  ]);
  return { stats, users, currentUser: user };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date: Date | string | null): string {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Engagement score 0–100 based on platform activity. */
function engagementScore(u: IUserWithStats): number {
  return Math.min(
    100,
    u.vaultCount * 15 +
      u.documentCount * 10 +
      u.conversationCount * 25 +
      u.messageCount * 2,
  );
}

type ActivityTier = { label: string; color: string; bg: string; ring: string };
function activityTier(score: number): ActivityTier {
  if (score === 0)
    return {
      label: "Inactive",
      color: "text-slate-400",
      bg: "bg-slate-500/15",
      ring: "bg-slate-400",
    };
  if (score <= 25)
    return {
      label: "Curious",
      color: "text-blue-400",
      bg: "bg-blue-500/15",
      ring: "bg-blue-400",
    };
  if (score <= 50)
    return {
      label: "Learning",
      color: "text-teal-400",
      bg: "bg-teal-500/15",
      ring: "bg-teal-400",
    };
  if (score <= 75)
    return {
      label: "Active",
      color: "text-amber-400",
      bg: "bg-amber-500/15",
      ring: "bg-amber-400",
    };
  return {
    label: "Power User",
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    ring: "bg-violet-400",
  };
}

const AVATAR_PALETTES = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-indigo-500 to-blue-600",
];
function avatarGradient(id: string): string {
  const idx =
    id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx] ?? "from-violet-500 to-purple-600";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 blur-xl"
        style={{ background: accent ?? "var(--color-info)" }}
      />
      <span className="text-2xl">{icon}</span>
      <span className="text-3xl font-bold text-text tabular-nums">{value}</span>
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      {sub && <span className="text-xs text-text-secondary/70">{sub}</span>}
    </div>
  );
}

function PlanBadge({ tier }: { tier: "free" | "premium" | null }) {
  if (tier === "premium")
    return (
      <span className="flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
        <div>👑</div> <div>Premium</div>
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/15 text-slate-400 border border-slate-500/20">
      Free
    </span>
  );
}

function StatusDot({
  status,
}: {
  status: "active" | "cancelled" | "expired" | null;
}) {
  if (status === "active")
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Active
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-400">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
      {status === "cancelled" ? "Cancelled" : "Expired"}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const tier = activityTier(score);
  return (
    <div className="flex flex-col gap-1 min-w-20">
      <div className="flex justify-between items-center">
        <span className={`text-xs font-semibold ${tier.color}`}>
          {tier.label}
        </span>
        <span className="text-xs text-text-secondary">{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${tier.ring}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function UserRow({
  user,
  expanded,
  onToggle,
}: {
  user: IUserWithStats;
  expanded: boolean;
  onToggle: () => void;
}) {
  const score = engagementScore(user);
  const tier = activityTier(score);
  const gradient = avatarGradient(user.id);

  return (
    <>
      <tr
        className="border-b border-border hover:bg-bg-card/70 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        {/* Avatar + Name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shrink-0`}
            >
              {initials(user.name)}
            </div>
            <div>
              <p className="text-sm font-medium text-text leading-tight">
                {user.name}
              </p>
              <p className="text-xs text-text-secondary leading-tight">
                {user.email}
              </p>
            </div>
          </div>
        </td>

        {/* Plan */}
        <td className="px-4 py-3">
          <PlanBadge tier={user.subscriptionTier} />
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <StatusDot status={user.subscriptionStatus} />
        </td>

        {/* Stats */}
        <td className="px-4 py-3 text-center">
          <span className="text-sm font-semibold text-text">
            {user.vaultCount}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-sm font-semibold text-text">
            {user.documentCount}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-sm font-semibold text-text">
            {user.conversationCount}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-sm font-semibold text-text">
            {user.messageCount}
          </span>
        </td>

        {/* Score */}
        <td className="px-4 py-3 min-w-[110px] ">
          <ScoreBar score={score} />
        </td>

        {/* Last active */}
        <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
          {timeAgo(user.updatedAt)}
        </td>

        {/* Joined */}
        <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
          {formatDate(user.createdAt)}
        </td>

        {/* Expand chevron */}
        <td className="px-4 py-3 text-text-secondary">
          <span
            className="inline-block transition-transform duration-200"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ›
          </span>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="border-b border-border bg-bg-card/30">
          <td colSpan={11} className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-secondary uppercase tracking-wider">
                  User ID
                </span>
                <code className="text-xs text-text font-mono bg-border/30 px-2 py-1 rounded break-all">
                  {user.id}
                </code>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-secondary uppercase tracking-wider">
                  Email
                </span>
                <span className="text-sm text-text">{user.email}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-secondary uppercase tracking-wider">
                  Subscription
                </span>
                <span className="text-sm text-text capitalize">
                  {user.subscriptionTier ?? "free"} ·{" "}
                  {user.subscriptionStatus ?? "active"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-secondary uppercase tracking-wider">
                  Joined
                </span>
                <span className="text-sm text-text">
                  {formatDate(user.createdAt)}
                </span>
              </div>

              {/* Activity breakdown */}
              <div className="col-span-2 md:col-span-4">
                <span className="text-xs text-text-secondary uppercase tracking-wider block mb-2">
                  Activity Breakdown
                </span>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      icon: "🗄️",
                      label: "Vaults",
                      val: user.vaultCount,
                      pts: user.vaultCount * 15,
                    },
                    {
                      icon: "📄",
                      label: "Documents",
                      val: user.documentCount,
                      pts: user.documentCount * 10,
                    },
                    {
                      icon: "💬",
                      label: "Conversations",
                      val: user.conversationCount,
                      pts: user.conversationCount * 25,
                    },
                    {
                      icon: "📨",
                      label: "Messages Sent",
                      val: user.messageCount,
                      pts: user.messageCount * 2,
                    },
                  ].map(({ icon, label, val, pts }) => (
                    <div
                      key={label}
                      className="bg-border/20 rounded-xl p-3 flex flex-col gap-1"
                    >
                      <span className="text-base">{icon}</span>
                      <span className="text-lg font-bold text-text">{val}</span>
                      <span className="text-xs text-text-secondary">
                        {label}
                      </span>
                      <span className={`text-xs ${tier.color}`}>
                        +{pts} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({
  stats,
  users,
}: {
  stats: IAdminStats;
  users: IUserWithStats[];
}) {
  const topUsers = useMemo(
    () =>
      [...users]
        .sort((a, b) => engagementScore(b) - engagementScore(a))
        .slice(0, 6),
    [users],
  );
  const recentSignups = useMemo(
    () =>
      [...users]
        .filter((u) => u.createdAt != null)
        .sort(
          (a, b) =>
            new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
        )
        .slice(0, 5),
    [users],
  );

  const premiumRate =
    stats.totalUsers > 0
      ? Math.round((stats.premiumUsers / stats.totalUsers) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Primary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="👥"
          label="Total Users"
          value={stats.totalUsers}
          accent="#7c3aed"
        />
        <StatCard
          icon="👑"
          label="Premium Users"
          value={stats.premiumUsers}
          sub={`${premiumRate}% conversion`}
          accent="#f59e0b"
        />
        <StatCard
          icon="📅"
          label="New This Month"
          value={stats.newUsersThisMonth}
          accent="#10b981"
        />
        <StatCard
          icon="💚"
          label="Active Accounts"
          value={stats.activeUsers}
          sub={`${stats.cancelledUsers} cancelled`}
          accent="#10b981"
        />
      </div>

      {/* Secondary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="🗄️"
          label="Total Vaults"
          value={stats.totalVaults}
          accent="#3b82f6"
        />
        <StatCard
          icon="📄"
          label="Total Documents"
          value={stats.totalDocuments}
          accent="#06b6d4"
        />
        <StatCard
          icon="💬"
          label="Total Conversations"
          value={stats.totalConversations}
          accent="#8b5cf6"
        />
        <StatCard
          icon="📨"
          label="User Messages"
          value={stats.totalMessages}
          accent="#f97316"
        />
      </div>

      {/* Free vs Premium visual */}
      <div
        className="bg-bg-card border border-border rounded-2xl p-6"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Subscription Split
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 rounded-full overflow-hidden bg-border">
            <div
              className="h-full rounded-full bg-linear-to-r from-violet-500 to-purple-600 transition-all"
              style={{ width: `${premiumRate}%` }}
            />
          </div>
          <div className="flex gap-6 shrink-0 text-sm">
            <span className="flex items-center gap-2 text-violet-400">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              {stats.premiumUsers} Premium ({premiumRate}%)
            </span>
            <span className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              {stats.freeUsers} Free ({100 - premiumRate}%)
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top contributors */}
        <div
          className="bg-bg-card border border-border rounded-2xl p-6"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            🏆 Top Contributors
          </h3>
          <div className="space-y-3">
            {topUsers.map((u, i) => {
              const score = engagementScore(u);
              const tier = activityTier(score);
              return (
                <div key={u.id} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center text-text-secondary">
                    {i === 0
                      ? "🥇"
                      : i === 1
                        ? "🥈"
                        : i === 2
                          ? "🥉"
                          : `${i + 1}.`}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg bg-linear-to-br ${avatarGradient(u.id)} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                  >
                    {initials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {u.name}
                    </p>
                    <div className="h-1 rounded-full bg-border mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${tier.ring}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${tier.color} shrink-0`}>
                    {score} pts
                  </span>
                </div>
              );
            })}
            {topUsers.length === 0 && (
              <p className="text-sm text-text-secondary">No users yet.</p>
            )}
          </div>
        </div>

        {/* Recent signups */}
        <div
          className="bg-bg-card border border-border rounded-2xl p-6"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            🆕 Recent Signups
          </h3>
          <div className="space-y-3">
            {recentSignups.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg bg-linear-to-br ${avatarGradient(u.id)} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                >
                  {initials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">
                    {u.name}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {u.email}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <PlanBadge tier={u.subscriptionTier} />
                  <p className="text-xs text-text-secondary mt-1">
                    {timeAgo(u.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {recentSignups.length === 0 && (
              <p className="text-sm text-text-secondary">No users yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

type SortKey =
  | "name"
  | "score"
  | "vaults"
  | "docs"
  | "convs"
  | "msgs"
  | "joined";
type SortDir = "asc" | "desc";

function UsersTab({ users }: { users: IUserWithStats[] }) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "premium">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = users;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }
    if (planFilter !== "all")
      list = list.filter((u) => (u.subscriptionTier ?? "free") === planFilter);
    if (statusFilter === "active")
      list = list.filter((u) => u.subscriptionStatus === "active");
    if (statusFilter === "inactive")
      list = list.filter((u) => u.subscriptionStatus !== "active");

    return [...list].sort((a, b) => {
      let av = 0,
        bv = 0;
      switch (sortKey) {
        case "name":
          return sortDir === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case "score":
          av = engagementScore(a);
          bv = engagementScore(b);
          break;
        case "vaults":
          av = a.vaultCount;
          bv = b.vaultCount;
          break;
        case "docs":
          av = a.documentCount;
          bv = b.documentCount;
          break;
        case "convs":
          av = a.conversationCount;
          bv = b.conversationCount;
          break;
        case "msgs":
          av = a.messageCount;
          bv = b.messageCount;
          break;
        case "joined":
          av = new Date(a.createdAt ?? 0).getTime();
          bv = new Date(b.createdAt ?? 0).getTime();
          break;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [users, search, planFilter, statusFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const SortTh = ({
    col,
    label,
    className = "",
  }: {
    col: SortKey;
    label: string;
    className?: string;
  }) => (
    <th
      className={`px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text select-none whitespace-nowrap ${className}`}
      onClick={() => toggleSort(col)}
    >
      {label}
      {sortKey === col && (
        <span className="ml-1 opacity-60">{sortDir === "asc" ? "↑" : "↓"}</span>
      )}
    </th>
  );

  const activeCount = users.filter(
    (u) => u.subscriptionStatus === "active",
  ).length;
  const premCount = users.filter(
    (u) => u.subscriptionTier === "premium",
  ).length;

  return (
    <div className="space-y-4">
      {/* Quick stats bar */}
      <div className="flex flex-wrap gap-3 text-sm">
        {[
          { label: "Total", val: users.length, color: "text-text" },
          { label: "Premium", val: premCount, color: "text-violet-400" },
          {
            label: "Free",
            val: users.length - premCount,
            color: "text-slate-400",
          },
          { label: "Active", val: activeCount, color: "text-emerald-400" },
        ].map(({ label, val, color }) => (
          <div
            key={label}
            className="bg-bg-card border border-border rounded-xl px-4 py-2 flex gap-2 items-center"
          >
            <span className={`font-bold ${color}`}>{val}</span>
            <span className="text-text-secondary">{label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-50 bg-bg-card border border-border rounded-xl px-4 py-2 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-info/50 transition"
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value as typeof planFilter)}
          className="bg-bg-card border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-info/50 transition cursor-pointer"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as typeof statusFilter)
          }
          className="bg-bg-card border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-info/50 transition cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {(search || planFilter !== "all" || statusFilter !== "all") && (
          <span className="text-xs text-text-secondary">
            {filtered.length} / {users.length} users
          </span>
        )}
      </div>

      {/* Table */}
      <div
        className="bg-bg-card border border-border rounded-2xl overflow-hidden"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-bg-card/80">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-left">
                  User
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-left">
                  Plan
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-left">
                  Status
                </th>
                <SortTh col="vaults" label="Vaults" className="text-center" />
                <SortTh col="docs" label="Docs" className="text-center" />
                <SortTh col="convs" label="Convs" className="text-center" />
                <SortTh col="msgs" label="Msgs" className="text-center" />
                <SortTh col="score" label="Engagement" />
                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                  Last Active
                </th>
                <SortTh col="joined" label="Joined" />
                <th className="px-4 py-3 w-6" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  expanded={expandedId === u.id}
                  onToggle={() =>
                    setExpandedId(expandedId === u.id ? null : u.id)
                  }
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="py-16 text-center text-text-secondary text-sm"
                  >
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "overview" | "users";

export default function AdminPage() {
  const { stats, users } = useLoaderData<typeof loader>() as {
    stats: IAdminStats;
    users: IUserWithStats[];
    currentUser: { id: string; name: string; email: string };
  };

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "users", label: `Users (${users.length})`, icon: "👥" },
  ];

  return (
    <div className="min-h-screen bg-bg flex">
      {/* ── Sidebar ── */}
      <aside
        className="w-64 shrink-0 flex flex-col border-r border-border bg-bg-card/60 sticky top-0 h-screen overflow-y-auto"
        style={{ backdropFilter: "blur(12px)" }}
      >
        {/* Brand */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <h1 className="text-base font-bold text-text leading-tight">
                Admin
              </h1>
              <p className="text-xs text-text-secondary leading-tight">
                Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === t.key
                  ? "bg-info text-black"
                  : "text-text-secondary bg-info/15 hover:text-text hover:bg-bg/60"
              }`}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header
          className="border-b border-border bg-bg-card/40 px-8 py-5 flex items-center justify-between gap-4 sticky top-0 z-10"
          style={{ backdropFilter: "blur(12px)" }}
        >
          <div>
            <h2 className="text-lg font-bold text-text">
              {tabs.find((t) => t.key === activeTab)?.icon}{" "}
              {tabs.find((t) => t.key === activeTab)?.label}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Platform overview · {stats.totalUsers} registered users
            </p>
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 px-8 py-8">
          {activeTab === "overview" && (
            <OverviewTab stats={stats} users={users} />
          )}
          {activeTab === "users" && <UsersTab users={users} />}
        </main>
      </div>
    </div>
  );
}
