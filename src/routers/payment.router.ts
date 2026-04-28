import { createHmac } from "crypto"
import { TRPCError } from "@trpc/server"
import { type } from "arktype"

import { ark } from "../utils/ark"
import { router, publicProcedure } from "../trpc"
import UserModel from "../db/models/User"
import { env } from "../config/config"

// ── In-memory session store ───────────────────────────────────────────────────
// Maps Matensa sessionId → { userId, callbackSecret }
// Simple and sufficient for a single-server deployment.
export const pendingSessions = new Map<string, { userId: string; callbackSecret: string }>()

// ── Matensa helpers ───────────────────────────────────────────────────────────

async function getMatensaToken(): Promise<string> {
  if (!env.MATENSA_KEY || !env.MATENSA_SECRET) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Matensa credentials not configured (MATENSA_KEY / MATENSA_SECRET missing in .env)",
    })
  }

  const res = await fetchWithRetry(`${env.MATENSA_API_URL}/api/auth/oauth2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Key: env.MATENSA_KEY, Secret: env.MATENSA_SECRET }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    console.error(`[Matensa] Auth failed ${res.status}:`, detail)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Matensa authentication failed (${res.status})`,
    })
  }

  const data = (await res.json()) as { AccessToken?: string }
  if (!data.AccessToken) {
    console.error("[Matensa] Auth response missing AccessToken:", data)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Matensa returned no access token",
    })
  }

  return data.AccessToken
}

// ── Signature verification (used by webhook in main.ts) ───────────────────────

export function verifyWebhookSignature(
  sessionId: string,
  success: boolean,
  timestampUnix: number,
  nonce: string,
  signature: string,
  secret: string,
): boolean {
  const successFlag = success ? 1 : 0
  const payload = `${sessionId.replace(/-/g, "")}.${successFlag}.${timestampUnix}.${nonce}`
  const expected = createHmac("sha256", secret).update(payload).digest("hex").toLowerCase()
  return expected === signature.toLowerCase()
}

// ── Retry helper ─────────────────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delayMs = 800,
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, options)
    if (res.ok || attempt === retries) return res
    const status = res.status
    // Only retry on server errors (5xx), not client errors (4xx)
    if (status < 500) return res
    console.warn(
      `[Matensa] Attempt ${attempt}/${retries} failed with ${status}, retrying in ${delayMs}ms…`,
    )
    await new Promise((r) => setTimeout(r, delayMs * attempt))
  }
  // Unreachable, but satisfies TS
  return fetch(url, options)
}

// ── Input schemas ─────────────────────────────────────────────────────────────

const createSessionInput = type({ userId: "string" })
const sessionIdInput = type({ sessionId: "string" })

// ── Router ────────────────────────────────────────────────────────────────────

export const paymentRouter = router({
  /** Creates a Matensa payment session and returns the hosted payment link. */
  createSession: publicProcedure.input(ark(createSessionInput)).mutation(async ({ input, ctx }) => {
    if (ctx.userId == null) throw new TRPCError({ code: "UNAUTHORIZED" })

    const token = await getMatensaToken()

    // Always send a CallbackUrl so Matensa returns a real CallbackSecret.
    // On localhost Matensa can't reach us, but we fall back to polling — that still works.
    const callbackUrl = `${env.BACKEND_PUBLIC_URL}/api/payments/webhook`

    const sessionBody = {
      Amount: 24.99,
      Currency: "USD",
      CallbackUrl: callbackUrl,
    }

    console.log("[Matensa] Creating session:", JSON.stringify(sessionBody))

    const res = await fetchWithRetry(`${env.MATENSA_API_URL}/api/v1/Gateway/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sessionBody),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      console.error(`[Matensa] CreateSession failed ${res.status}:`, detail)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to create payment session (${res.status})`,
      })
    }

    const data = (await res.json()) as {
      SessionId: string
      Link: string
      CallbackSecret: string | null
    }

    pendingSessions.set(data.SessionId, {
      userId: input.userId,
      callbackSecret: data.CallbackSecret ?? "",
    })

    return { sessionId: data.SessionId, link: data.Link }
  }),

  /** Polls the Matensa session status — returns PENDING or COMPLETED. */
  getSessionStatus: publicProcedure.input(ark(sessionIdInput)).query(async ({ input, ctx }) => {
    if (ctx.userId == null) throw new TRPCError({ code: "UNAUTHORIZED" })

    const token = await getMatensaToken()
    const res = await fetch(
      `${env.MATENSA_API_URL}/api/v1/Gateway/sessions/${input.sessionId}/status`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    )

    if (!res.ok) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })

    const data = (await res.json()) as { Status: string }
    return { status: data.Status }
  }),

  /**
   * Called by the frontend after polling shows COMPLETED.
   * Re-verifies with Matensa before upgrading the user.
   */
  confirmUpgrade: publicProcedure.input(ark(sessionIdInput)).mutation(async ({ input, ctx }) => {
    if (ctx.userId == null) throw new TRPCError({ code: "UNAUTHORIZED" })

    const token = await getMatensaToken()
    const res = await fetch(
      `${env.MATENSA_API_URL}/api/v1/Gateway/sessions/${input.sessionId}/status`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    )

    if (!res.ok) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })

    const data = (await res.json()) as { Status: string }
    if (data.Status !== "COMPLETED") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Payment not yet completed" })
    }

    await UserModel.updateById(ctx.userId, { subscriptionTier: "premium" })
    pendingSessions.delete(input.sessionId)
    return { ok: true }
  }),
})

export type PaymentRouter = typeof paymentRouter
