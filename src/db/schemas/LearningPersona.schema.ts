import { pgTable, uuid, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { type } from "arktype"

import type { IModelConfig } from "../types/model-config"
import { users } from "./User.schema"

// ── Enums ───────────────────────────────────────────────────────────────────

// Derived / computed fields
export const learningStyleEnum = pgEnum("learning_style", ["analogies", "logic", "visual", "mixed"])
export const problemSolvingEnum = pgEnum("problem_solving", ["guided", "direct"])
export const reviewStyleEnum = pgEnum("review_style", ["detailed", "summary"])

// Raw quiz answer enums (all 7 questions)
export const infoEntryEnum = pgEnum("info_entry", ["visual", "auditory", "text"])
export const processingMethodEnum = pgEnum("processing_method", ["verbal", "visual"])
export const logicStructureEnum = pgEnum("logic_structure", ["global", "sequential"])
export const outputPreferenceEnum = pgEnum("output_preference", ["essay", "model", "presentation"])
export const socialEnvironmentEnum = pgEnum("social_environment", ["social", "solitary"])
export const abstractionLevelEnum = pgEnum("abstraction_level", ["abstract", "concrete"])
export const errorCorrectionEnum = pgEnum("error_correction", ["example", "explanation", "retry"])

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
  // Raw quiz answers (all 7 questions)
  infoEntry: infoEntryEnum("info_entry"),
  processingMethod: processingMethodEnum("processing_method"),
  logicStructure: logicStructureEnum("logic_structure"),
  outputPreference: outputPreferenceEnum("output_preference"),
  socialEnvironment: socialEnvironmentEnum("social_environment"),
  abstractionLevel: abstractionLevelEnum("abstraction_level"),
  errorCorrection: errorCorrectionEnum("error_correction"),
  preferencesJson: jsonb("preferences_json").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

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
  // Raw quiz answers
  infoEntry: "visual" | "auditory" | "text" | null
  processingMethod: "verbal" | "visual" | null
  logicStructure: "global" | "sequential" | null
  outputPreference: "essay" | "model" | "presentation" | null
  socialEnvironment: "social" | "solitary" | null
  abstractionLevel: "abstract" | "concrete" | null
  errorCorrection: "example" | "explanation" | "retry" | null
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
  "infoEntry?": "'visual' | 'auditory' | 'text'",
  "processingMethod?": "'verbal' | 'visual'",
  "logicStructure?": "'global' | 'sequential'",
  "outputPreference?": "'essay' | 'model' | 'presentation'",
  "socialEnvironment?": "'social' | 'solitary'",
  "abstractionLevel?": "'abstract' | 'concrete'",
  "errorCorrection?": "'example' | 'explanation' | 'retry'",
  "preferencesJson?": "object",
})

export const UpdateLearningPersonaInput = type({
  "learningStyle?": "'analogies' | 'logic' | 'visual' | 'mixed'",
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
    infoEntry: { type: "string", label: "Info Entry", isRequired: false },
    processingMethod: { type: "string", label: "Processing Method", isRequired: false },
    logicStructure: { type: "string", label: "Logic Structure", isRequired: false },
    outputPreference: { type: "string", label: "Output Preference", isRequired: false },
    socialEnvironment: { type: "string", label: "Social Environment", isRequired: false },
    abstractionLevel: { type: "string", label: "Abstraction Level", isRequired: false },
    errorCorrection: { type: "string", label: "Error Correction", isRequired: false },
    preferencesJson: { type: "object", label: "Preferences JSON", isRequired: false },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
    updatedAt: { type: "Date", label: "Updated At", isRequired: false },
  },
}
