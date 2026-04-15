/**
 * ingestion.worker.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * BullMQ Worker for the document ingestion pipeline.
 *
 * This module creates and manages the Worker instance that pulls jobs from
 * the "document-ingestion" queue and processes them through the full
 * ingestion pipeline (download → AI → chunk → embed → store).
 *
 * Can be run as a standalone process or imported and started alongside
 * the main API server.
 *
 * Usage (standalone):
 *   npx tsx backend/src/queue/ingestion.worker.ts
 *
 * Usage (embedded):
 *   import { startIngestionWorker } from './backend/src/queue/ingestion.worker';
 *   startIngestionWorker();
 *
 * ⚠ Requires `bullmq` and `ioredis` packages to be installed.
 */

import { Worker, type Job } from "bullmq";
import type { IngestionJobData, IngestionPipelineResult } from "../types/ingestion.types";
import { QUEUE_CONFIG } from "../types/ingestion.types";
import { getRedisConnection } from "./queue";
import { processIngestionJob } from "./ingestion.processor";

// ── Worker Instance ───────────────────────────────────────────────────────────

let worker: Worker<IngestionJobData, IngestionPipelineResult> | null = null;

// ── Worker Factory ────────────────────────────────────────────────────────────

/**
 * Creates and starts the BullMQ worker for document ingestion.
 *
 * Configuration:
 *   - Queue: "document-ingestion"
 *   - Concurrency: 5 (processes 5 jobs in parallel)
 *   - Each job is processed through processIngestionJob()
 *   - Automatic retry is handled by BullMQ based on queue config
 *
 * @returns The Worker instance (for external lifecycle management)
 */
export function startIngestionWorker(): Worker<
  IngestionJobData,
  IngestionPipelineResult
> {
  if (worker) {
    console.log("[Worker] Ingestion worker is already running");
    return worker;
  }

  console.log(`[Worker] Starting document ingestion worker...`);
  console.log(`[Worker] Queue: ${QUEUE_CONFIG.QUEUE_NAME}`);
  console.log(`[Worker] Concurrency: ${QUEUE_CONFIG.CONCURRENCY}`);
  console.log(`[Worker] Max retries: ${QUEUE_CONFIG.MAX_RETRIES}`);

  worker = new Worker<IngestionJobData, IngestionPipelineResult>(
    QUEUE_CONFIG.QUEUE_NAME,
    async (job: Job<IngestionJobData>) => {
      console.log(
        `\n[Worker] ▶ Processing job ${job.id}: ${job.data.filename} ` +
          `(attempt ${job.attemptsMade + 1}/${QUEUE_CONFIG.MAX_RETRIES})`
      );

      // Delegate to the pure processor function
      return processIngestionJob(job.data);
    },
    {
      connection: getRedisConnection(),
      concurrency: QUEUE_CONFIG.CONCURRENCY,
      // Stalled job detection — if a job doesn't report progress for 5 min,
      // BullMQ considers it stalled and may retry it
      stalledInterval: 5 * 60 * 1000,
      // Max time a single job can run before being marked as stalled (10 min)
      lockDuration: 10 * 60 * 1000,
    }
  );

  // ── Event Handlers ──────────────────────────────────────────────────────

  worker.on("completed", (job, result) => {
    console.log(
      `[Worker] ✅ Job ${job.id} completed — ` +
        `${result.chunksCreated} chunks created in ${result.processingTimeMs}ms`
    );
  });

  worker.on("failed", (job, error) => {
    const attempts = job?.attemptsMade ?? 0;
    const maxAttempts = QUEUE_CONFIG.MAX_RETRIES;
    const willRetry = attempts < maxAttempts;

    console.error(
      `[Worker] ❌ Job ${job?.id} failed (attempt ${attempts}/${maxAttempts})` +
        `${willRetry ? " — will retry" : " — NO MORE RETRIES"}:`,
      error.message
    );
  });

  worker.on("error", (error) => {
    console.error("[Worker] Worker error:", error.message);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`[Worker] ⚠ Job ${jobId} stalled — will be retried`);
  });

  worker.on("active", (job) => {
    console.log(
      `[Worker] 🔄 Job ${job.id} is now active: ${job.data.filename}`
    );
  });

  console.log("[Worker] ✅ Document ingestion worker started\n");

  return worker;
}

// ── Lifecycle Management ──────────────────────────────────────────────────────

/**
 * Gracefully stops the ingestion worker.
 * Waits for currently active jobs to finish before shutting down.
 *
 * @param force - If true, doesn't wait for active jobs to complete
 */
export async function stopIngestionWorker(force: boolean = false): Promise<void> {
  if (!worker) {
    console.log("[Worker] No worker to stop");
    return;
  }

  console.log(
    `[Worker] Stopping ingestion worker${force ? " (forced)" : ""}...`
  );

  await worker.close(force);
  worker = null;

  console.log("[Worker] Ingestion worker stopped");
}

/**
 * Returns whether the worker is currently running.
 */
export function isWorkerRunning(): boolean {
  return worker !== null && !worker.closing;
}

// ── Standalone Execution ──────────────────────────────────────────────────────

/**
 * When this file is executed directly (not imported), start the worker
 * as a standalone process. This is the recommended production deployment:
 * run the worker separately from the API server for independent scaling.
 */
const isMainModule =
  typeof require !== "undefined" &&
  require.main === module;

// Also check for ESM direct execution
const isDirectRun = process.argv[1]?.includes("ingestion.worker");

if (isMainModule || isDirectRun) {
  console.log("━".repeat(60));
  console.log("  Q-AI Document Ingestion Worker");
  console.log("  Starting as standalone process...");
  console.log("━".repeat(60));

  const w = startIngestionWorker();

  // Graceful shutdown on SIGTERM / SIGINT
  const shutdown = async (signal: string) => {
    console.log(`\n[Worker] Received ${signal} — shutting down gracefully...`);
    await stopIngestionWorker();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
