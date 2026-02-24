import { type } from "arktype"

import type { IModelConfig } from "../types/model-config"

// Domain interface
export interface IUserSchema {
  id: string
  email: string
  name: string
  password: string
  role: "admin" | "user"
  createdAt: Date
  updatedAt: Date
}

// Public shape — no password
export interface IUserPublic {
  id: string
  email: string
  name: string
  role: "admin" | "user"
  createdAt: Date
  updatedAt: Date
}

// Arktype validators
export const CreateUserInput = type({
  email: "string.email",
  name: "string >= 2",
  password: "string >= 8",
})

export const UpdateUserInput = type({
  "name?": "string >= 2",
  "email?": "string.email",
})

export type CreateUserInput = typeof CreateUserInput.infer
export type UpdateUserInput = typeof UpdateUserInput.infer

// Model config
export const UserModelConfig: IModelConfig = {
  tableName: "users",
  primaryKeyType: "uuid",
  properties: {
    id: {
      type: "string",
      label: "ID",
      isRequired: true,
    },
    email: { type: "string", label: "Email", isRequired: true },
    name: { type: "string", label: "Name", isRequired: true },
    password: { type: "string", label: "Password", isRequired: true },
    role: { type: "string", label: "Role", isRequired: true },
    createdAt: { type: "Date", label: "Created At", isRequired: true },
    updatedAt: { type: "Date", label: "Updated At", isRequired: true },
  },
}
