import { router } from "../trpc"
import { userRouter } from "./user.router"
import { vaultRouter } from "./vault.router"
import { personaRouter } from "./persona.router"
import { conversationRouter } from "./conversation.router"

export const appRouter = router({
  user: userRouter,
  vault: vaultRouter,
  persona: personaRouter,
  conversation: conversationRouter,
})

export type AppRouter = typeof appRouter
