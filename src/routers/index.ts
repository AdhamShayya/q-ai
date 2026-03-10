import { router } from "../trpc"
import { userRouter } from "./user.router"
import { vaultRouter } from "./vault.router"
import { conversationRouter } from "./conversation.router"

export const appRouter = router({
  user: userRouter,
  vault: vaultRouter,
  conversation: conversationRouter,
})

export type AppRouter = typeof appRouter
