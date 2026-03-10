import { eq } from "drizzle-orm"
import { asc } from "drizzle-orm"

import { db } from "../index"
import { BaseModel } from "../base-model"
import { messages, MessageModelConfig, type IMessageSchema } from "../schemas/Message.schema"

class MessageModel extends BaseModel<IMessageSchema> {
  async findByConversationId(conversationId: string): Promise<IMessageSchema[]> {
    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))
    return rows as unknown as IMessageSchema[]
  }

  async deleteByConversationId(conversationId: string): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, conversationId))
  }
}

export default new MessageModel(MessageModelConfig, messages)
