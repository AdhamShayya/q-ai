import { type } from "arktype"

import { ark } from "../utils/ark"
import { router, publicProcedure } from "../trpc"
import {
  getOrCreateConversation,
  getConversationMessages,
  addMessage,
} from "../controllers/conversation.controller"
import { runAI, type ChatResponse } from "../ai"

// ── Input schemas ─────────────────────────────────────────────────────────────
const getOrCreateInput = type({ userId: "string", vaultId: "string" })
const byConversationId = type({ conversationId: "string" })
const addMessageInput = type({
  conversationId: "string",
  role: "'user' | 'assistant' | 'system'",
  content: "string >= 1",
})
const chatInput = type({
  userId: "string",
  vaultId: "string",
  message: "string >= 1",
  "conversationId?": "string",
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

  chat: publicProcedure.input(ark(chatInput)).mutation(async ({ input }) => {
    const { userId, vaultId, message, conversationId } = input
    const conv = await getOrCreateConversation(userId, vaultId)
    const convId = conversationId ?? conv.id
    await addMessage(convId, "user", message)
    const result = (await runAI({
      type: "chat",
      userId,
      vaultId,
      message,
      conversationId: convId,
    })) as ChatResponse
    await addMessage(convId, "assistant", result.answer)
    return { answer: result.answer, contextUsed: result.contextUsed, conversationId: convId }
  }),
})

export type ConversationRouter = typeof conversationRouter
