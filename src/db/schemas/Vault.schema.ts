import { type } from "arktype"
import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core"

import { users } from "./User.schema"
import type { IModelConfig } from "../types/model-config"

// ── Table ─────────────────────────────────────────────────────────────────────

export const vaults = pgTable("vaults", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  courseName: varchar("course_name", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}).enableRLS()

// ── Drizzle types ─────────────────────────────────────────────────────────────

export type Vault = typeof vaults.$inferSelect
export type NewVault = typeof vaults.$inferInsert

// ── Domain interface ─────────────────────────────────────────────────────────

export interface IVaultSchema {
  id: string
  name: string
  userId: string
  createdAt: Date | null
  updatedAt: Date | null
  courseName: string | null
  description: string | null
}

// ── Validators ───────────────────────────────────────────────────────────────

export const CreateVaultInput = type({
  userId: "string",
  name: "string >= 1",
  "courseName?": "string",
  "description?": "string",
})

export const UpdateVaultInput = type({
  "name?": "string >= 1",
  "courseName?": "string",
  "description?": "string",
})

export type CreateVaultInput = typeof CreateVaultInput.infer
export type UpdateVaultInput = typeof UpdateVaultInput.infer

// ── Model config ─────────────────────────────────────────────────────────────

export const VaultModelConfig: IModelConfig = {
  tableName: "vaults",
  primaryKeyType: "uuid",
  properties: {
    id: { type: "string", label: "ID", isRequired: true },
    userId: { type: "string", label: "User ID", isRequired: true },
    name: { type: "string", label: "Name", isRequired: true },
    courseName: { type: "string", label: "Course Name", isRequired: false },
    description: { type: "string", label: "Description", isRequired: false },
    createdAt: { type: "Date", label: "Created At", isRequired: false },
    updatedAt: { type: "Date", label: "Updated At", isRequired: false },
  },
}
