import { type } from "arktype"
import { TRPCError } from "@trpc/server"

import { ark } from "../utils/ark"
import { router, publicProcedure } from "../trpc"
import { getPersona, upsertPersona } from "../controllers/persona.controller"

const upsertInput = type({
  learningStyle: "'analogies' | 'logic' | 'visual' | 'mixed'",
  "problemSolving?": "'guided' | 'direct'",
  "reviewStyle?": "'detailed' | 'summary'",
  "infoEntry?": "'visual' | 'auditory' | 'text'",
  "processingMethod?": "'verbal' | 'visual'",
  "logicStructure?": "'global' | 'sequential'",
  "outputPreference?": "'essay' | 'model' | 'presentation'",
  "socialEnvironment?": "'social' | 'solitary'",
  "abstractionLevel?": "'abstract' | 'concrete'",
  "errorCorrection?": "'example' | 'explanation' | 'retry'",
  "preferencesJson?": "object",
})

export const personaRouter = router({
  get: publicProcedure.query(async ({ ctx }) => {
    if (ctx.userId == null) throw new TRPCError({ code: "UNAUTHORIZED" })
    return getPersona(ctx.userId)
  }),

  upsert: publicProcedure.input(ark(upsertInput)).mutation(async ({ input, ctx }) => {
    if (ctx.userId == null) throw new TRPCError({ code: "UNAUTHORIZED" })
    return upsertPersona({ ...input, userId: ctx.userId })
  }),
})

export type PersonaRouter = typeof personaRouter
