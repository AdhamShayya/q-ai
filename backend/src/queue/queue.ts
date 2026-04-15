/**
 * queue.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * BullMQ queue configuration and factory for the document ingestion pipeline.
 *
 * Exports:
 *   - ingestionQueue    → The BullMQ Queue instance (used to push jobs)
 *   - addIngestionJob   → Helper to enqueue a document for processing
 *   - getRedisConnection → Shared IORedis connection config
 *
 * Queue name: "document-ingestion"
 * Retry:      3 attempts with exponential backoff (2s base)
 * Concurrency: 5 (configured on the worker side)
 *
 * ⚠ Requires `bullmq` and `ioredis` packages to be installed.
 */

import { Queue } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import type { IngestionJobData, IngestionResponse } from "../types/ingestion.types";
import { QUEUE_CONFIG } from "../types/ingestion.types";

// ── Redis Connection ──────────────────────────────────────────────────────────

/**
 * Returns the Redis connection options used by both the Queue and Worker.
 * Reads from REDIS_URL (full connection string) or falls back to
 * individual REDIS_HOST / REDIS_PORT environment variables.
 *
 * Default: localhost:6379
 */
export function getRedisConnection(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    // Parse the Redis URL for BullMQ's ConnectionOptions format
    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port || "6379", 10),
        password: url.password || undefined,
        username: url.username || undefined,
      };
    } catch {
      console.warn(
        "[Queue] Failed to parse REDIS_URL, falling back to defaults"
      );
    }
  }

  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

// ── Queue Instance ────────────────────────────────────────────────────────────

/**
 * The BullMQ Queue instance for document ingestion jobs.
 *
 * Jobs are added here by the API controller immediately after a document
 * record is created. The worker (ingestion.worker.ts) picks them up
 * asynchronously and processes them through the full pipeline.
 */
export const ingestionQueue = new Queue<IngestionJobData>(
  QUEUE_CONFIG.QUEUE_NAME,
  {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: QUEUE_CONFIG.MAX_RETRIES,
      backoff: {
        type: QUEUE_CONFIG.BACKOFF.type,
        delay: QUEUE_CONFIG.BACKOFF.delay,
      },
      removeOnComplete: {
        count: 1000, // Keep last 1000 completed jobs for observability
        age: 24 * 60 * 60, // Remove completed jobs older than 24 hours
      },
      removeOnFail: {
        count: 5000, // Keep more failed jobs for debugging
        age: 7 * 24 * 60 * 60, // Keep failed jobs for 7 days
      },
    },
  }
);

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Adds a new document ingestion job to the queue.
 *
 * This is the integration point between the API layer and the async
 * processing pipeline. The controller calls this after:
 *   1. Storing the file in Supabase Storage
 *   2. Creating the document record in the DB
 *
 * The function returns immediately — the caller does NOT wait for processing.
 *
 * @param jobData - Ingestion job payload
 * @returns The standard immediate response for the API client
 */
export async function addIngestionJob(
  jobData: IngestionJobData
): Promise<IngestionResponse> {
  const job = await ingestionQueue.add(
    `ingest-${jobData.filename}`, // Human-readable job name
    jobData,
    {
      // Priority: lower number = higher priority
      // Could be extended to prioritize smaller files or premium users
      priority: 1,
    }
  );

  console.log(
    `[Queue] Job ${job.id} added for document: ${jobData.filename} ` +
      `(doc: ${jobData.documentId})`
  );

  return {
    success: true,
    status: "processing",
    documentId: jobData.documentId,
  };
}

/**
 * Returns the current queue health metrics.
 * Useful for monitoring dashboards and health check endpoints.
 */
export async function getQueueHealth(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    ingestionQueue.getWaitingCount(),
    ingestionQueue.getActiveCount(),
    ingestionQueue.getCompletedCount(),
    ingestionQueue.getFailedCount(),
    ingestionQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * Gracefully shuts down the queue connection.
 * Should be called during application shutdown.
 */
export async function closeQueue(): Promise<void> {
  await ingestionQueue.close();
  console.log("[Queue] Ingestion queue closed");
}
