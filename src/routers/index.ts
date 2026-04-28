import { router } from "../trpc"
import { userRouter } from "./user.router"
import { vaultRouter } from "./vault.router"
import { adminRouter } from "./admin.router"
import { personaRouter } from "./persona.router"
import { paymentRouter } from "./payment.router"
import { waitlistRouter } from "./waitlist.router"
import { flashcardRouter } from "./flashcard.router"
import { conversationRouter } from "./conversation.router"
import { studyPlannerRouter } from "./studyplanner.router"

export const appRouter = router({
  user: userRouter,
  vault: vaultRouter,
  persona: personaRouter,
  conversation: conversationRouter,
  admin: adminRouter,
  flashcard: flashcardRouter,
  studyPlanner: studyPlannerRouter,
  waitlist: waitlistRouter,
  payment: paymentRouter,
})

export type AppRouter = typeof appRouter
