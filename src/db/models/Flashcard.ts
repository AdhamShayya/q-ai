import { and, eq } from "drizzle-orm"
import { db } from "../index"
import { BaseModel } from "../base-model"
import {
  flashcards,
  FlashcardModelConfig,
  type IFlashcardSchema,
} from "../schemas/Flashcard.schema"

class FlashcardModel extends BaseModel<IFlashcardSchema> {
  async findByVaultAndUser(vaultId: string, userId: string): Promise<IFlashcardSchema[]> {
    return this.findWhere(and(eq(flashcards.vaultId, vaultId), eq(flashcards.userId, userId))!)
  }

  async findByUser(userId: string): Promise<IFlashcardSchema[]> {
    return this.findWhere(eq(flashcards.userId, userId))
  }

  async deleteByVaultId(vaultId: string): Promise<void> {
    await db.delete(flashcards).where(eq(flashcards.vaultId, vaultId))
  }
}

export default new FlashcardModel(FlashcardModelConfig, flashcards)
