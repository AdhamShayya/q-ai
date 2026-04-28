import { type } from "arktype"
import { TRPCError } from "@trpc/server"

import { ark } from "../utils/ark"
import { router, publicProcedure } from "../trpc"
import {
  getOrCreateConversation,
  getConversationMessages,
  addMessage,
} from "../controllers/conversation.controller"
import UserModel from "../db/models/User"
import MessageModel from "../db/models/Message"
import { runAI, type ChatResponse } from "../ai"

// ── Limits ────────────────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  free: { docs: 4, chats: 10 },
  premium: { docs: 30, chats: Infinity },
} as const

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
const countInput = type({ userId: "string" })

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

  /** Returns the total number of user-sent chat messages for this user. */
  countUserMessages: publicProcedure
    .input(ark(countInput))
    .query(({ input }) => MessageModel.countByUserId(input.userId)),

  chat: publicProcedure.input(ark(chatInput)).mutation(async ({ input, ctx }) => {
    const { userId, vaultId, message, conversationId } = input

    // ── Enforce chat limit for free users ─────────────────────────────────────
    const user = await UserModel.findById(userId)
    const tier = user?.subscriptionTier ?? "free"
    const limit = PLAN_LIMITS[tier === "premium" ? "premium" : "free"].chats

    if (limit !== Infinity) {
      const usedChats = await MessageModel.countByUserId(userId)
      if (usedChats >= limit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Chat limit reached. Upgrade to Premium for unlimited conversations.",
        })
      }
    }

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
