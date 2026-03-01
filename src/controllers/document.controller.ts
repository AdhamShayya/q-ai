import { TRPCError } from "@trpc/server"

import { ORM } from "../db/orm"
import type { IDocumentSchema } from "../db/schemas/Document.schema"

// ── Types ─────────────────────────────────────────────────────────────────────

/** Matches the RAG system ingestion contract */
export type InputType = "file" | "img" | "vid"

export interface RagPayload {
  inputType: InputType
  vault_id: string
  filename: string
  courseVault: string
}

export interface AddDocumentInput {
  vaultId: string
  filename: string
  fileType: string
  fileSize: number
  mimeType?: string
  courseVault: string
}

export type DocumentWithRag = IDocumentSchema & { ragPayload: RagPayload }

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

  const inputType = resolveInputType(input.mimeType, input.filename)

  const ragPayload: RagPayload = {
    inputType,
    vault_id: input.vaultId,
    filename: input.filename,
    courseVault: input.courseVault,
  }

  const doc = await ORM.Document.create({
    vaultId: input.vaultId,
    filename: input.filename,
    fileType: input.fileType,
    filePath: `vault/${input.vaultId}/${input.filename}`,
    fileSize: input.fileSize,
    mimeType: input.mimeType ?? null,
    metadataJson: ragPayload,
    processingStatus: "pending",
  })

  return { ...doc, ragPayload }
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
