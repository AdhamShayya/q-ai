import { and, eq, inArray, lte } from "drizzle-orm"
import { db } from "../index"
import { BaseModel } from "../base-model"
import { flashcards } from "../schemas/Flashcard.schema"
import {
  flashcardReviews,
  FlashcardReviewModelConfig,
  type IFlashcardReviewSchema,
} from "../schemas/FlashcardReview.schema"

class FlashcardReviewModel extends BaseModel<IFlashcardReviewSchema> {
  async findByFlashcardAndUser(
    flashcardId: string,
    userId: string,
  ): Promise<IFlashcardReviewSchema | null> {
    return this.findOneWhere(
      and(eq(flashcardReviews.flashcardId, flashcardId), eq(flashcardReviews.userId, userId))!,
    )
  }

  async findDueByUser(userId: string): Promise<IFlashcardReviewSchema[]> {
    const rows = await db
      .select()
      .from(flashcardReviews)
      .where(
        and(eq(flashcardReviews.userId, userId), lte(flashcardReviews.nextReviewAt, new Date()))!,
      )
    return rows as unknown as IFlashcardReviewSchema[]
  }

  async deleteByFlashcardId(flashcardId: string): Promise<void> {
    await db.delete(flashcardReviews).where(eq(flashcardReviews.flashcardId, flashcardId))
  }

  /** Bulk-delete all reviews for every flashcard in a vault — one query. */
  async deleteByVaultId(vaultId: string): Promise<void> {
    const cardIds = await db
      .select({ id: flashcards.id })
      .from(flashcards)
      .where(eq(flashcards.vaultId, vaultId))
    if (cardIds.length === 0) return
    await db.delete(flashcardReviews).where(
      inArray(
        flashcardReviews.flashcardId,
        cardIds.map((c) => c.id),
      ),
    )
  }
}

export default new FlashcardReviewModel(FlashcardReviewModelConfig, flashcardReviews)
