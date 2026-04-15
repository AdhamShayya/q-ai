import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"

import type { IModelConfig } from "../types/model-config"
import { vaults } from "./Vault.schema"
import { users } from "./User.schema"

// ── Table ─────────────────────────────────────────────────────────────────────

export const flashcards = pgTable("flashcards", {
  id: uuid("id").defaultRandom().primaryKey(),
  vaultId: uuid("vault_id")
    .notNull()
    .references(() => vaults.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  front: text("front").notNull(),
  back: text("back").notNull(),
  sourceContext: text("source_context"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}).enableRLS()

// ── Drizzle types ─────────────────────────────────────────────────────────────

export type Flashcard = typeof flashcards.$inferSelect
export type NewFlashcard = typeof flashcards.$inferInsert

// ── Domain interface ─────────────────────────────────────────────────────────

export interface IFlashcardSchema {
  id: string
  vaultId: string
  userId: string
  front: string
  back: string
  sourceContext: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

// ── Model config ─────────────────────────────────────────────────────────────

export const FlashcardModelConfig: IModelConfig = {
  tableName: "flashcards",
  primaryKeyType: "uuid",
  properties: {
    id: { type: "string", label: "ID", isRequired: true },
    vaultId: { type: "string", label: "Vault ID", isRequired: true },
    userId: { type: "string", label: "User ID", isRequired: true },
    front: { type: "string", label: "Front", isRequired: true },
    back: { type: "string", label: "Back", isRequired: true },
    sourceContext: { type: "string", label: "Source Context", isRequired: false },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
    updatedAt: { type: "Date", label: "Updated At", isRequired: false },
  },
}
