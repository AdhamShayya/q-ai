import path from "path"
import cors from "cors"
import multer from "multer"
import express from "express"
import cookieParser from "cookie-parser"
import { createExpressMiddleware } from "@trpc/server/adapters/express"
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express"

import { env } from "./config/config"
import { appRouter } from "./routers"
import { checkDatabaseConnection } from "./db"
import { startIngestionQueue, stopIngestionQueue } from "./queue/queue"

export type Context = {
  req: express.Request
  res: express.Response
  userId: string | null
}

export function createContext({ req, res }: CreateExpressContextOptions): Context {
  const raw = req.signedCookies?.session
  const userId = typeof raw === "string" && raw.length > 0 ? raw : null
  return { req, res, userId }
}

const app = express()
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
)

app.use(express.json())
app.use(cookieParser(env.COOKIE_SECRET))

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// ── Storage bucket bootstrap ─────────────────────────────────────────────────
// Creates the "vault" bucket if it doesn't exist yet. Called once at startup.
async function ensureStorageBucket(): Promise<void> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    throw new Error(
      `Supabase storage not configured — SUPABASE_URL="${env.SUPABASE_URL}" SUPABASE_SERVICE_KEY=${env.SUPABASE_SERVICE_KEY ? "[set]" : "[missing]"}`,
    )
  }
  if (!env.SUPABASE_URL.startsWith("https://")) {
    throw new Error(
      `SUPABASE_URL must be the HTTPS REST URL (e.g. https://<project-id>.supabase.co), got: "${env.SUPABASE_URL}"`,
    )
  }

  const headers = {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
  }

  // Check if the bucket already exists
  const checkRes = await fetch(`${env.SUPABASE_URL}/storage/v1/bucket/vault`, { headers })
  console.log("[Storage] Checking for existing 'vault' bucket...", checkRes.status)
  if (checkRes.ok) {
    console.log('[Storage] Bucket "vault" already exists')
    return
  }

  // Create it — public: false so files require the service key to read
  const createRes = await fetch(`${env.SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers,
    body: JSON.stringify({ id: "vault", name: "vault", public: false }),
  })

  if (createRes.ok) {
    console.log('[Storage] Bucket "vault" created successfully')
  } else {
    const detail = await createRes.text()
    console.error('[Storage] Failed to create bucket "vault":', detail)
  }
}

// ── File Upload ───────────────────────────────────────────────────────────────
// Accepts a file + vaultId + filename, stores the file in Supabase Storage at
// vault/{vaultId}/{filename}, which is the exact path the ingestion worker expects.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB max
})

app.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file
  const { vaultId, filename } = req.body as Record<string, string | undefined>

  if (!file || !vaultId || !filename) {
    res.status(400).json({ error: "Missing required fields: file, vaultId, filename" })
    return
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    res.status(503).json({ error: "Storage not configured" })
    return
  }

  if (!env.SUPABASE_URL.startsWith("https://")) {
    console.error("[Upload] SUPABASE_URL is not a valid https URL:", env.SUPABASE_URL)
    res.status(503).json({ error: "Storage misconfigured — SUPABASE_URL must start with https://" })
    return
  }

  const uploadUrl = `${env.SUPABASE_URL}/storage/v1/object/vault/${vaultId}/${filename}`

  const storageRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": file.mimetype || "application/octet-stream",
      "x-upsert": "true",
    },
    body: new Uint8Array(file.buffer),
  })

  if (!storageRes.ok) {
    const detail = await storageRes.text()
    console.error(`[Upload] Storage error ${storageRes.status} for ${filename}:`, detail)
    res.status(502).json({ error: "File storage failed" })
    return
  }

  res.status(200).json({ path: `vault/${vaultId}/${filename}` })
})

// All tRPC procedures are available under /trpc/*
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    // Surface tRPC errors in development; hide internals in production
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(`❌  tRPC error on ${path ?? "unknown"}:`, error)
          }
        : undefined,
  }),
)

// ── Static Frontend (production) ──────────────────────────────────────────────
// In production the Vite build is copied to /app/public next to /app/dist.
// Express serves it as static files and falls back to index.html for SPA routing.
if (env.NODE_ENV === "production") {
  const publicDir = path.join(__dirname, "../public")
  app.use(express.static(publicDir))
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"))
  })
}

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" })
})

// ── Start ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  await checkDatabaseConnection()
  await ensureStorageBucket()
  await startIngestionQueue()

  const shutdown = async (signal: string) => {
    console.log(`\n[Server] ${signal} received — shutting down gracefully...`)
    await stopIngestionQueue()
    process.exit(0)
  }
  process.on("SIGTERM", () => void shutdown("SIGTERM"))
  process.on("SIGINT", () => void shutdown("SIGINT"))

  // ── Startup diagnostics ──────────────────────────────────────────────────
  console.log(
    "[Config] SUPABASE_URL   :",
    env.SUPABASE_URL || "❌ NOT SET (add SUPABASE_URL to .env)",
  )
  console.log(
    "[Config] SERVICE_KEY    :",
    env.SUPABASE_SERVICE_KEY ? "✅ set" : "❌ NOT SET (add SUPABASE_SERVICE_KEY to .env)",
  )
  console.log(
    "[Config] GRAPHILE_DB_URL:",
    env.GRAPHILE_DB_URL.includes(":6543/")
      ? "⚠️  transaction-mode pooler (advisory locks will fail)"
      : "✅ session-mode or direct",
  )

  app.listen(env.PORT, () => {
    console.log(`🚀  Server running on http://localhost:${env.PORT}`)
    console.log(`📡  tRPC endpoint: http://localhost:${env.PORT}/trpc`)
    console.log(`❤️   Health check: http://localhost:${env.PORT}/health`)
  })
}

main().catch((err: unknown) => {
  console.error("Fatal startup error:", err)
  process.exit(1)
})

// ── Type export ───────────────────────────────────────────────────────────────
// Re-export so the frontend can import the router type from one place
export type { AppRouter } from "./routers"
