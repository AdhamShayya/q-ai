import { TRPCError } from "@trpc/server"

import FlashcardModel from "../db/models/Flashcard"
import FlashcardReviewModel from "../db/models/FlashcardReview"
import type { IFlashcardSchema } from "../db/schemas/Flashcard.schema"
import type { IFlashcardReviewSchema } from "../db/schemas/FlashcardReview.schema"

// ── SM-2 Algorithm ────────────────────────────────────────────────────────────

function computeNextReview(
  rating: number, // 0–5
  current: { easeFactor: number; interval: number; repetitions: number },
): { easeFactor: number; interval: number; repetitions: number; nextReviewAt: Date } {
  let { easeFactor, interval, repetitions } = current

  if (rating < 3) {
    // Failed recall — reset
    repetitions = 0
    interval = 1
  } else {
    // Successful recall
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)

    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
    repetitions += 1
  }

  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + interval)

  return { easeFactor, interval, repetitions, nextReviewAt }
}

// ── Controller ────────────────────────────────────────────────────────────────

export interface FlashcardWithReview {
  card: IFlashcardSchema
  review: IFlashcardReviewSchema | null
}

export async function getFlashcards(
  vaultId: string,
  userId: string,
): Promise<FlashcardWithReview[]> {
  const cards = await FlashcardModel.findByVaultAndUser(vaultId, userId)
  const result: FlashcardWithReview[] = []
  for (const card of cards) {
    const review = await FlashcardReviewModel.findByFlashcardAndUser(card.id, userId)
    result.push({ card, review })
  }
  return result
}

export async function getDueFlashcards(userId: string): Promise<FlashcardWithReview[]> {
  const dueReviews = await FlashcardReviewModel.findDueByUser(userId)
  const result: FlashcardWithReview[] = []
  for (const review of dueReviews) {
    const card = await FlashcardModel.findById(review.flashcardId)
    if (card != null) result.push({ card, review })
  }
  return result
}

export async function reviewFlashcard(
  flashcardId: string,
  userId: string,
  rating: number,
): Promise<IFlashcardReviewSchema> {
  const existing = await FlashcardReviewModel.findByFlashcardAndUser(flashcardId, userId)
  const current = existing ?? { easeFactor: 2.5, interval: 1, repetitions: 0 }
  const next = computeNextReview(Math.max(0, Math.min(5, Math.round(rating))), current)

  if (existing != null) {
    const updated = await FlashcardReviewModel.updateById(existing.id, {
      ...next,
      lastReviewedAt: new Date(),
    })
    if (updated == null) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save review" })
    }
    return updated
  }

  return FlashcardReviewModel.create({
    flashcardId,
    userId,
    ...next,
    lastReviewedAt: new Date(),
  })
}

export async function deleteFlashcard(id: string): Promise<{ id: string }> {
  await FlashcardReviewModel.deleteByFlashcardId(id)
  const deletedId = await FlashcardModel.deleteById(id)
  if (deletedId == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Flashcard not found" })
  }
  return { id: deletedId }
}

export async function deleteAllFlashcards(
  vaultId: string,
  userId: string,
): Promise<{ count: number }> {
  const cards = await FlashcardModel.findByVaultAndUser(vaultId, userId)
  // Bulk-delete all reviews in one query, then bulk-delete the cards
  await FlashcardReviewModel.deleteByVaultId(vaultId)
  await FlashcardModel.deleteByVaultId(vaultId)
  return { count: cards.length }
}
