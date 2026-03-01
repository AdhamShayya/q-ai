import { router } from "../trpc"
import { userRouter } from "./user.router"
import { vaultRouter } from "./vault.router"

export const appRouter = router({
  user: userRouter,
  vault: vaultRouter,
})

export type AppRouter = typeof appRouter
