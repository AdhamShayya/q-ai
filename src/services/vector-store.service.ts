/**
 * vector-store.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles insertion of embedded document chunks into the Supabase
 * `document_chunks` table with pgvector embeddings.
 *
 * Uses the Supabase REST API (same pattern as backend/src/ai.ts)
 * to avoid creating additional database connections.
 *
 * Supports batch insertion for performance.
 */

import type { VectorChunkInsert, ChunkMetadata, TextChunk } from "../types/ingestion.types"
import { env } from "../config/config"

// ── Environment ───────────────────────────────────────────────────────────────

const SUPABASE_URL = env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Maximum number of rows to insert in a single Supabase REST call.
 * Keeps payloads under the typical Supabase/PostgREST body size limit.
 */
const INSERT_BATCH_SIZE = 50

// ── Internal Helpers ──────────────────────────────────────────────────────────

/**
 * Inserts a batch of chunk rows via Supabase REST API.
 *
 * @param rows - Array of row objects matching the document_chunks table schema
 * @throws Error if the insert fails
 */
async function insertBatch(rows: Array<Record<string, unknown>>): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("[VectorStore] SUPABASE_URL or SUPABASE_SERVICE_KEY is not configured")
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/document_chunks`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal", // Don't return inserted rows (faster)
    },
    body: JSON.stringify(rows),
  })

  if (response.ok === false) {
    const errorText = await response.text()
    throw new Error(`[VectorStore] Failed to insert chunks: ${response.status} — ${errorText}`)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Stores an array of embedded chunks into the `document_chunks` table.
 *
 * Maps VectorChunkInsert objects into the exact column shape expected by
 * the Supabase/Drizzle schema:
 *   - content      → text
 *   - embedding    → vector (pgvector)
 *   - metadata     → jsonb
 *   - document_id  → uuid FK
 *   - vault_id     → uuid FK
 *   - user_id      → uuid FK
 *   - filename     → text
 *
 * Processes in batches of INSERT_BATCH_SIZE to avoid payload limits.
 *
 * @param chunks - Array of chunk insert payloads
 * @returns Number of successfully inserted chunks
 */
export async function storeVectorChunks(chunks: VectorChunkInsert[]): Promise<number> {
  if (chunks.length === 0) {
    return 0
  }

  console.log(
    `[VectorStore] Storing ${chunks.length} chunks ` + `(batch size: ${INSERT_BATCH_SIZE})`,
  )

  let totalInserted = 0

  for (let i = 0; i < chunks.length; i += INSERT_BATCH_SIZE) {
    const batch = chunks.slice(i, i + INSERT_BATCH_SIZE)
    const batchIndex = Math.floor(i / INSERT_BATCH_SIZE) + 1
    const totalBatches = Math.ceil(chunks.length / INSERT_BATCH_SIZE)

    // Map to Supabase REST column names (snake_case matches the pgTable def)
    const rows = batch
      .filter((chunk) => chunk.embedding && chunk.embedding.length > 0)
      .map((chunk) => ({
        content: chunk.content,
        embedding: `[${chunk.embedding.join(",")}]`, // pgvector format
        metadata: chunk.metadata,
        document_id: chunk.document_id,
        vault_id: chunk.vault_id,
        user_id: chunk.user_id,
        filename: chunk.filename,
      }))

    if (rows.length === 0) {
      console.warn(
        `[VectorStore] Batch ${batchIndex}/${totalBatches} skipped — ` +
          `all chunks had empty embeddings`,
      )
      continue
    }

    try {
      await insertBatch(rows)
      totalInserted += rows.length
      console.log(
        `[VectorStore] Batch ${batchIndex}/${totalBatches} inserted ` + `(${rows.length} chunks)`,
      )
    } catch (error) {
      console.error(
        `[VectorStore] Batch ${batchIndex}/${totalBatches} failed:`,
        error instanceof Error ? error.message : error,
      )

      // Retry individual rows in the failed batch
      for (const row of rows) {
        try {
          await insertBatch([row])
          totalInserted += 1
        } catch (individualError) {
          console.error(
            `[VectorStore] Individual insert failed for chunk in document ` + `${row.document_id}:`,
            individualError instanceof Error ? individualError.message : individualError,
          )
        }
      }
    }
  }

  console.log(`[VectorStore] Completed: ${totalInserted}/${chunks.length} chunks stored`)

  return totalInserted
}

/**
 * Convenience function: builds VectorChunkInsert objects from separate
 * chunks, embeddings, and metadata arrays — then stores them.
 *
 * This is the primary entry point used by the ingestion processor.
 *
 * @param chunks      - Text chunks from the chunking service
 * @param embeddings  - Embedding vectors from the embedding service (parallel array)
 * @param metadatas   - Metadata objects from the metadata utility (parallel array)
 * @param documentId  - Parent document UUID
 * @param vaultId     - Parent vault UUID
 * @param userId      - Owning user UUID
 * @param filename    - Original filename
 * @returns Number of successfully stored chunks
 */
export async function storeDocumentChunks(
  chunks: TextChunk[],
  embeddings: number[][],
  metadatas: ChunkMetadata[],
  documentId: string,
  vaultId: string,
  userId: string,
  filename: string,
): Promise<number> {
  // Validate parallel array lengths
  if (chunks.length !== embeddings.length || chunks.length !== metadatas.length) {
    throw new Error(
      `[VectorStore] Array length mismatch: ` +
        `chunks=${chunks.length}, embeddings=${embeddings.length}, ` +
        `metadatas=${metadatas.length}`,
    )
  }

  // Build the insert payloads
  // todo - check the error
  const insertPayloads: VectorChunkInsert[] = chunks.map((chunk, i) => ({
    content: chunk.content,
    embedding: embeddings[i],
    metadata: metadatas[i],
    document_id: documentId,
    vault_id: vaultId,
    user_id: userId,
    filename,
  }))

  return storeVectorChunks(insertPayloads)
}
