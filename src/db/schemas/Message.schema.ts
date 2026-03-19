import { type } from "arktype"
import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core"

import { users } from "./User.schema"
import { vaults } from "./Vault.schema"
import { conversations } from "./Conversation.schema"
import type { IModelConfig } from "../types/model-config"

// ── Enum ────────────────────────────────────────────────────────────────────

export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system"])

// ── Table ─────────────────────────────────────────────────────────────────────

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id),
  userId: uuid("user_id").references(() => users.id),
  vaultId: uuid("vault_id").references(() => vaults.id),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  metadataJson: jsonb("metadata_json").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// ── Drizzle types ─────────────────────────────────────────────────────────────

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

// ── Domain interface ─────────────────────────────────────────────────────────

export interface IMessageSchema {
  id: string
  conversationId: string
  userId: string | null
  vaultId: string | null
  role: "user" | "assistant" | "system"
  content: string
  metadataJson: Record<string, unknown> | null
  createdAt: Date | null
}

// ── Validators ───────────────────────────────────────────────────────────────

export const CreateMessageInput = type({
  conversationId: "string",
  role: "'user' | 'assistant' | 'system'",
  content: "string >= 1",
  "metadataJson?": "object",
  "userId?": "string",
  "vaultId?": "string",
})

export type CreateMessageInput = typeof CreateMessageInput.infer

// ── Model config ─────────────────────────────────────────────────────────────

export const MessageModelConfig: IModelConfig = {
  tableName: "messages",
  primaryKeyType: "uuid",
  properties: {
    id: { type: "string", label: "ID", isRequired: true },
    conversationId: { type: "string", label: "Conversation ID", isRequired: true },
    role: { type: "string", label: "Role", isRequired: true },
    content: { type: "string", label: "Content", isRequired: true },
    metadataJson: { type: "object", label: "Metadata JSON", isRequired: false },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
  },
}
