import bcrypt from "bcryptjs"
import { TRPCError } from "@trpc/server"

import UserModel from "../db/models/User"
import type { IUserPublic, UpdateUserInput } from "../db/schemas/User.schema"
type SignUpInput = {
  name: string
  email: string
  password: string
}
export async function signUp(props: SignUpInput): Promise<IUserPublic> {
  const existing = await UserModel.findByEmail(props.email)
  if (existing != null) {
    throw new TRPCError({ code: "CONFLICT", message: "Email already in use" })
  }

  const passwordHash = await bcrypt.hash(props.password, 10)
  const user = await UserModel.create({
    email: props.email.toLowerCase(),
    name: props.name,
    passwordHash,
    subscriptionTier: "free",
    subscriptionStatus: "active",
  })
  return UserModel.toPublic(user)
}

type SignInInput = {
  email: string
  password: string
}
export async function signIn(input: SignInInput): Promise<IUserPublic> {
  const user = await UserModel.findByEmail(input.email)
  if (user == null) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" })
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash)
  if (isValid === false) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" })
  }

  return UserModel.toPublic(user)
}

export async function getUserById(id: string): Promise<IUserPublic> {
  const user = await UserModel.findById(id)
  if (user == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
  }
  return UserModel.toPublic(user)
}

export async function getAllUsers(): Promise<IUserPublic[]> {
  const all = await UserModel.findAll()
  return all.map((u) => UserModel.toPublic(u))
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<IUserPublic> {
  const updated = await UserModel.updateById(id, input)
  if (updated == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
  }
  return UserModel.toPublic(updated)
}

export async function deleteUser(id: string): Promise<{ id: string }> {
  const deletedId = await UserModel.deleteById(id)
  if (deletedId == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
  }
  return { id: deletedId }
}
