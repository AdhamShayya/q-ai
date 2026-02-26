import { eq } from "drizzle-orm"

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
}

export default new ConversationModel(ConversationModelConfig, conversations)
