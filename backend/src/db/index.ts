import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"

import * as schema from "./schema"
import { env } from "../config/config"

// ── Connection Pool ───────────────────────────────────────────────────────────
// A single pool is shared across the entire application. The pool automatically
// manages acquiring and releasing connections.
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10, // max connections in the pool
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
})

pool.on("error", (err: Error) => {
  console.error("Unexpected PostgreSQL pool error:", err.message)
  process.exit(1)
})

// ── Drizzle Client ────────────────────────────────────────────────────────────
export const db = drizzle(pool, { schema, logger: env.NODE_ENV === "development" })

// ── Health Check ──────────────────────────────────────────────────────────────
export async function checkDatabaseConnection(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("SELECT 1")
    console.log("✅  PostgreSQL connected")
  } finally {
    client.release()
  }
}
