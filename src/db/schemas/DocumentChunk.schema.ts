import { type } from "arktype"
import { pgTable, uuid, text, timestamp, jsonb, customType } from "drizzle-orm/pg-core"

import { documents } from "./Document.schema"
import { vaults } from "./Vault.schema"
import { users } from "./User.schema"
import type { IModelConfig } from "../types/model-config"

// ── Custom type ─────────────────────────────────────────────────────────────

/** pgvector — stored as vector in Postgres, surfaced as number[] in TypeScript */
const vector = customType<{ data: number[]; driverData: string }>({
  dataType: () => "vector",
  fromDriver: (val: string) =>
    val
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map(Number),
  toDriver: (val: number[]) => `[${val.join(",")}]`,
})

// ── Table ─────────────────────────────────────────────────────────────────────

export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").references(() => documents.id),
  vaultId: uuid("vault_id").references(() => vaults.id),
  userId: uuid("user_id").references(() => users.id),
  content: text("content").notNull(),
  filename: text("filename"),
  embedding: vector("embedding"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// ── Drizzle types ─────────────────────────────────────────────────────────────

export type DocumentChunk = typeof documentChunks.$inferSelect
export type NewDocumentChunk = typeof documentChunks.$inferInsert

// ── Domain interface ─────────────────────────────────────────────────────────

export interface IDocumentChunkSchema {
  id: string
  documentId: string | null
  vaultId: string | null
  userId: string | null
  content: string
  filename: string | null
  embedding: number[] | null
  metadata: Record<string, unknown> | null
  createdAt: Date | null
}

// ── Validators ───────────────────────────────────────────────────────────────

export const CreateDocumentChunkInput = type({
  content: "string",
  "documentId?": "string",
  "vaultId?": "string",
  "userId?": "string",
  "filename?": "string",
  "embedding?": "number[]",
  "metadata?": "object",
})

export type CreateDocumentChunkInput = typeof CreateDocumentChunkInput.infer

// ── Model config ─────────────────────────────────────────────────────────────

export const DocumentChunkModelConfig: IModelConfig = {
  tableName: "document_chunks",
  primaryKeyType: "uuid",
  properties: {
    id: { type: "string", label: "ID", isRequired: true },
    content: { type: "string", label: "Content", isRequired: true },
    documentId: { type: "string", label: "Document ID", isRequired: false },
    vaultId: { type: "string", label: "Vault ID", isRequired: false },
    userId: { type: "string", label: "User ID", isRequired: false },
    filename: { type: "string", label: "Filename", isRequired: false },
    embedding: { type: "array", label: "Embedding", isRequired: false },
    metadata: { type: "object", label: "Metadata", isRequired: false },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
  },
}
