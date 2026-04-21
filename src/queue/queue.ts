/**
 * queue.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Graphile-worker runner for the document ingestion pipeline.
 *
 * Jobs are stored in PostgreSQL (no Redis required). Creating a job inside
 * a database transaction guarantees the document record and its processing
 * job are always created together — or not at all.
 *
 * Requires graphile-worker tables to exist (auto-migrated on first start).
 * For Supabase: set GRAPHILE_DB_URL to the direct connection (port 5432),
 * not the PgBouncer pooler, because graphile-worker uses advisory locks.
 */

import { run, type Runner } from "graphile-worker"
import { env } from "../config/config"
import { processIngestionJob } from "./ingestion.processor"
import { INGEST_TASK, type IngestionJobData } from "../types/ingestion.types"

let runner: Runner | null = null

export async function startIngestionQueue(): Promise<void> {
  if (runner != null) {
    return
  }

  runner = await run({
    connectionString: env.GRAPHILE_DB_URL,
    concurrency: 5,
    taskList: {
      [INGEST_TASK]: async (payload: unknown) => {
        await processIngestionJob(payload as IngestionJobData)
      },
    },
  })

  runner.events.on(
    "job:error",
    (params: { job: { id: unknown; task_identifier: string }; error: unknown }) => {
      console.error(
        `[Queue] ❌ Job ${params.job.id} (${params.job.task_identifier}) failed:`,
        params.error instanceof Error ? params.error.message : params.error,
      )
    },
  )

  console.log("[Queue] ✅ Graphile-worker started")
}

export async function stopIngestionQueue(): Promise<void> {
  if (runner == null) {
    return
  }
  await runner.stop()
  runner = null
  console.log("[Queue] Graphile-worker stopped")
}
