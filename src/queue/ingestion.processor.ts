/**
 * ingestion.processor.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Orchestrates the full document ingestion pipeline:
 *
 *   1. Download file from Supabase Storage
 *   2. Detect file type and route to AI processing
 *   3. Extract structured text via Gemini
 *   4. Chunk the extracted text
 *   5. Generate embeddings (batch)
 *   6. Store vectors in document_chunks
 *   7. Update document processing status
 *
 * This module is called by the BullMQ worker and contains NO queue logic
 * itself — pure pipeline orchestration for clean separation of concerns.
 */

import type {
  IngestionJobData,
  IngestionPipelineResult,
  AIProcessingResult,
  ProcessingStatus,
} from "../types/ingestion.types";

// ── Service Imports ───────────────────────────────────────────────────────────

import { downloadFile, hasExistingChunks, purgeExistingChunks } from "../services/file.service";
import { processFile } from "../services/ai-processing.service";
import { chunkText } from "../services/chunking.service";
import { generateEmbeddings } from "../services/embedding.service";
import { storeDocumentChunks } from "../services/vector-store.service";

// ── Environment ───────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

// ── Status Management ─────────────────────────────────────────────────────────

/**
 * Updates the processing status and optional error message on the
 * `documents` table via Supabase REST API.
 *
 * @param documentId       - UUID of the document to update
 * @param processingStatus - New status value
 * @param processingError  - Error message (null on success)
 */
async function updateDocumentStatus(
  documentId: string,
  processingStatus: ProcessingStatus,
  processingError: string | null = null
): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn(
      "[Processor] Cannot update document status — Supabase not configured"
    );
    return;
  }

  try {
    const body: Record<string, unknown> = {
      processing_status: processingStatus,
      processing_error: processingError,
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/documents?id=eq.${documentId}`,
      {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Processor] Failed to update document status: ${errorText}`
      );
    }
  } catch (error) {
    console.error(
      "[Processor] Error updating document status:",
      error instanceof Error ? error.message : error
    );
  }
}

// ── Text Extraction Helper ────────────────────────────────────────────────────

/**
 * Extracts the raw text content from any AI processing result type.
 * The rawContent field is present on all result variants and contains
 * the complete AI-generated analysis text.
 */
function extractTextFromResult(result: AIProcessingResult): string {
  return result.rawContent;
}

// ── Metadata Builder ──────────────────────────────────────────────────────────

/**
 * Builds the metadata object that accompanies each vector chunk.
 * Matches the required ChunkMetadata shape from ingestion.types.ts.
 */
function buildMetadata(
  jobData: IngestionJobData,
  chunkIndex: number,
  totalChunks: number
) {
  return {
    vault_id: jobData.vaultId,
    document_id: jobData.documentId,
    user_id: jobData.userId,
    filename: jobData.filename,
    source: jobData.courseVault ?? "upload",
    timestamp: new Date().toISOString(),
    chunk_index: chunkIndex,
    total_chunks: totalChunks,
  };
}

// ── Main Pipeline ─────────────────────────────────────────────────────────────

/**
 * Executes the full document ingestion pipeline for a single job.
 *
 * This function is designed to be called by the BullMQ worker's
 * processor callback. It handles its own error reporting by updating
 * the document status on failure.
 *
 * Pipeline stages:
 *   1. Mark document as "processing"
 *   2. Check for duplicate processing (idempotency guard)
 *   3. Download file from Supabase Storage
 *   4. Route to AI analysis based on file type
 *   5. Chunk the extracted text
 *   6. Generate embeddings in batch
 *   7. Store vector chunks in document_chunks
 *   8. Mark document as "completed"
 *
 * @param jobData - The ingestion job payload from the queue
 * @returns Pipeline result with metrics
 * @throws Error — the worker catches this and handles retries
 */
export async function processIngestionJob(
  jobData: IngestionJobData
): Promise<IngestionPipelineResult> {
  const startTime = Date.now();
  const { documentId, filename } = jobData;

  console.log(`\n${"═".repeat(60)}`);
  console.log(`[Processor] Starting ingestion for: ${filename}`);
  console.log(`[Processor] Document ID: ${documentId}`);
  console.log(`${"═".repeat(60)}\n`);

  // ── Step 1: Mark as processing ──────────────────────────────────────────
  await updateDocumentStatus(documentId, "processing");

  try {
    // ── Step 2: Idempotency guard ───────────────────────────────────────────
    // On retry, purge any partially-written chunks to avoid duplicates
    const existingChunks = await hasExistingChunks(documentId);
    if (existingChunks) {
      console.log(
        `[Processor] Found existing chunks for ${documentId} — purging before re-processing`
      );
      await purgeExistingChunks(documentId);
    }

    // ── Step 3: Download file from Supabase Storage ─────────────────────────
    console.log(`[Processor] Downloading file: ${filename}`);
    const file = await downloadFile(jobData);
    console.log(
      `[Processor] Downloaded: ${file.filename} (${file.category}, ` +
        `${file.buffer.length} bytes)`
    );

    // ── Step 4: AI Analysis ─────────────────────────────────────────────────
    console.log(`[Processor] Running AI analysis (${file.category} mode)...`);
    const aiResult = await processFile(file);
    const extractedText = extractTextFromResult(aiResult);

    if (!extractedText || extractedText.trim().length === 0) {
      console.warn(
        `[Processor] AI returned empty text for ${filename} — ` +
          `marking as completed with 0 chunks`
      );
      await updateDocumentStatus(documentId, "completed");
      return {
        documentId,
        chunksCreated: 0,
        fileCategory: file.category,
        processingTimeMs: Date.now() - startTime,
      };
    }

    console.log(
      `[Processor] AI extracted ${extractedText.length} characters`
    );

    // ── Step 5: Chunk the text ──────────────────────────────────────────────
    console.log(`[Processor] Chunking text...`);
    const chunks = chunkText(extractedText);
    console.log(`[Processor] Produced ${chunks.length} chunks`);

    // ── Step 6: Generate embeddings (batch) ─────────────────────────────────
    console.log(`[Processor] Generating embeddings...`);
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkTexts);
    console.log(`[Processor] Generated ${embeddings.length} embeddings`);

    // ── Step 7: Build metadata for each chunk ───────────────────────────────
    const metadatas = chunks.map((chunk) =>
      buildMetadata(jobData, chunk.index, chunks.length)
    );

    // ── Step 8: Store vector chunks ─────────────────────────────────────────
    console.log(`[Processor] Storing vector chunks...`);
    const storedCount = await storeDocumentChunks(
      chunks,
      embeddings,
      metadatas,
      documentId,
      jobData.vaultId,
      jobData.userId,
      filename
    );

    // ── Step 9: Mark as completed ───────────────────────────────────────────
    await updateDocumentStatus(documentId, "completed");

    const processingTimeMs = Date.now() - startTime;

    console.log(`\n${"─".repeat(60)}`);
    console.log(`[Processor] ✅ Ingestion complete for: ${filename}`);
    console.log(`[Processor]    Chunks created: ${storedCount}`);
    console.log(`[Processor]    File category:  ${file.category}`);
    console.log(`[Processor]    Duration:       ${processingTimeMs}ms`);
    console.log(`${"─".repeat(60)}\n`);

    return {
      documentId,
      chunksCreated: storedCount,
      fileCategory: file.category,
      processingTimeMs,
    };
  } catch (error) {
    // ── Failure path ──────────────────────────────────────────────────────
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    console.error(
      `[Processor] ❌ Ingestion failed for ${filename}: ${errorMessage}`
    );

    await updateDocumentStatus(documentId, "failed", errorMessage);

    // Re-throw so BullMQ can handle retries
    throw error;
  }
}
