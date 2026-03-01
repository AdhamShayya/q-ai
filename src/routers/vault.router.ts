import { type } from "arktype"

import { ark } from "../utils/ark"
import { router, publicProcedure } from "../trpc"

import {
  createVault,
  getVaultsByUserId,
  getVaultById,
  updateVault,
  deleteVault,
} from "../controllers/vault.controller"
import {
  addDocument,
  getDocumentsByVaultId,
  getDocumentById,
  deleteDocument,
} from "../controllers/document.controller"

// ── Input schemas ─────────────────────────────────────────────────────────────

const createVaultInput = type({
  userId: "string",
  name: "string >= 1",
  "courseName?": "string",
  "description?": "string",
})

const updateVaultInput = type({
  id: "string",
  "name?": "string >= 1",
  "courseName?": "string",
  "description?": "string",
})

const addDocumentInput = type({
  vaultId: "string",
  filename: "string >= 1",
  fileType: "string >= 1",
  fileSize: "number.integer > 0",
  "mimeType?": "string",
  courseVault: "string >= 1",
})

const byId = type({ id: "string" })
const byUserId = type({ userId: "string" })
const byVaultId = type({ vaultId: "string" })

// ── Router ────────────────────────────────────────────────────────────────────

export const vaultRouter = router({
  // ── Vault procedures ───────────────────────────────────────────────────────
  create: publicProcedure.input(ark(createVaultInput)).mutation(({ input }) => createVault(input)),

  listByUser: publicProcedure
    .input(ark(byUserId))
    .query(({ input }) => getVaultsByUserId(input.userId)),

  getById: publicProcedure.input(ark(byId)).query(({ input }) => getVaultById(input.id)),

  update: publicProcedure
    .input(ark(updateVaultInput))
    .mutation(({ input }) => updateVault(input.id, input)),

  delete: publicProcedure.input(ark(byId)).mutation(({ input }) => deleteVault(input.id)),

  // ── Document procedures ────────────────────────────────────────────────────
  addDocument: publicProcedure
    .input(ark(addDocumentInput))
    .mutation(({ input }) => addDocument(input)),

  getDocuments: publicProcedure
    .input(ark(byVaultId))
    .query(({ input }) => getDocumentsByVaultId(input.vaultId)),

  getDocument: publicProcedure.input(ark(byId)).query(({ input }) => getDocumentById(input.id)),

  deleteDocument: publicProcedure
    .input(ark(byId))
    .mutation(({ input }) => deleteDocument(input.id)),
})

export type VaultRouter = typeof vaultRouter
