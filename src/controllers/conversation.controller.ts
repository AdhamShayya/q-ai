import { TRPCError } from "@trpc/server"

import ConversationModel from "../db/models/Conversation"
import MessageModel from "../db/models/Message"
import type { IConversationSchema } from "../db/schemas/Conversation.schema"
import type { IMessageSchema } from "../db/schemas/Message.schema"

// ── Conversation ──────────────────────────────────────────────────────────────

export async function getOrCreateConversation(
  userId: string,
  vaultId: string,
): Promise<IConversationSchema> {
  const existing = await ConversationModel.findByUserAndVault(userId, vaultId)
  if (existing != null) return existing

  return ConversationModel.create({ userId, vaultId })
}

export async function getConversationMessages(conversationId: string): Promise<IMessageSchema[]> {
  return MessageModel.findByConversationId(conversationId)
}

export async function addMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
): Promise<IMessageSchema> {
  const conversation = await ConversationModel.findById(conversationId)
  if (conversation == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" })
  }
  return MessageModel.create({ conversationId, role, content })
}

// ── Cascade helpers (used by vault deletion) ──────────────────────────────────
export async function deleteConversationsByVaultId(vaultId: string): Promise<void> {
  const convos = await ConversationModel.findByVaultId(vaultId)
  for (const c of convos) {
    await MessageModel.deleteByConversationId(c.id)
  }
  await ConversationModel.deleteByVaultId(vaultId)
}
