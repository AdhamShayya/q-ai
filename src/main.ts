import cors from "cors"
import express from "express"
import cookieParser from "cookie-parser"
import { createExpressMiddleware } from "@trpc/server/adapters/express"
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express"

import { env } from "./config/config"
import { appRouter } from "./routers"
import { checkDatabaseConnection } from "./db"

export type Context = {
  req: express.Request
  res: express.Response
  userId: string | null
}

export function createContext({ req, res }: CreateExpressContextOptions): Context {
  const userId = req.signedCookies?.session
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

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" })
})

// ── Start ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  await checkDatabaseConnection()

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
