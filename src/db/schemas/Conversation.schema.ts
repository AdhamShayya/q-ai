import { type } from "arktype"
import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core"

import { users } from "./User.schema"
import { vaults } from "./Vault.schema"
import type { IModelConfig } from "../types/model-config"

// ── Table ─────────────────────────────────────────────────────────────────────

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  vaultId: uuid("vault_id").references(() => vaults.id),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// ── Drizzle types ─────────────────────────────────────────────────────────────

export type Conversation = typeof conversations.$inferSelect
export type NewConversation = typeof conversations.$inferInsert

// ── Domain interface ─────────────────────────────────────────────────────────

export interface IConversationSchema {
  id: string
  userId: string
  vaultId: string | null
  title: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

// ── Validators ───────────────────────────────────────────────────────────────

export const CreateConversationInput = type({
  userId: "string",
  "vaultId?": "string",
  "title?": "string",
})

export const UpdateConversationInput = type({
  "title?": "string",
  "vaultId?": "string",
})

export type CreateConversationInput = typeof CreateConversationInput.infer
export type UpdateConversationInput = typeof UpdateConversationInput.infer

// ── Model config ─────────────────────────────────────────────────────────────

export const ConversationModelConfig: IModelConfig = {
  tableName: "conversations",
  primaryKeyType: "uuid",
  properties: {
    id: { type: "string", label: "ID", isRequired: true },
    userId: { type: "string", label: "User ID", isRequired: true },
    vaultId: { type: "string", label: "Vault ID", isRequired: false },
    title: { type: "string", label: "Title", isRequired: false },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
    updatedAt: { type: "Date", label: "Updated At", isRequired: false },
  },
}
