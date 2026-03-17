import { TRPCError } from "@trpc/server"
import LearningPersonaModel from "../db/models/LearningPersona"
import type { ILearningPersonaSchema } from "../db/schemas/LearningPersona.schema"

export async function getPersona(userId: string): Promise<ILearningPersonaSchema | null> {
  return LearningPersonaModel.findByUserId(userId)
}

type QuizAnswer = { question: string; answer: string }

type UpsertInput = {
  userId: string
  preferencesJson?: object
  problemSolving?: "guided" | "direct"
  reviewStyle?: "detailed" | "summary"
  processingMethod?: QuizAnswer
  logicStructure?: QuizAnswer
  socialEnvironment?: QuizAnswer
  infoEntry?: QuizAnswer
  abstractionLevel?: QuizAnswer
  outputPreference?: QuizAnswer
  errorCorrection?: QuizAnswer
  learningStyle: "analogies" | "logic" | "visual" | "mixed"
}

export async function upsertPersona(input: UpsertInput): Promise<ILearningPersonaSchema> {
  const existing = await LearningPersonaModel.findByUserId(input.userId)

  const { userId, ...fields } = input

  if (existing != null) {
    const updated = await LearningPersonaModel.updateById(existing.id, fields)
    if (updated == null) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update persona" })
    }
    return updated
  }

  return LearningPersonaModel.create({ userId, ...fields })
}
