import { type } from "arktype"

import { ark } from "../utils/ark"
import { router, publicProcedure } from "../trpc"
import {
  getOrCreateConversation,
  getConversationMessages,
  addMessage,
} from "../controllers/conversation.controller"

// ── Input schemas ─────────────────────────────────────────────────────────────
const getOrCreateInput = type({ userId: "string", vaultId: "string" })
const byConversationId = type({ conversationId: "string" })
const addMessageInput = type({
  conversationId: "string",
  role: "'user' | 'assistant' | 'system'",
  content: "string >= 1",
})

// ── Router ────────────────────────────────────────────────────────────────────

export const conversationRouter = router({
  getOrCreate: publicProcedure
    .input(ark(getOrCreateInput))
    .query(({ input }) => getOrCreateConversation(input.userId, input.vaultId)),

  getMessages: publicProcedure
    .input(ark(byConversationId))
    .query(({ input }) => getConversationMessages(input.conversationId)),

  addMessage: publicProcedure
    .input(ark(addMessageInput))
    .mutation(({ input }) => addMessage(input.conversationId, input.role, input.content)),
})

export type ConversationRouter = typeof conversationRouter
