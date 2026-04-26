import { router } from "../trpc"
import { userRouter } from "./user.router"
import { vaultRouter } from "./vault.router"
import { personaRouter } from "./persona.router"
import { conversationRouter } from "./conversation.router"
import { adminRouter } from "./admin.router"
import { flashcardRouter } from "./flashcard.router"
import { studyPlannerRouter } from "./studyplanner.router"
import { waitlistRouter } from "./waitlist.router"

export const appRouter = router({
  user: userRouter,
  vault: vaultRouter,
  persona: personaRouter,
  conversation: conversationRouter,
  admin: adminRouter,
  flashcard: flashcardRouter,
  studyPlanner: studyPlannerRouter,
  waitlist: waitlistRouter,
})

export type AppRouter = typeof appRouter
