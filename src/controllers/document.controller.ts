import { sql } from "drizzle-orm"
import { TRPCError } from "@trpc/server"

import { db } from "../db"
import { ORM } from "../db/orm"
import { documents } from "../db/schemas/Document.schema"
import type { IDocumentSchema, DocumentMetadata } from "../db/schemas/Document.schema"
import { INGEST_TASK, type IngestionJobData } from "../types/ingestion.types"

// ── Types ─────────────────────────────────────────────────────────────────────
export type InputType = "file" | "img" | "vid"

export type { DocumentMetadata as RagPayload }

export interface AddDocumentInput {
  vaultId: string
  filename: string
  fileType: string
  fileSize: number
  mimeType?: string
  courseVault: string
}

export type DocumentWithRag = IDocumentSchema & { ragPayload: DocumentMetadata }

// ── Helpers ───────────────────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"])
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "avi", "mkv", "webm", "m4v"])

function resolveInputType(mimeType: string | undefined, filename: string): InputType {
  const mime = mimeType ?? ""
  if (mime.startsWith("image/")) {
    return "img"
  }
  if (mime.startsWith("video/")) {
    return "vid"
  }
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  if (IMAGE_EXTENSIONS.has(ext)) {
    return "img"
  }
  if (VIDEO_EXTENSIONS.has(ext)) {
    return "vid"
  }
  return "file"
}

// ── Document operations ───────────────────────────────────────────────────────

export async function addDocument(input: AddDocumentInput): Promise<DocumentWithRag> {
  const vault = await ORM.Vault.findById(input.vaultId)
  if (vault == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Vault not found" })
  }

  const filePath = `vault/${input.vaultId}/${input.filename}`
  const inputType = resolveInputType(input.mimeType, input.filename)
  const metadata: DocumentMetadata = {
    inputType,
    vault_id: input.vaultId,
    filename: input.filename,
    courseVault: input.courseVault,
  }

  // Atomic: document row and ingestion job are created in ONE transaction.
  // If either fails, both roll back — no orphaned "pending" documents.
  const doc = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(documents)
      .values({
        vaultId: input.vaultId,
        filename: input.filename,
        fileType: input.fileType,
        filePath,
        fileSize: input.fileSize,
        mimeType: input.mimeType ?? null,
        metadataJson: metadata,
        processingStatus: "pending",
      })
      .returning()

    if (inserted == null) {
      throw new Error("Failed to create document record")
    }

    const jobData: IngestionJobData = {
      documentId: inserted.id,
      vaultId: input.vaultId,
      userId: vault.userId,
      filename: input.filename,
      filePath,
      mimeType: input.mimeType,
      courseVault: input.courseVault,
    }

    await tx.execute(sql`
      SELECT graphile_worker.add_job(
        identifier   => ${INGEST_TASK},
        payload      => ${JSON.stringify(jobData)}::json,
        max_attempts => 3,
        job_key      => ${inserted.id}
      )
    `)

    return inserted
  })

  return { ...doc, ragPayload: metadata }
}

export async function getDocumentsByVaultId(vaultId: string): Promise<IDocumentSchema[]> {
  return ORM.Document.findByVaultId(vaultId)
}

export async function getDocumentById(id: string): Promise<IDocumentSchema> {
  const doc = await ORM.Document.findById(id)
  if (doc == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" })
  }
  return doc
}

export async function deleteDocument(id: string): Promise<{ id: string }> {
  const deletedId = await ORM.Document.deleteById(id)
  if (deletedId == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" })
  }
  return { id: deletedId }
}
