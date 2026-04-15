/**
 * file.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles file retrieval from Supabase Storage and file-type routing.
 * Downloads the raw binary buffer for downstream AI analysis.
 *
 * Follows the same Supabase REST pattern established in backend/src/ai.ts.
 */

import type { FileCategory, IngestionJobData } from "../types/ingestion.types";
import { FILE_CATEGORY_MAP } from "../types/ingestion.types";

// ── Environment ───────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FileDownloadResult {
  /** Raw file bytes. */
  buffer: Buffer;
  /** Base64-encoded content (for Gemini inline_data). */
  base64: string;
  /** Resolved MIME type. */
  mimeType: string;
  /** Resolved file category for pipeline routing. */
  category: FileCategory;
  /** Original filename. */
  filename: string;
}

// ── File Extension → MIME ─────────────────────────────────────────────────────

const EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
  mp4: "video/mp4",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// ── Internal Helpers ──────────────────────────────────────────────────────────

/**
 * Extracts the lowercase file extension from a filename.
 */
function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length >= 2 ? (parts.pop() ?? "").toLowerCase() : "";
}

/**
 * Detects the file category from filename + optional MIME type.
 * Extension-based detection is used as the primary strategy since
 * MIME types from uploads can be unreliable.
 */
export function detectFileCategory(
  filename: string,
  mimeType?: string
): FileCategory {
  const ext = getExtension(filename);
  const fromExt = FILE_CATEGORY_MAP[ext];
  if (fromExt) return fromExt;

  // Fallback: derive from MIME prefix
  if (mimeType) {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType === "application/pdf") return "document";
  }

  // Default: treat as text/document for extraction attempt
  return "document";
}

/**
 * Resolves a MIME type string from extension or passed-in MIME.
 */
function resolveMimeType(filename: string, mimeType?: string): string {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;
  const ext = getExtension(filename);
  return EXT_TO_MIME[ext] ?? "application/octet-stream";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Downloads a file from Supabase Storage and returns it as a buffer
 * with resolved category and MIME type metadata.
 *
 * Uses the Supabase Storage REST endpoint:
 *   GET /storage/v1/object/{bucket}/{path}
 *
 * The file's `filePath` from the documents table is used directly as the
 * Storage object path (e.g. "vault/{vaultId}/{filename}").
 *
 * @param jobData - Ingestion job payload containing filePath + filename
 * @returns Download result with buffer, base64, MIME, and category
 * @throws Error if Supabase is misconfigured or the download fails
 */
export async function downloadFile(
  jobData: IngestionJobData
): Promise<FileDownloadResult> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error(
      "[FileService] SUPABASE_URL or SUPABASE_SERVICE_KEY is not configured"
    );
  }

  const storageUrl = `${SUPABASE_URL}/storage/v1/object/${jobData.filePath}`;

  const response = await fetch(storageUrl, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[FileService] Failed to download file "${jobData.filename}" ` +
        `from "${storageUrl}": ${response.status} — ${errorText}`
    );
  }

  // Convert the response body to a Node.js Buffer
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");

  const mimeType = resolveMimeType(jobData.filename, jobData.mimeType);
  const category = detectFileCategory(jobData.filename, jobData.mimeType);

  return {
    buffer,
    base64,
    mimeType,
    category,
    filename: jobData.filename,
  };
}

/**
 * Checks whether a document with the given ID has already been processed
 * (i.e. chunks already exist in document_chunks). Used to prevent
 * duplicate processing on job retries.
 *
 * @param documentId - UUID of the document
 * @returns True if at least one chunk already exists
 */
export async function hasExistingChunks(documentId: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return false;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/document_chunks?document_id=eq.${documentId}&select=id&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    if (!response.ok) return false;
    const data = await response.json();
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Deletes existing chunks for a document before re-processing.
 * Called during retry/re-ingestion to avoid duplicate data.
 *
 * @param documentId - UUID of the document whose chunks should be purged
 */
export async function purgeExistingChunks(documentId: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;

  await fetch(
    `${SUPABASE_URL}/rest/v1/document_chunks?document_id=eq.${documentId}`,
    {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
}
