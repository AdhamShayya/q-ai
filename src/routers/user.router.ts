import { type } from "arktype"

import { ark } from "../utils/ark"
import { router, publicProcedure } from "../trpc"
import {
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  signUp,
  signIn,
} from "../controllers/user.controller"

const byId = type({ id: "string" })
const update = type({ id: "string", "name?": "string >= 2", "email?": "string.email" })

const signUpInput = type({ name: "string >= 2", email: "string.email", password: "string >= 8" })
const signInInput = type({ email: "string.email", password: "string >= 8" })

/** Cookie options shared by set / clear. */
const COOKIE_OPTS = {
  httpOnly: true,
  signed: true,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
}

export const userRouter = router({
  // ── Auth ──────────────────────────────────────────────────────────────────
  signUp: publicProcedure.input(ark(signUpInput)).mutation(async ({ input, ctx }) => {
    const user = await signUp(input)
    ctx.res.cookie("session", user.id, COOKIE_OPTS)
    return user
  }),

  signIn: publicProcedure.input(ark(signInInput)).mutation(async ({ input, ctx }) => {
    const user = await signIn(input)
    ctx.res.cookie("session", user.id, COOKIE_OPTS)
    return user
  }),

  signOut: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie("session", COOKIE_OPTS)
    return { ok: true }
  }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (ctx.userId == null) {
      return null
    }
    return await getUserById(ctx.userId)
  }),

  getAllUsers: publicProcedure.query(() => getAllUsers()),
  getUserById: publicProcedure.input(ark(byId)).query(({ input }) => getUserById(input.id)),
  updateUser: publicProcedure
    .input(ark(update))
    .mutation(({ input }) => updateUser(input.id, input)),
  deleteUser: publicProcedure.input(ark(byId)).mutation(({ input }) => deleteUser(input.id)),
})

export type UserRouter = typeof userRouter
