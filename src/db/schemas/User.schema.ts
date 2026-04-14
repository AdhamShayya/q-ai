import { type } from "arktype"
import { pgTable, uuid, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core"

import type { IModelConfig } from "../types/model-config"

// ── Enums (shared with subscriptions) ────────────────────────────────────────

export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "premium"])
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "expired",
])

// ── Table ─────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("free"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}).enableRLS()

// ── Drizzle types ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// ── Domain interface ─────────────────────────────────────────────────────────

export interface IUserSchema {
  id: string
  email: string
  name: string
  passwordHash: string
  subscriptionTier: "free" | "premium" | null
  subscriptionStatus: "active" | "cancelled" | "expired" | null
  createdAt: Date | null
  updatedAt: Date | null
}

// ── Public shape (no password) ───────────────────────────────────────────────

export interface IUserPublic {
  id: string
  email: string
  name: string
  subscriptionTier: "free" | "premium" | null
  subscriptionStatus: "active" | "cancelled" | "expired" | null
  createdAt: Date | null
  updatedAt: Date | null
}

// ── Validators ───────────────────────────────────────────────────────────────

export const CreateUserInput = type({
  email: "string.email",
  name: "string >= 2",
  password: "string >= 8",
})

export const UpdateUserInput = type({
  "name?": "string >= 2",
  "email?": "string.email",
})

export type CreateUserInput = typeof CreateUserInput.infer
export type UpdateUserInput = typeof UpdateUserInput.infer

// ── Model config ─────────────────────────────────────────────────────────────

export const UserModelConfig: IModelConfig = {
  tableName: "users",
  primaryKeyType: "uuid",
  properties: {
    id: {
      type: "string",
      label: "ID",
      isRequired: true,
    },
    email: { type: "string", label: "Email", isRequired: true },
    name: { type: "string", label: "Name", isRequired: true },
    passwordHash: { type: "string", label: "Password Hash", isRequired: true },
    subscriptionTier: { type: "string", label: "Subscription Tier", isRequired: false },
    subscriptionStatus: { type: "string", label: "Subscription Status", isRequired: false },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
    updatedAt: { type: "Date", label: "Updated At", isRequired: false },
  },
}
