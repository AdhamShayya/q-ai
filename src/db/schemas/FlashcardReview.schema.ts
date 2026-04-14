import { pgTable, uuid, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core"

import type { IModelConfig } from "../types/model-config"
import { flashcards } from "./Flashcard.schema"
import { users } from "./User.schema"

// ── Table ─────────────────────────────────────────────────────────────────────

export const flashcardReviews = pgTable("flashcard_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  flashcardId: uuid("flashcard_id")
    .notNull()
    .references(() => flashcards.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  // SM-2 scheduling fields
  easeFactor: doublePrecision("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(1), // days until next review
  repetitions: integer("repetitions").notNull().default(0), // successful repetitions in a row
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }).notNull().defaultNow(),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}).enableRLS()

// ── Drizzle types ─────────────────────────────────────────────────────────────

export type FlashcardReview = typeof flashcardReviews.$inferSelect
export type NewFlashcardReview = typeof flashcardReviews.$inferInsert

// ── Domain interface ─────────────────────────────────────────────────────────

export interface IFlashcardReviewSchema {
  id: string
  flashcardId: string
  userId: string
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewAt: Date
  lastReviewedAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
}

// ── Model config ─────────────────────────────────────────────────────────────

export const FlashcardReviewModelConfig: IModelConfig = {
  tableName: "flashcard_reviews",
  primaryKeyType: "uuid",
  properties: {
    id: { type: "string", label: "ID", isRequired: true },
    flashcardId: { type: "string", label: "Flashcard ID", isRequired: true },
    userId: { type: "string", label: "User ID", isRequired: true },
    easeFactor: { type: "number", label: "Ease Factor", isRequired: true },
    interval: { type: "number", label: "Interval", isRequired: true },
    repetitions: { type: "number", label: "Repetitions", isRequired: true },
    nextReviewAt: { type: "Date", label: "Next Review At", isRequired: true },
    lastReviewedAt: { type: "Date", label: "Last Reviewed At", isRequired: false },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
    updatedAt: { type: "Date", label: "Updated At", isRequired: false },
  },
}
