import { eq } from "drizzle-orm"

import { BaseModel } from "../base-model"
import { messages, MessageModelConfig, type IMessageSchema } from "../schemas/Message.schema"

class MessageModel extends BaseModel<IMessageSchema> {
  async findByConversationId(conversationId: string): Promise<IMessageSchema[]> {
    return this.findWhere(eq(messages.conversationId, conversationId))
  }
}

export default new MessageModel(MessageModelConfig, messages)
