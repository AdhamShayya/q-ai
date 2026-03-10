import { eq, and } from "drizzle-orm"

import { db } from "../index"
import {
  conversations,
  ConversationModelConfig,
  type IConversationSchema,
} from "../schemas/Conversation.schema"
import { BaseModel } from "../base-model"

class ConversationModel extends BaseModel<IConversationSchema> {
  async findByUserId(userId: string): Promise<IConversationSchema[]> {
    return this.findWhere(eq(conversations.userId, userId))
  }

  async findByVaultId(vaultId: string): Promise<IConversationSchema[]> {
    return this.findWhere(eq(conversations.vaultId, vaultId))
  }

  async findByUserAndVault(userId: string, vaultId: string): Promise<IConversationSchema | null> {
    return this.findOneWhere(
      and(eq(conversations.userId, userId), eq(conversations.vaultId, vaultId))!,
    )
  }

  async deleteByVaultId(vaultId: string): Promise<void> {
    await db.delete(conversations).where(eq(conversations.vaultId, vaultId))
  }
}

export default new ConversationModel(ConversationModelConfig, conversations)
