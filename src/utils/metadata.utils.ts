/**
 * metadata.utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Helpers for constructing the standardized metadata object that accompanies
 * each vector chunk stored in the `document_chunks` table.
 *
 * The metadata shape is dictated by the system design spec and must remain
 * consistent across all ingestion pathways.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Required metadata shape for every vector chunk.
 * Must match the format specified in the system design document.
 */
export interface ChunkMetadata {
  vault_id: string;
  document_id: string;
  user_id: string;
  filename: string;
  source: string;
  timestamp: string;
  chunk_index?: number;
  total_chunks?: number;
}

/**
 * Input parameters for building chunk metadata.
 */
export interface BuildMetadataInput {
  vaultId: string;
  documentId: string;
  userId: string;
  filename: string;
  /** Human-readable source label (e.g. vault/course name). Defaults to "upload". */
  source?: string;
  /** ISO timestamp override. Defaults to Date.now(). */
  timestamp?: string;
  /** Zero-based index of this chunk within the document. */
  chunkIndex?: number;
  /** Total number of chunks produced from the document. */
  totalChunks?: number;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Builds the canonical metadata object for a single vector chunk.
 *
 * @param input - All fields required to construct the metadata
 * @returns A frozen metadata object matching the ChunkMetadata contract
 */
export function buildChunkMetadata(input: BuildMetadataInput): ChunkMetadata {
  const metadata: ChunkMetadata = {
    vault_id: input.vaultId,
    document_id: input.documentId,
    user_id: input.userId,
    filename: input.filename,
    source: input.source ?? "upload",
    timestamp: input.timestamp ?? new Date().toISOString(),
  };

  // Attach optional positional info when available
  if (input.chunkIndex !== undefined) {
    metadata.chunk_index = input.chunkIndex;
  }
  if (input.totalChunks !== undefined) {
    metadata.total_chunks = input.totalChunks;
  }

  return Object.freeze(metadata);
}

/**
 * Builds an array of metadata objects — one per chunk — sharing the same
 * base document context but with unique positional indices.
 *
 * @param baseInput  - Shared metadata fields (vaultId, documentId, userId, etc.)
 * @param totalChunks - Total number of chunks for this document
 * @returns Array of ChunkMetadata, one per chunk index
 */
export function buildBatchMetadata(
  baseInput: Omit<BuildMetadataInput, "chunkIndex" | "totalChunks">,
  totalChunks: number
): ChunkMetadata[] {
  const timestamp = new Date().toISOString();

  return Array.from({ length: totalChunks }, (_, i) =>
    buildChunkMetadata({
      ...baseInput,
      timestamp,
      chunkIndex: i,
      totalChunks,
    })
  );
}
