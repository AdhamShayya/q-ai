import { initTRPC, TRPCError } from "@trpc/server"

import { Context } from "./main"

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

/** Procedure that requires a signed-in user (session cookie present). */
export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.userId == null) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not signed in" })
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } })
})
