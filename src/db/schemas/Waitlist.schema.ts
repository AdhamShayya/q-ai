import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core"

// ── Table ─────────────────────────────────────────────────────────────────────

export const waitlistEntries = pgTable("waitlist_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}).enableRLS()

// ── Drizzle types ─────────────────────────────────────────────────────────────

export type WaitlistEntry = typeof waitlistEntries.$inferSelect
export type NewWaitlistEntry = typeof waitlistEntries.$inferInsert
