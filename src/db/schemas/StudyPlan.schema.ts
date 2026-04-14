import { pgTable, uuid, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core"

import type { IModelConfig } from "../types/model-config"
import { vaults } from "./Vault.schema"
import { users } from "./User.schema"

// ── Nested types ─────────────────────────────────────────────────────────────

export interface StudyTopic {
  documentName: string
  documentId: string
  estimatedMinutes: number
  type: "reading" | "practice" | "review"
  priority: "high" | "medium" | "low"
}

export interface StudyDay {
  date: string // ISO date string, e.g. "2026-05-01"
  dayNumber: number
  totalMinutes: number
  topics: StudyTopic[]
  note?: string
}

export interface StudyPlanData {
  days: StudyDay[]
  totalDays: number
  totalStudyHours: number
  examDate: string
  vaultName: string
  learningStyle: string
  summary: string
}

// ── Table ─────────────────────────────────────────────────────────────────────

export const studyPlans = pgTable("study_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  vaultId: uuid("vault_id")
    .notNull()
    .references(() => vaults.id),
  examDate: timestamp("exam_date", { withTimezone: true }).notNull(),
  dailyHours: doublePrecision("daily_hours").notNull(),
  planJson: jsonb("plan_json").$type<StudyPlanData>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}).enableRLS()

// ── Drizzle types ─────────────────────────────────────────────────────────────

export type StudyPlan = typeof studyPlans.$inferSelect
export type NewStudyPlan = typeof studyPlans.$inferInsert

// ── Domain interface ─────────────────────────────────────────────────────────

export interface IStudyPlanSchema {
  id: string
  userId: string
  vaultId: string
  examDate: Date
  dailyHours: number
  planJson: StudyPlanData
  createdAt: Date | null
  updatedAt: Date | null
}

// ── Model config ─────────────────────────────────────────────────────────────

export const StudyPlanModelConfig: IModelConfig = {
  tableName: "study_plans",
  primaryKeyType: "uuid",
  properties: {
    id: { type: "string", label: "ID", isRequired: true },
    userId: { type: "string", label: "User ID", isRequired: true },
    vaultId: { type: "string", label: "Vault ID", isRequired: true },
    examDate: { type: "Date", label: "Exam Date", isRequired: true },
    dailyHours: { type: "number", label: "Daily Hours", isRequired: true },
    planJson: { type: "object", label: "Plan JSON", isRequired: true },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
    updatedAt: { type: "Date", label: "Updated At", isRequired: false },
  },
}
