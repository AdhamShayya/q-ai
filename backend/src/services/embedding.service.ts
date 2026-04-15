/**
 * embedding.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates vector embeddings using the Gemini Embedding API.
 * Implements BATCH processing for performance — sends multiple chunks
 * in a single API call using the batchEmbedContents endpoint.
 *
 * Model: models/gemini-embedding-001
 */

// ── Environment ───────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Gemini embedding model identifier. */
const EMBEDDING_MODEL = "models/gemini-embedding-001";

/** Batch embed endpoint — processes multiple texts in a single request. */
const BATCH_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:batchEmbedContents`;

/** Single embed endpoint — fallback for individual chunks. */
const SINGLE_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:embedContent`;

/**
 * Maximum number of texts to embed in a single batch request.
 * Gemini's batchEmbedContents supports up to 100 per call.
 */
const MAX_BATCH_SIZE = 100;

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmbeddingResponse {
  embedding: {
    values: number[];
  };
}

interface BatchEmbeddingResponse {
  embeddings: Array<{
    values: number[];
  }>;
}

// ── Internal Helpers ──────────────────────────────────────────────────────────

/**
 * Generates an embedding for a single text string.
 * Used as a fallback when batch mode encounters issues.
 *
 * @param text - Text to embed
 * @returns Embedding vector as number[]
 */
async function embedSingle(text: string): Promise<number[]> {
  if (!GEMINI_API_KEY) {
    throw new Error("[EmbeddingService] GEMINI_API_KEY is not configured");
  }

  const url = `${SINGLE_EMBED_URL}?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      content: {
        parts: [{ text }],
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[EmbeddingService] Gemini embedding API error: ${errorText}`
    );
  }

  const data: EmbeddingResponse = await response.json();
  return data.embedding.values;
}

/**
 * Processes a single batch of texts (up to MAX_BATCH_SIZE) through the
 * Gemini batchEmbedContents endpoint.
 *
 * @param texts - Array of text strings to embed (max MAX_BATCH_SIZE)
 * @returns Array of embedding vectors in the same order as input
 */
async function embedBatchChunk(texts: string[]): Promise<number[][]> {
  if (!GEMINI_API_KEY) {
    throw new Error("[EmbeddingService] GEMINI_API_KEY is not configured");
  }

  const url = `${BATCH_EMBED_URL}?key=${GEMINI_API_KEY}`;

  // Build the batch request payload
  const requests = texts.map((text) => ({
    model: EMBEDDING_MODEL,
    content: {
      parts: [{ text }],
    },
  }));

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[EmbeddingService] Gemini batch embedding API error: ${errorText}`
    );
  }

  const data: BatchEmbeddingResponse = await response.json();

  if (!data.embeddings || data.embeddings.length !== texts.length) {
    throw new Error(
      `[EmbeddingService] Batch response mismatch: expected ${texts.length} ` +
        `embeddings, got ${data.embeddings?.length ?? 0}`
    );
  }

  return data.embeddings.map((e) => e.values);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates embeddings for an array of text chunks using batch processing.
 *
 * For arrays larger than MAX_BATCH_SIZE, the input is split into
 * sub-batches and processed sequentially to avoid API limits.
 *
 * @param texts - Array of text strings to embed
 * @returns Array of embedding vectors (number[][]), same order as input
 * @throws Error if the Gemini API is unreachable or returns invalid data
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) return [];

  console.log(
    `[EmbeddingService] Generating embeddings for ${texts.length} chunks ` +
      `(batch size: ${MAX_BATCH_SIZE})`
  );

  const allEmbeddings: number[][] = [];

  // Process in sub-batches to respect API limits
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);
    const batchIndex = Math.floor(i / MAX_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(texts.length / MAX_BATCH_SIZE);

    console.log(
      `[EmbeddingService] Processing batch ${batchIndex}/${totalBatches} ` +
        `(${batch.length} chunks)`
    );

    try {
      const embeddings = await embedBatchChunk(batch);
      allEmbeddings.push(...embeddings);
    } catch (error) {
      // Fallback: process individually if batch fails
      console.warn(
        `[EmbeddingService] Batch ${batchIndex} failed, falling back to individual processing:`,
        error instanceof Error ? error.message : error
      );

      for (const text of batch) {
        try {
          const embedding = await embedSingle(text);
          allEmbeddings.push(embedding);
        } catch (individualError) {
          console.error(
            `[EmbeddingService] Individual embedding failed:`,
            individualError instanceof Error
              ? individualError.message
              : individualError
          );
          // Push a zero vector as placeholder to maintain index alignment
          // The vector store can filter these out or flag them
          allEmbeddings.push([]);
        }
      }
    }
  }

  console.log(
    `[EmbeddingService] Completed: ${allEmbeddings.length} embeddings generated`
  );

  return allEmbeddings;
}

/**
 * Generates a single embedding for a query string.
 * Used for similarity search at query time.
 *
 * @param text - Query text to embed
 * @returns Embedding vector as number[]
 */
export async function generateQueryEmbedding(
  text: string
): Promise<number[]> {
  return embedSingle(text);
}
