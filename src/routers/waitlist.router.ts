import { type } from "arktype"
import { TRPCError } from "@trpc/server"

import { ark } from "../utils/ark"
import { router, publicProcedure } from "../trpc"
import { db } from "../db"
import { waitlistEntries } from "../db/schemas/Waitlist.schema"

const joinInput = type({ email: "string.email" })

export const waitlistRouter = router({
  join: publicProcedure.input(ark(joinInput)).mutation(async ({ input }) => {
    try {
      const [entry] = await db
        .insert(waitlistEntries)
        .values({ email: input.email })
        .onConflictDoNothing()
        .returning()

      return { ok: true, alreadyExists: entry == null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("❌  waitlist.join DB error:", msg)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to join waitlist",
        cause: err,
      })
    }
  }),
})
