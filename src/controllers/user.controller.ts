import { TRPCError } from "@trpc/server"

import { ORM } from "../db/orm"
import type { IUserPublic, UpdateUserInput } from "../db/schemas/User.schema"

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
