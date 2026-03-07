import { TRPCError } from "@trpc/server"

import VaultModel from "../db/models/Vault"
import DocumentModel from "../db/models/Document"
import type { IVaultSchema, CreateVaultInput, UpdateVaultInput } from "../db/schemas/Vault.schema"

// ── Vault CRUD ────────────────────────────────────────────────────────────────

export async function createVault(input: CreateVaultInput): Promise<IVaultSchema> {
  return VaultModel.create({
    userId: input.userId,
    name: input.name,
    courseName: input.courseName ?? null,
    description: input.description ?? null,
  })
}

export async function getVaultsByUserId(userId: string): Promise<IVaultSchema[]> {
  return VaultModel.findByUserId(userId)
}

export async function getVaultById(id: string): Promise<IVaultSchema> {
  const vault = await VaultModel.findById(id)
  if (vault == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Vault not found" })
  }
  return vault
}

export async function updateVault(id: string, input: UpdateVaultInput): Promise<IVaultSchema> {
  const updated = await VaultModel.updateById(id, input)
  if (updated == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Vault not found" })
  }
  return updated
}

export async function deleteVault(id: string): Promise<{ id: string }> {
  await DocumentModel.deleteByVaultId(id)
  const deletedId = await VaultModel.deleteById(id)
  if (deletedId == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Vault not found" })
  }
  return { id: deletedId }
}
