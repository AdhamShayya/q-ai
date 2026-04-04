import { router } from "../trpc"
import { userRouter } from "./user.router"
import { vaultRouter } from "./vault.router"
import { personaRouter } from "./persona.router"
import { conversationRouter } from "./conversation.router"
import { adminRouter } from "./admin.router"

export const appRouter = router({
  user: userRouter,
  vault: vaultRouter,
  persona: personaRouter,
  conversation: conversationRouter,
  admin: adminRouter,
})

export type AppRouter = typeof appRouter
