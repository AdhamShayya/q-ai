/**
 * chunking.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements recursive text chunking with configurable size and overlap.
 * Designed for optimal vector embedding quality — chunks are semantically
 * meaningful units split at natural boundaries (paragraphs, sentences).
 *
 * Default config: chunk size 1000 chars, overlap 200 chars.
 */

import type { TextChunk } from "../types/ingestion.types";

// ── Configuration ─────────────────────────────────────────────────────────────

/** Default maximum characters per chunk. */
const DEFAULT_CHUNK_SIZE = 1000;

/** Default overlap in characters between adjacent chunks. */
const DEFAULT_OVERLAP = 200;

// ── Separator Hierarchy ───────────────────────────────────────────────────────

/**
 * Ordered list of separators for recursive splitting.
 * We try the "largest" separator first (double newline = paragraph break),
 * then fall back to progressively smaller units.
 */
const SEPARATORS = [
  "\n\n",   // Paragraph breaks
  "\n",     // Line breaks
  ". ",     // Sentence boundaries
  "? ",     // Question marks
  "! ",     // Exclamation marks
  "; ",     // Semicolons
  ", ",     // Commas
  " ",      // Words
  "",       // Character-level (last resort)
];

// ── Internal Helpers ──────────────────────────────────────────────────────────

/**
 * Splits text using the first separator that produces fragments within
 * the target size. Recurses with smaller separators when needed.
 *
 * This mirrors LangChain's RecursiveCharacterTextSplitter strategy.
 *
 * @param text          - The text to split
 * @param chunkSize     - Maximum characters per chunk
 * @param separatorIdx  - Current index into the SEPARATORS array
 * @returns Array of text fragments, each within the target chunk size
 */
function recursiveSplit(
  text: string,
  chunkSize: number,
  separatorIdx: number = 0
): string[] {
  // Base case: text fits in a single chunk
  if (text.length <= chunkSize) {
    return [text];
  }

  // If we've exhausted all separators, hard-cut at chunkSize
  if (separatorIdx >= SEPARATORS.length) {
    const result: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      result.push(text.slice(i, i + chunkSize));
    }
    return result;
  }

  const separator = SEPARATORS[separatorIdx];

  // If separator is empty string, do character-level split
  if (separator === "") {
    const result: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      result.push(text.slice(i, i + chunkSize));
    }
    return result;
  }

  const fragments = text.split(separator);

  // If the separator didn't actually split anything, try the next one
  if (fragments.length <= 1) {
    return recursiveSplit(text, chunkSize, separatorIdx + 1);
  }

  // Merge fragments back into chunks that respect the size limit
  const merged: string[] = [];
  let current = "";

  for (const fragment of fragments) {
    const candidate = current
      ? current + separator + fragment
      : fragment;

    if (candidate.length <= chunkSize) {
      current = candidate;
    } else {
      // Current chunk is full — push it
      if (current) {
        merged.push(current);
      }

      // If the fragment itself exceeds chunk size, recursively split it
      if (fragment.length > chunkSize) {
        const subParts = recursiveSplit(
          fragment,
          chunkSize,
          separatorIdx + 1
        );
        // Add all sub-parts except the last (which becomes the new current)
        for (let i = 0; i < subParts.length - 1; i++) {
          merged.push(subParts[i]);
        }
        current = subParts[subParts.length - 1] ?? "";
      } else {
        current = fragment;
      }
    }
  }

  // Don't forget the last accumulated segment
  if (current) {
    merged.push(current);
  }

  return merged;
}

/**
 * Applies overlap between adjacent chunks by prepending the tail of the
 * previous chunk to the beginning of the current chunk.
 *
 * @param chunks   - Array of non-overlapping text fragments
 * @param overlap  - Number of overlap characters
 * @returns New array of overlapping chunks
 */
function applyOverlap(chunks: string[], overlap: number): string[] {
  if (overlap <= 0 || chunks.length <= 1) return chunks;

  const result: string[] = [chunks[0]];

  for (let i = 1; i < chunks.length; i++) {
    const prevChunk = chunks[i - 1];
    // Take the last `overlap` characters of the previous chunk
    const overlapText = prevChunk.slice(-overlap);
    result.push(overlapText + chunks[i]);
  }

  return result;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Splits a text string into semantically meaningful chunks using a
 * recursive separator hierarchy. Applies overlap for context continuity
 * across chunk boundaries.
 *
 * @param text      - Source text to chunk
 * @param chunkSize - Maximum characters per chunk (default: 1000)
 * @param overlap   - Overlap characters between chunks (default: 200)
 * @returns Array of TextChunk objects with content and index
 */
export function chunkText(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP
): TextChunk[] {
  // Guard: empty or whitespace-only text
  const cleaned = text.trim();
  if (!cleaned) return [];

  // Step 1: Recursive split into non-overlapping fragments
  const rawChunks = recursiveSplit(cleaned, chunkSize);

  // Step 2: Apply overlap between adjacent chunks
  const overlappedChunks = applyOverlap(rawChunks, overlap);

  // Step 3: Filter out empty chunks and map to TextChunk objects
  return overlappedChunks
    .map((content) => content.trim())
    .filter((content) => content.length > 0)
    .map((content, index) => ({
      content,
      index,
    }));
}

/**
 * Estimates the number of chunks that will be produced from a text
 * without actually performing the chunking. Useful for progress tracking.
 *
 * @param textLength  - Character count of the source text
 * @param chunkSize   - Chunk size setting
 * @param overlap     - Overlap setting
 * @returns Estimated chunk count
 */
export function estimateChunkCount(
  textLength: number,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP
): number {
  if (textLength <= chunkSize) return 1;
  const effectiveStep = chunkSize - overlap;
  return Math.ceil(textLength / effectiveStep);
}
