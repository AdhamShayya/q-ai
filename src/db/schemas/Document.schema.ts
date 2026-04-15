import { pgTable, uuid, varchar, text, timestamp, jsonb, bigint, pgEnum } from "drizzle-orm/pg-core"
import { type } from "arktype"

import type { IModelConfig } from "../types/model-config"
import { vaults } from "./Vault.schema"

// ── Enum ────────────────────────────────────────────────────────────────────

export const processingStatusEnum = pgEnum("processing_status", [
  "pending",
  "processing",
  "completed",
  "error",
])

// ── Table ─────────────────────────────────────────────────────────────────────

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  vaultId: uuid("vault_id")
    .notNull()
    .references(() => vaults.id),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  filePath: text("file_path").notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadDate: timestamp("upload_date", { withTimezone: true }).defaultNow(),
  processingStatus: processingStatusEnum("processing_status").default("pending"),
  processingError: text("processing_error"),
  metadataJson: jsonb("metadata_json").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}).enableRLS()

// ── Drizzle types ─────────────────────────────────────────────────────────────

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert

// ── Domain interface ─────────────────────────────────────────────────────────

export interface IDocumentSchema {
  id: string
  vaultId: string
  filename: string
  fileType: string
  filePath: string
  fileSize: number
  mimeType: string | null
  uploadDate: Date | null
  processingStatus: "pending" | "processing" | "completed" | "error" | null
  processingError: string | null
  metadataJson: Record<string, unknown> | null
  createdAt: Date | null
  updatedAt: Date | null
}

// ── Validators ───────────────────────────────────────────────────────────────

export const CreateDocumentInput = type({
  vaultId: "string",
  filename: "string >= 1",
  fileType: "string >= 1",
  filePath: "string >= 1",
  fileSize: "number.integer > 0",
  "mimeType?": "string",
  "metadataJson?": "object",
})

export const UpdateDocumentInput = type({
  "processingStatus?": "'pending' | 'processing' | 'completed' | 'error'",
  "processingError?": "string",
  "metadataJson?": "object",
})

export type CreateDocumentInput = typeof CreateDocumentInput.infer
export type UpdateDocumentInput = typeof UpdateDocumentInput.infer

// ── Model config ─────────────────────────────────────────────────────────────

export const DocumentModelConfig: IModelConfig = {
  tableName: "documents",
  primaryKeyType: "uuid",
  properties: {
    id: { type: "string", label: "ID", isRequired: true },
    vaultId: { type: "string", label: "Vault ID", isRequired: true },
    filename: { type: "string", label: "Filename", isRequired: true },
    fileType: { type: "string", label: "File Type", isRequired: true },
    filePath: { type: "string", label: "File Path", isRequired: true },
    fileSize: { type: "number", label: "File Size", isRequired: true },
    mimeType: { type: "string", label: "MIME Type", isRequired: false },
    uploadDate: { type: "Date", label: "Upload Date", isRequired: false },
    processingStatus: { type: "string", label: "Processing Status", isRequired: false },
    processingError: { type: "string", label: "Processing Error", isRequired: false },
    metadataJson: { type: "object", label: "Metadata JSON", isRequired: false },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
    updatedAt: { type: "Date", label: "Updated At", isRequired: false },
  },
}
