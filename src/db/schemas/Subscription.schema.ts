import { type } from "arktype"
import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core"

import type { IModelConfig } from "../types/model-config"
import { users, subscriptionTierEnum, subscriptionStatusEnum } from "./User.schema"

// ── Table ─────────────────────────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tier: subscriptionTierEnum("tier").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).defaultNow(),
  endDate: timestamp("end_date", { withTimezone: true }),
  status: subscriptionStatusEnum("status").default("active"),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}).enableRLS()

// ── Drizzle types ─────────────────────────────────────────────────────────────

export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert

// ── Domain interface ─────────────────────────────────────────────────────────

export interface ISubscriptionSchema {
  id: string
  userId: string
  tier: "free" | "premium"
  startDate: Date | null
  endDate: Date | null
  status: "active" | "cancelled" | "expired" | null
  stripeSubscriptionId: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

// ── Validators ───────────────────────────────────────────────────────────────

export const CreateSubscriptionInput = type({
  userId: "string",
  tier: "'free' | 'premium'",
  "endDate?": "string",
  "stripeSubscriptionId?": "string",
})

export const UpdateSubscriptionInput = type({
  "tier?": "'free' | 'premium'",
  "status?": "'active' | 'cancelled' | 'expired'",
  "endDate?": "string",
  "stripeSubscriptionId?": "string",
})

export type CreateSubscriptionInput = typeof CreateSubscriptionInput.infer
export type UpdateSubscriptionInput = typeof UpdateSubscriptionInput.infer

// ── Model config ─────────────────────────────────────────────────────────────

export const SubscriptionModelConfig: IModelConfig = {
  tableName: "subscriptions",
  primaryKeyType: "uuid",
  properties: {
    id: { type: "string", label: "ID", isRequired: true },
    userId: { type: "string", label: "User ID", isRequired: true },
    tier: { type: "string", label: "Tier", isRequired: true },
    startDate: { type: "Date", label: "Start Date", isRequired: false },
    endDate: { type: "Date", label: "End Date", isRequired: false },
    status: { type: "string", label: "Status", isRequired: false },
    stripeSubscriptionId: { type: "string", label: "Stripe Subscription ID", isRequired: false },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
    updatedAt: { type: "Date", label: "Updated At", isRequired: false },
  },
}
