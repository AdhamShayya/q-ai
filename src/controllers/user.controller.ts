import { TRPCError } from "@trpc/server"

import { ORM } from "../db/orm"
import type { IUserPublic, UpdateUserInput } from "../db/schemas/User.schema"

const DEMO_PASSWORD_HASH = "$2b$10$demo_placeholder_hash_not_for_auth_use"

export async function getUserById(id: string): Promise<IUserPublic> {
  const user = await ORM.User.findById(id)
  if (user == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
  }
  return ORM.User.toPublic(user)
}

export async function getAllUsers(): Promise<IUserPublic[]> {
  const all = await ORM.User.findAll()
  return all.map((u) => ORM.User.toPublic(u))
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<IUserPublic> {
  const updated = await ORM.User.updateById(id, input)
  if (updated == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
  }
  return ORM.User.toPublic(updated)
}

export async function deleteUser(id: string): Promise<{ id: string }> {
  const deletedId = await ORM.User.deleteById(id)
  if (deletedId == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
  }
  return { id: deletedId }
}

/**
 * Find a user by email or create them if they don't exist.
 * Used during development to bootstrap a session-less demo user.
 */
export async function ensureUser(input: { email: string; name: string }): Promise<IUserPublic> {
  const existing = await ORM.User.findByEmail(input.email)
  if (existing != null) return ORM.User.toPublic(existing)

  const created = await ORM.User.create({
    email: input.email.toLowerCase(),
    name: input.name,
    passwordHash: DEMO_PASSWORD_HASH,
    subscriptionTier: "free",
    subscriptionStatus: "active",
  })
  return ORM.User.toPublic(created)
}
