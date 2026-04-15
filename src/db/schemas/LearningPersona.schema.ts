import { pgTable, uuid, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { type } from "arktype"

import type { IModelConfig } from "../types/model-config"
import { users } from "./User.schema"

// ── Enums ───────────────────────────────────────────────────────────────────

// Derived / computed fields
export const learningStyleEnum = pgEnum("learning_style", ["analogies", "logic", "visual", "mixed"])
export const problemSolvingEnum = pgEnum("problem_solving", ["guided", "direct"])
export const reviewStyleEnum = pgEnum("review_style", ["detailed", "summary"])

// Quiz answer type
export type QuizAnswer = { question: string; answer: string }

// ── Table ─────────────────────────────────────────────────────────────────────

export const learningPersonas = pgTable("learning_personas", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  // Derived fields
  learningStyle: learningStyleEnum("learning_style").notNull(),
  problemSolving: problemSolvingEnum("problem_solving"),
  reviewStyle: reviewStyleEnum("review_style"),
  // Raw quiz answers (all 7 questions) — stored as { question, answer } pairs
  infoEntry: jsonb("info_entry").$type<QuizAnswer | null>(),
  processingMethod: jsonb("processing_method").$type<QuizAnswer | null>(),
  logicStructure: jsonb("logic_structure").$type<QuizAnswer | null>(),
  outputPreference: jsonb("output_preference").$type<QuizAnswer | null>(),
  socialEnvironment: jsonb("social_environment").$type<QuizAnswer | null>(),
  abstractionLevel: jsonb("abstraction_level").$type<QuizAnswer | null>(),
  errorCorrection: jsonb("error_correction").$type<QuizAnswer | null>(),
  preferencesJson: jsonb("preferences_json").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}).enableRLS()

// ── Drizzle types ─────────────────────────────────────────────────────────────

export type LearningPersona = typeof learningPersonas.$inferSelect
export type NewLearningPersona = typeof learningPersonas.$inferInsert

// ── Domain interface ─────────────────────────────────────────────────────────

export interface ILearningPersonaSchema {
  id: string
  userId: string
  // Derived fields
  learningStyle: "analogies" | "logic" | "visual" | "mixed"
  problemSolving: "guided" | "direct" | null
  reviewStyle: "detailed" | "summary" | null
  // Raw quiz answers — stored as { question, answer } pairs
  infoEntry: QuizAnswer | null
  processingMethod: QuizAnswer | null
  logicStructure: QuizAnswer | null
  outputPreference: QuizAnswer | null
  socialEnvironment: QuizAnswer | null
  abstractionLevel: QuizAnswer | null
  errorCorrection: QuizAnswer | null
  preferencesJson: Record<string, unknown> | null
  createdAt: Date | null
  updatedAt: Date | null
}

// ── Validators ───────────────────────────────────────────────────────────────

export const CreateLearningPersonaInput = type({
  userId: "string",
  learningStyle: "'analogies' | 'logic' | 'visual' | 'mixed'",
  "problemSolving?": "'guided' | 'direct'",
  "reviewStyle?": "'detailed' | 'summary'",
  "infoEntry?": { question: "string", answer: "string" },
  "processingMethod?": { question: "string", answer: "string" },
  "logicStructure?": { question: "string", answer: "string" },
  "outputPreference?": { question: "string", answer: "string" },
  "socialEnvironment?": { question: "string", answer: "string" },
  "abstractionLevel?": { question: "string", answer: "string" },
  "errorCorrection?": { question: "string", answer: "string" },
  "preferencesJson?": "object",
})

export const UpdateLearningPersonaInput = type({
  "learningStyle?": "'analogies' | 'logic' | 'visual' | 'mixed'",
  "problemSolving?": "'guided' | 'direct'",
  "reviewStyle?": "'detailed' | 'summary'",
  "infoEntry?": { question: "string", answer: "string" },
  "processingMethod?": { question: "string", answer: "string" },
  "logicStructure?": { question: "string", answer: "string" },
  "outputPreference?": { question: "string", answer: "string" },
  "socialEnvironment?": { question: "string", answer: "string" },
  "abstractionLevel?": { question: "string", answer: "string" },
  "errorCorrection?": { question: "string", answer: "string" },
  "preferencesJson?": "object",
})

export type CreateLearningPersonaInput = typeof CreateLearningPersonaInput.infer
export type UpdateLearningPersonaInput = typeof UpdateLearningPersonaInput.infer

// ── Model config ─────────────────────────────────────────────────────────────

export const LearningPersonaModelConfig: IModelConfig = {
  tableName: "learning_personas",
  primaryKeyType: "uuid",
  properties: {
    id: { type: "string", label: "ID", isRequired: true },
    userId: { type: "string", label: "User ID", isRequired: true },
    learningStyle: { type: "string", label: "Learning Style", isRequired: true },
    problemSolving: { type: "string", label: "Problem Solving", isRequired: false },
    reviewStyle: { type: "string", label: "Review Style", isRequired: false },
    infoEntry: { type: "object", label: "Info Entry", isRequired: false },
    processingMethod: { type: "object", label: "Processing Method", isRequired: false },
    logicStructure: { type: "object", label: "Logic Structure", isRequired: false },
    outputPreference: { type: "object", label: "Output Preference", isRequired: false },
    socialEnvironment: { type: "object", label: "Social Environment", isRequired: false },
    abstractionLevel: { type: "object", label: "Abstraction Level", isRequired: false },
    errorCorrection: { type: "object", label: "Error Correction", isRequired: false },
    preferencesJson: { type: "object", label: "Preferences JSON", isRequired: false },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
    updatedAt: { type: "Date", label: "Updated At", isRequired: false },
  },
}
