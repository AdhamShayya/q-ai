import { TRPCError } from "@trpc/server"
import LearningPersonaModel from "../db/models/LearningPersona"
import type { ILearningPersonaSchema } from "../db/schemas/LearningPersona.schema"

export async function getPersona(userId: string): Promise<ILearningPersonaSchema | null> {
  return LearningPersonaModel.findByUserId(userId)
}

type UpsertInput = {
  userId: string
  preferencesJson: object
  problemSolving: "guided" | "direct"
  reviewStyle: "detailed" | "summary"
  processingMethod: "verbal" | "visual"
  logicStructure: "global" | "sequential"
  socialEnvironment: "social" | "solitary"
  infoEntry: "visual" | "auditory" | "text"
  abstractionLevel: "abstract" | "concrete"
  outputPreference: "essay" | "model" | "presentation"
  errorCorrection: "example" | "explanation" | "retry"
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
