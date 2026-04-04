import { count, eq, and, isNotNull } from "drizzle-orm"

import { db } from "../db/index"
import { users } from "../db/schemas/User.schema"
import { vaults } from "../db/schemas/Vault.schema"
import { messages } from "../db/schemas/Message.schema"
import { documents } from "../db/schemas/Document.schema"
import { conversations } from "../db/schemas/Conversation.schema"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IUserWithStats {
  id: string
  name: string
  email: string
  subscriptionTier: "free" | "premium" | null
  subscriptionStatus: "active" | "cancelled" | "expired" | null
  createdAt: Date | null
  updatedAt: Date | null
  vaultCount: number
  documentCount: number
  conversationCount: number
  messageCount: number
}

export interface IAdminStats {
  totalUsers: number
  premiumUsers: number
  freeUsers: number
  activeUsers: number
  cancelledUsers: number
  newUsersThisMonth: number
  totalVaults: number
  totalDocuments: number
  totalConversations: number
  totalMessages: number
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * Returns all users with aggregated activity stats in a single parallel
 * fetch (5 queries total, merged client-side). This avoids N+1 queries.
 */
export async function getUsersWithStats(): Promise<IUserWithStats[]> {
  const [allUsers, vaultCounts, docCounts, convCounts, msgCounts] = await Promise.all([
    db.select().from(users),

    // vault count per user
    db.select({ userId: vaults.userId, cnt: count() }).from(vaults).groupBy(vaults.userId),

    // document count per user (documents → vaults → users)
    db
      .select({ userId: vaults.userId, cnt: count(documents.id) })
      .from(documents)
      .innerJoin(vaults, eq(documents.vaultId, vaults.id))
      .groupBy(vaults.userId),

    // conversation count per user
    db
      .select({ userId: conversations.userId, cnt: count() })
      .from(conversations)
      .groupBy(conversations.userId),

    // user-sent messages only (role = "user", non-null userId)
    db
      .select({ userId: messages.userId, cnt: count() })
      .from(messages)
      .where(and(eq(messages.role, "user"), isNotNull(messages.userId)))
      .groupBy(messages.userId),
  ])

  const vaultMap = new Map(vaultCounts.map((r) => [r.userId, Number(r.cnt)]))
  const docMap = new Map(docCounts.map((r) => [r.userId, Number(r.cnt)]))
  const convMap = new Map(convCounts.map((r) => [r.userId, Number(r.cnt)]))
  const msgMap = new Map(
    msgCounts.filter((r) => r.userId != null).map((r) => [r.userId as string, Number(r.cnt)]),
  )

  return allUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    subscriptionTier: u.subscriptionTier,
    subscriptionStatus: u.subscriptionStatus,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    vaultCount: vaultMap.get(u.id) ?? 0,
    documentCount: docMap.get(u.id) ?? 0,
    conversationCount: convMap.get(u.id) ?? 0,
    messageCount: msgMap.get(u.id) ?? 0,
  }))
}

/**
 * Returns aggregate platform-wide stats for the admin overview tab.
 */
export async function getAdminStats(): Promise<IAdminStats> {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [allUsers, vaultResult, docResult, convResult, msgResult] = await Promise.all([
    db.select().from(users),
    db.select({ cnt: count() }).from(vaults),
    db.select({ cnt: count() }).from(documents),
    db.select({ cnt: count() }).from(conversations),
    db
      .select({ cnt: count() })
      .from(messages)
      .where(and(eq(messages.role, "user"), isNotNull(messages.userId))),
  ])

  return {
    totalUsers: allUsers.length,
    premiumUsers: allUsers.filter((u) => u.subscriptionTier === "premium").length,
    freeUsers: allUsers.filter((u) => u.subscriptionTier === "free" || u.subscriptionTier == null)
      .length,
    activeUsers: allUsers.filter((u) => u.subscriptionStatus === "active").length,
    cancelledUsers: allUsers.filter(
      (u) => u.subscriptionStatus === "cancelled" || u.subscriptionStatus === "expired",
    ).length,
    newUsersThisMonth: allUsers.filter((u) => u.createdAt != null && u.createdAt >= firstOfMonth)
      .length,
    totalVaults: Number(vaultResult[0]?.cnt ?? 0),
    totalDocuments: Number(docResult[0]?.cnt ?? 0),
    totalConversations: Number(convResult[0]?.cnt ?? 0),
    totalMessages: Number(msgResult[0]?.cnt ?? 0),
  }
}
