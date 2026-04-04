import { router, publicProcedure } from "../trpc"
import { getAdminStats, getUsersWithStats } from "../controllers/admin.controller"

export const adminRouter = router({
  stats: publicProcedure.query(() => getAdminStats()),
  usersWithStats: publicProcedure.query(() => getUsersWithStats()),
})

export type AdminRouter = typeof adminRouter
