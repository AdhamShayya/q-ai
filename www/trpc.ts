import type { AppRouter } from "@src/routers";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

// ── tRPC client ───────────────────────────────────────────────────────────────

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: import.meta.env.PROD ? "/trpc" : "http://localhost:4000/trpc",
      fetch: (url, opts) => fetch(url, { ...opts, credentials: "include" }),
    }),
  ],
});

// ── Cache store ───────────────────────────────────────────────────────────────

const cache = new Map<string, { data: unknown; ts: number; ttl: number }>();
const inflight = new Map<string, Promise<unknown>>();

// TTLs in milliseconds
const TTL = {
  user: 5 * 60_000, // 5 min  — tied to cookie session
  persona: 5 * 60_000, // 5 min
  vault: 2 * 60_000, // 2 min
  conversation: 30_000, // 30 s   — near real-time chat
} as const;

// ── Core cache logic ──────────────────────────────────────────────────────────

/**
 * Serves the cached value when still fresh.
 * Concurrent calls with the same key share one in-flight request so we never
 * fire duplicate network requests.
 */
function cachedQuery<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number,
): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < hit.ttl)
    return Promise.resolve(hit.data as T);

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const request = fn()
    .then((data) => {
      cache.set(key, { data, ts: Date.now(), ttl });
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, request);
  return request;
}

/**
 * Removes cache entries by key.
 * - No args           → clears the entire cache
 * - Key ending in ":" → clears all entries with that prefix
 * - Exact key         → clears that single entry
 */
export function invalidateCache(...keys: string[]) {
  if (keys.length === 0) {
    cache.clear();
    return;
  }
  for (const k of keys) {
    if (k.endsWith(":")) {
      for (const ck of cache.keys()) if (ck.startsWith(k)) cache.delete(ck);
    } else {
      cache.delete(k);
    }
  }
}

// ── Builder helpers ───────────────────────────────────────────────────────────

/** Cached query — no input, fixed key. */
function q<T>(key: string, proc: { query: () => Promise<T> }, ttl: number) {
  return { query: () => cachedQuery(key, () => proc.query(), ttl) };
}

/** Cached query — input required, key derived from input. */
function qk<I, T>(
  keyFn: (i: I) => string,
  proc: { query: (input: I) => Promise<T> },
  ttl: number,
) {
  return {
    query: (input: I) =>
      cachedQuery(keyFn(input), () => proc.query(input), ttl),
  };
}

/** Mutation with automatic cache invalidation. Pass "all" to wipe the entire cache. */
function mut<I, T>(
  proc: { mutate: (input: I) => Promise<T> },
  keys: ((i: I) => string[]) | "all",
) {
  return {
    mutate: (input: I) =>
      proc.mutate(input).then((r) => {
        keys === "all" ? invalidateCache() : invalidateCache(...keys(input));
        return r;
      }),
  };
}

// ── Exported APIs ─────────────────────────────────────────────────────────────

export const userApi = {
  // — Queries
  me: q("user.me", client.user.me, TTL.user),
  getAllUsers: q("user.getAllUsers", client.user.getAllUsers, TTL.user),
  getUserById: qk(
    (i) => `user.getById:${i.id}`,
    client.user.getUserById,
    TTL.user,
  ),

  // — Mutations
  signUp: mut(client.user.signUp, () => ["user.me"]),
  signIn: mut(client.user.signIn, () => ["user.me"]),
  updateUser: mut(client.user.updateUser, (i) => [
    "user.me",
    `user.getById:${i.id}`,
  ]),
  deleteUser: mut(client.user.deleteUser, "all"),

  // signOut takes no input — handled directly
  signOut: {
    mutate: () =>
      client.user.signOut.mutate().then((r) => {
        invalidateCache();
        return r;
      }),
  },
};

export const vaultApi = {
  // — Queries
  listByUser: qk(
    (i) => `vault.listByUser:${i.userId}`,
    client.vault.listByUser,
    TTL.vault,
  ),
  getById: qk((i) => `vault.getById:${i.id}`, client.vault.getById, TTL.vault),
  getDocuments: qk(
    (i) => `vault.getDocuments:${i.vaultId}`,
    client.vault.getDocuments,
    TTL.vault,
  ),
  getDocument: qk(
    (i) => `vault.getDocument:${i.id}`,
    client.vault.getDocument,
    TTL.vault,
  ),

  // — Mutations
  create: mut(client.vault.create, (i) => [`vault.listByUser:${i.userId}`]),
  update: mut(client.vault.update, (i) => [
    "vault.listByUser:",
    `vault.getById:${i.id}`,
  ]),
  delete: mut(client.vault.delete, (i) => [
    "vault.listByUser:",
    `vault.getById:${i.id}`,
  ]),
  addDocument: mut(client.vault.addDocument, (i) => [
    `vault.getDocuments:${i.vaultId}`,
    "vault.listByUser:",
  ]),
  deleteDocument: mut(client.vault.deleteDocument, () => [
    "vault.getDocuments:",
    "vault.listByUser:",
  ]),
};

export const personaApi = {
  // — Queries
  get: q("persona.get", client.persona.get, TTL.persona),

  // — Mutations
  upsert: mut(client.persona.upsert, () => ["persona.get"]),
};

export const conversationApi = {
  // — Queries
  getOrCreate: qk(
    (i) => `conversation.getOrCreate:${i.userId}:${i.vaultId}`,
    client.conversation.getOrCreate,
    TTL.conversation,
  ),
  getMessages: qk(
    (i) => `conversation.getMessages:${i.conversationId}`,
    client.conversation.getMessages,
    TTL.conversation,
  ),
  countUserMessages: qk(
    (i) => `conversation.countUserMessages:${i.userId}`,
    client.conversation.countUserMessages,
    TTL.conversation,
  ),

  // — Mutations
  addMessage: mut(client.conversation.addMessage, (i) => [
    `conversation.getMessages:${i.conversationId}`,
  ]),
  chat: mut(client.conversation.chat, (i) => [
    i.conversationId
      ? `conversation.getMessages:${i.conversationId}`
      : "conversation.getMessages:",
    `conversation.countUserMessages:`,
  ]),
};

export const adminApi = {
  stats: q("admin.stats", client.admin.stats, 30_000),
  usersWithStats: q(
    "admin.usersWithStats",
    client.admin.usersWithStats,
    30_000,
  ),
};

// ── Feature APIs ──────────────────────────────────────────────────────────────

export const flashcardApi = {
  list: qk(
    (i) => `flashcard.list:${i.vaultId}:${i.userId}`,
    client.flashcard.list,
    TTL.vault,
  ),
  getDue: qk(
    (i) => `flashcard.due:${i.userId}`,
    client.flashcard.getDue,
    30_000,
  ),
  generate: mut(client.flashcard.generate, (i) => [
    `flashcard.list:${i.vaultId}:${i.userId}`,
    `flashcard.due:${i.userId}`,
  ]),
  review: mut(client.flashcard.review, (i) => [
    `flashcard.due:${i.userId}`,
    "flashcard.list:",
  ]),
  delete: mut(client.flashcard.delete, () => [
    "flashcard.list:",
    "flashcard.due:",
  ]),
  deleteAll: mut(client.flashcard.deleteAll, (i) => [
    `flashcard.list:${i.vaultId}:${i.userId}`,
    `flashcard.due:${i.userId}`,
  ]),
};

export const studyPlannerApi = {
  get: qk(
    (i) => `studyplanner.get:${i.vaultId}:${i.userId}`,
    client.studyPlanner.get,
    TTL.vault,
  ),
  create: mut(client.studyPlanner.create, (i) => [
    `studyplanner.get:${i.vaultId}:${i.userId}`,
  ]),
  delete: mut(client.studyPlanner.delete, (i) => [
    `studyplanner.get:${i.vaultId}:${i.userId}`,
  ]),
};

export const waitlistApi = {
  join: mut(client.waitlist.join, () => []),
};

export const paymentApi = {
  // — Mutations
  createSession: mut(client.payment.createSession, () => []),
  confirmUpgrade: mut(client.payment.confirmUpgrade, () => ["user.me"]),

  // — Queries
  getSessionStatus: qk(
    (i) => `payment.getSessionStatus:${i.sessionId}`,
    client.payment.getSessionStatus,
    5_000, // 5 s — short TTL since we poll this
  ),
};
