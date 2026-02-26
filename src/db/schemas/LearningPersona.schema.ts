import { pgTable, uuid, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { type } from "arktype"

import type { IModelConfig } from "../types/model-config"
import { users } from "./User.schema"

// ── Enums ───────────────────────────────────────────────────────────────────

export const learningStyleEnum = pgEnum("learning_style", ["analogies", "logic", "visual", "mixed"])
export const problemSolvingEnum = pgEnum("problem_solving", ["guided", "direct"])
export const reviewStyleEnum = pgEnum("review_style", ["detailed", "summary"])

// ── Table ─────────────────────────────────────────────────────────────────────

export const learningPersonas = pgTable("learning_personas", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  learningStyle: learningStyleEnum("learning_style").notNull(),
  problemSolving: problemSolvingEnum("problem_solving"),
  reviewStyle: reviewStyleEnum("review_style"),
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
  learningStyle: "analogies" | "logic" | "visual" | "mixed"
  problemSolving: "guided" | "direct" | null
  reviewStyle: "detailed" | "summary" | null
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
  "preferencesJson?": "object",
})

export const UpdateLearningPersonaInput = type({
  "learningStyle?": "'analogies' | 'logic' | 'visual' | 'mixed'",
  "problemSolving?": "'guided' | 'direct'",
  "reviewStyle?": "'detailed' | 'summary'",
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
    preferencesJson: { type: "object", label: "Preferences JSON", isRequired: false },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
    updatedAt: { type: "Date", label: "Updated At", isRequired: false },
  },
}
