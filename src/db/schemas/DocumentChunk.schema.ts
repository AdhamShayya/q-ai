import { type } from "arktype"
import { pgTable, uuid, text, timestamp, jsonb, integer, customType } from "drizzle-orm/pg-core"

import { documents } from "./Document.schema"
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
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id),
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
  documentId: string
  content: string
  embedding: number[] | null
  metadata: Record<string, unknown> | null
  createdAt: Date | null
}

// ── Validators ───────────────────────────────────────────────────────────────

export const CreateDocumentChunkInput = type({
  documentId: "string",
  "embedding?": "number[]",
  content: "string",
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
    documentId: { type: "string", label: "Document ID", isRequired: true },
    embedding: { type: "array", label: "Embedding", isRequired: false },
    metadata: { type: "object", label: "Metadata", isRequired: false },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
  },
}
