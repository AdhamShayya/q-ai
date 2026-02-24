import { type } from "arktype"

import { ark } from "../utils/ark"
import { router, publicProcedure } from "../trpc"
import { getUserById, getAllUsers, updateUser, deleteUser } from "../controllers/user.controller"

const byId = type({ id: "string" })
const update = type({ id: "string", "name?": "string >= 2", "email?": "string.email" })

export const userRouter = router({
  getAllUsers: publicProcedure.query(() => getAllUsers()),
  getUserById: publicProcedure.input(ark(byId)).query(({ input }) => getUserById(input.id)),
  updateUser: publicProcedure
    .input(ark(update))
    .mutation(({ input }) => updateUser(input.id, input)),
  deleteUser: publicProcedure.input(ark(byId)).mutation(({ input }) => deleteUser(input.id)),
})

export type UserRouter = typeof userRouter
