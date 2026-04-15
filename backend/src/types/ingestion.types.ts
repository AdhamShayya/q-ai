/**
 * ingestion.types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central type definitions for the document ingestion + AI processing pipeline.
 * All queue jobs, services, and processors import their contracts from here.
 */

// ── Processing Status ─────────────────────────────────────────────────────────

/** Mirrors the `processing_status` pgEnum on the `documents` table. */
export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

// ── File Categories ───────────────────────────────────────────────────────────

/** High-level file category used to route AI analysis strategy. */
export type FileCategory = "image" | "document" | "video" | "text";

/** Supported file extensions mapped to their categories. */
export const FILE_CATEGORY_MAP: Record<string, FileCategory> = {
  // Images
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  // Documents
  pdf: "document",
  // Video
  mp4: "video",
  // Text extraction mode
  docx: "text",
  xlsx: "text",
} as const;

// ── Queue Job Payload ─────────────────────────────────────────────────────────

/**
 * Shape of the data pushed into the BullMQ "document-ingestion" queue.
 * The controller constructs this immediately after storing the file and
 * creating the DB record — then returns to the client without waiting.
 */
export interface IngestionJobData {
  /** UUID of the document row created by the controller. */
  documentId: string;
  /** UUID of the parent vault. */
  vaultId: string;
  /** UUID of the owning user (resolved from the vault). */
  userId: string;
  /** Original uploaded filename (e.g. "notes.pdf"). */
  filename: string;
  /** Supabase Storage path (e.g. "vault/{vaultId}/{filename}"). */
  filePath: string;
  /** MIME type of the uploaded file, if available. */
  mimeType?: string;
  /** Vault course name (used as context source tag). */
  courseVault?: string;
}

// ── AI Analysis Results ───────────────────────────────────────────────────────

/** Structured output from AI image analysis. */
export interface ImageAnalysisResult {
  extractedText: string;
  visualExplanation: string;
  rawContent: string;
}

/** Structured output from AI document (PDF) analysis. */
export interface DocumentAnalysisResult {
  extractedText: string;
  tablesDiagramsExplanation: string;
  rawContent: string;
}

/** Structured output from AI video analysis. */
export interface VideoAnalysisResult {
  summary: string;
  keyConcepts: string[];
  studyNotes: string;
  rawContent: string;
}

/** Structured output from text-mode extraction (DOCX / XLSX). */
export interface TextExtractionResult {
  extractedText: string;
  rawContent: string;
}

/** Union type representing any AI processing result. */
export type AIProcessingResult =
  | ImageAnalysisResult
  | DocumentAnalysisResult
  | VideoAnalysisResult
  | TextExtractionResult;

// ── Chunk ─────────────────────────────────────────────────────────────────────

/** A single text chunk produced by the recursive chunking service. */
export interface TextChunk {
  /** The chunk content string. */
  content: string;
  /** Zero-based index of the chunk within its parent document. */
  index: number;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

/**
 * Metadata shape stored alongside each vector chunk in `document_chunks.metadata`.
 * Must match the required format specified in the system design document.
 */
export interface ChunkMetadata {
  vault_id: string;
  document_id: string;
  user_id: string;
  filename: string;
  source: string;
  timestamp: string;
  /** Zero-based chunk index within the document. */
  chunk_index?: number;
  /** Total number of chunks produced from the document. */
  total_chunks?: number;
}

// ── Vector Storage Payload ────────────────────────────────────────────────────

/** Shape of a single row to be inserted into the `document_chunks` table. */
export interface VectorChunkInsert {
  content: string;
  embedding: number[];
  metadata: ChunkMetadata;
  document_id: string;
  vault_id: string;
  user_id: string;
  filename: string;
}

// ── Pipeline Result ───────────────────────────────────────────────────────────

/** Final result returned by the ingestion processor after the full pipeline runs. */
export interface IngestionPipelineResult {
  documentId: string;
  chunksCreated: number;
  fileCategory: FileCategory;
  processingTimeMs: number;
}

// ── Queue Configuration ───────────────────────────────────────────────────────

/** Centralized queue configuration constants. */
export const QUEUE_CONFIG = {
  /** Queue name registered in BullMQ / Redis. */
  QUEUE_NAME: "document-ingestion",
  /** Max concurrent jobs a single worker will process. */
  CONCURRENCY: 5,
  /** Maximum retry attempts on failure. */
  MAX_RETRIES: 3,
  /** Backoff strategy. */
  BACKOFF: {
    type: "exponential" as const,
    delay: 2000, // Base delay in ms (2s → 4s → 8s)
  },
} as const;

// ── API Response ──────────────────────────────────────────────────────────────

/** Shape of the immediate HTTP response returned to the client after upload. */
export interface IngestionResponse {
  success: boolean;
  status: "processing";
  documentId: string;
}
