import { type } from "arktype"

import { ark } from "../utils/ark"
import { router, publicProcedure } from "../trpc"
import {
  createStudyPlan,
  getStudyPlan,
  deleteStudyPlan,
} from "../controllers/studyplanner.controller"

// ── Input schemas ─────────────────────────────────────────────────────────────

const createInput = type({
  vaultId: "string",
  userId: "string",
  examDate: "string >= 1",
  dailyHours: "number > 0",
})

const vaultUserInput = type({ vaultId: "string", userId: "string" })

// ── Router ────────────────────────────────────────────────────────────────────

export const studyPlannerRouter = router({
  create: publicProcedure.input(ark(createInput)).mutation(({ input }) => createStudyPlan(input)),

  get: publicProcedure
    .input(ark(vaultUserInput))
    .query(({ input }) => getStudyPlan(input.vaultId, input.userId)),

  delete: publicProcedure
    .input(ark(vaultUserInput))
    .mutation(({ input }) => deleteStudyPlan(input.vaultId, input.userId)),
})

export type StudyPlannerRouter = typeof studyPlannerRouter
