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
  chunkText: text("chunk_text").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  embeddingsVector: vector("embeddings_vector"),
  metadataJson: jsonb("metadata_json").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// ── Drizzle types ─────────────────────────────────────────────────────────────

export type DocumentChunk = typeof documentChunks.$inferSelect
export type NewDocumentChunk = typeof documentChunks.$inferInsert

// ── Domain interface ─────────────────────────────────────────────────────────

export interface IDocumentChunkSchema {
  id: string
  documentId: string
  chunkText: string
  chunkIndex: number
  embeddingsVector: number[] | null
  metadataJson: Record<string, unknown> | null
  createdAt: Date | null
}

// ── Validators ───────────────────────────────────────────────────────────────

export const CreateDocumentChunkInput = type({
  documentId: "string",
  chunkText: "string >= 1",
  chunkIndex: "number.integer >= 0",
  "embeddingsVector?": "number[]",
  "metadataJson?": "object",
})

export type CreateDocumentChunkInput = typeof CreateDocumentChunkInput.infer

// ── Model config ─────────────────────────────────────────────────────────────

export const DocumentChunkModelConfig: IModelConfig = {
  tableName: "document_chunks",
  primaryKeyType: "uuid",
  properties: {
    id: { type: "string", label: "ID", isRequired: true },
    documentId: { type: "string", label: "Document ID", isRequired: true },
    chunkText: { type: "string", label: "Chunk Text", isRequired: true },
    chunkIndex: { type: "number", label: "Chunk Index", isRequired: true },
    embeddingsVector: { type: "array", label: "Embeddings Vector", isRequired: false },
    metadataJson: { type: "object", label: "Metadata JSON", isRequired: false },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
  },
}
