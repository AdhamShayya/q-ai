import { type } from "arktype"
import { TRPCError } from "@trpc/server"

import { ark } from "../utils/ark"
import { router, publicProcedure } from "../trpc"
import { runAI, type Flashcard } from "../ai"
import { ORM } from "../db/orm"
import FlashcardModel from "../db/models/Flashcard"
import FlashcardReviewModel from "../db/models/FlashcardReview"
import {
  getFlashcards,
  getDueFlashcards,
  reviewFlashcard,
  deleteFlashcard,
  deleteAllFlashcards,
} from "../controllers/flashcard.controller"

// ── Input schemas ─────────────────────────────────────────────────────────────

const vaultUserInput = type({ vaultId: "string", userId: "string" })
const generateInput = type({ vaultId: "string", userId: "string", count: "number" })
const byUserId = type({ userId: "string" })
const reviewInput = type({ flashcardId: "string", userId: "string", rating: "number" })
const byId = type({ id: "string" })

// ── Router ────────────────────────────────────────────────────────────────────

export const flashcardRouter = router({
  generate: publicProcedure.input(ark(generateInput)).mutation(async ({ input }) => {
    const { vaultId, userId, count } = input

    const vault = await ORM.Vault.findById(vaultId)
    if (vault == null) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Vault not found" })
    }

    const aiCards = (await runAI({ type: "flashcards", userId, vaultId })) as Flashcard[]
    if (aiCards.length === 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "No processed content found. Upload and wait for documents to finish processing.",
      })
    }

    const selectedCards = aiCards.slice(0, count)

    // Replace existing cards so re-generating always gives exactly `count` cards
    await deleteAllFlashcards(vaultId, userId)

    const created = []
    for (const card of selectedCards) {
      const saved = await FlashcardModel.create({
        vaultId,
        userId,
        front: card.question,
        back: card.answer,
        sourceContext: card.hint,
      })
      await FlashcardReviewModel.create({
        flashcardId: saved.id,
        userId,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReviewAt: new Date(),
      })
      created.push(saved)
    }

    return created
  }),

  list: publicProcedure
    .input(ark(vaultUserInput))
    .query(({ input }) => getFlashcards(input.vaultId, input.userId)),

  getDue: publicProcedure.input(ark(byUserId)).query(({ input }) => getDueFlashcards(input.userId)),

  review: publicProcedure
    .input(ark(reviewInput))
    .mutation(({ input }) => reviewFlashcard(input.flashcardId, input.userId, input.rating)),

  delete: publicProcedure.input(ark(byId)).mutation(({ input }) => deleteFlashcard(input.id)),

  deleteAll: publicProcedure
    .input(ark(vaultUserInput))
    .mutation(({ input }) => deleteAllFlashcards(input.vaultId, input.userId)),
})

export type FlashcardRouter = typeof flashcardRouter
